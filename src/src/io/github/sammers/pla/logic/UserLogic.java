package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.BlizzardAPI;
import io.github.sammers.pla.blizzard.BlizzardTokenResponse;
import io.github.sammers.pla.blizzard.UsersCharacter;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.*;
import io.github.sammers.pla.db.Character;
import io.reactivex.rxjava3.core.Completable;
import io.reactivex.rxjava3.core.Single;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Class with user related logic
 */
public class UserLogic {
  public static Logger log = LoggerFactory.getLogger(UserLogic.class);
  private final BlizzardAPI blizzardAPI;
  private final CharacterCache characterCache;
  private final CharUpdater charUpdater;
  private final DB db;
  private final static int LEVEL = 70;

  public UserLogic(BlizzardAPI blizzardAPI, CharacterCache characterCache, DB db, CharUpdater charUpdater) {
    this.blizzardAPI = blizzardAPI;
    this.characterCache = characterCache;
    this.db = db;
    this.charUpdater = charUpdater;
  }

  public Single<Optional<User>> getUserByCookie(String cookie) {
    return db.getUserBySession(cookie).map(userOpt -> {
      if (userOpt.isEmpty()) {
        return Optional.<User> empty();
      }
      User user = userOpt.get();
      log.info("Found user by cookie: {}", user.battleNetInfo().battletag());
      List<UsersCharacter> enrichedCharacters = user.characters().stream().map(c -> {
        WowAPICharacter resolved = characterCache.getByFullName(Character.fullNameByRealmAndName(c.name(), c.realm()));
        if (resolved != null) {
          return c.withResolved(resolved);
        }
        return c;
      }).toList();
      return Optional
        .of(new User(user.battleNetInfo(), enrichedCharacters, user.battleNetAccessToken(), user.sessions()));
    }).onErrorReturnItem(Optional.empty());
  }

  public Single<User> updateUsersCharacters(User user) {
    Optional<BattleNetAccessToken> battleNetAccessToken = user.battleNetAccessToken();
    if (battleNetAccessToken.isEmpty()) {
      return Single.error(new IllegalStateException("BattleNet access token is empty."));
    }
    String accessToken = battleNetAccessToken.get().accessToken();
    String battleTag = user.battleNetInfo().battletag();
    log.info("Updating characters for user: {}", battleTag);
    Single<List<UsersCharacter>> euChars = blizzardAPI.userCharacters(accessToken, "eu")
      .doOnSuccess(chars -> log.info("Fetched {} EU characters for {}", chars.size(), battleTag))
      .doOnError(e -> log.error("Failed to fetch EU characters for {}", battleTag, e));
    Single<List<UsersCharacter>> usChars = blizzardAPI.userCharacters(accessToken, "us")
      .doOnSuccess(chars -> log.info("Fetched {} US characters for {}", chars.size(), battleTag))
      .doOnError(e -> log.error("Failed to fetch US characters for {}", battleTag, e));
    return Single.zip(euChars, usChars, (eu, us) -> {
      List<UsersCharacter> all = new ArrayList<>(eu);
      all.addAll(us);
      log.info("Total characters fetched for {}: {}", battleTag, all.size());
      return all;
    }).flatMap(list -> {
      User newUsr = user.withNewCharacters(list);
      return db.upsertUser(newUsr).andThen(Single.just(newUsr));
    }).flatMap(newUsr -> updateUsersWowApiChars(newUsr).andThen(Single.just(newUsr)));
  }

  public Single<User> createOrUpdateUser(BlizzardTokenResponse tokenResponse) {
    String accessToken = tokenResponse.accessToken();
    return blizzardAPI.userInfo(accessToken).flatMap(userInfo -> {
      BattleNetInfo bni = new BattleNetInfo(userInfo.getLong("id"), userInfo.getString("battletag"));
      log.info("Creating or updating user: {}", bni.battletag());
      String sessionId = UUID.randomUUID().toString();
      Instant now = Instant.now();
      Instant expiresAt = tokenResponse.expiresAt() != null
        ? tokenResponse.expiresAt().toInstant()
        : now.plusSeconds(3600);
      BattleNetAccessToken bnToken = new BattleNetAccessToken(accessToken, now, expiresAt);
      PvPQNetSession newSession = new PvPQNetSession(sessionId, now,
        now.plus(ChronoUnit.DAYS.getDuration().multipliedBy(180)));
      return db.getUser(bni.id()).map(userOpt -> {
        if (userOpt.isPresent()) {
          User existingUser = userOpt.get();
          List<PvPQNetSession> activeSessions = existingUser.sessions()
            .stream()
            .filter(s -> !s.isExpired())
            .collect(Collectors.toCollection(ArrayList::new));
          activeSessions.add(newSession);
          return new User(bni, existingUser.characters(), Optional.of(bnToken), activeSessions);
        } else {
          return new User(bni, new ArrayList<>(), Optional.of(bnToken), List.of(newSession));
        }
      });
    }).flatMap(user -> db.upsertUser(user).andThen(Single.just(user))).flatMap(this::updateUsersCharacters);
  }

  public Completable updateUsersWowApiChars(User user) {
    List<UsersCharacter> characters = user.characters();
    Set<Long> ids = characters.stream().map(UsersCharacter::id).collect(Collectors.toSet());
    String battleTag = user.battleNetInfo().battletag();
    log.info("Starting character update for user {}, total characters: {}", battleTag, characters.size());
    List<Single<Optional<WowAPICharacter>>> updateTasks = characters.stream()
      .filter(ch -> ch.level() >= LEVEL)
      .map(ch -> charUpdater.updateChar(ch.region(), ch.fullName(), false).doOnSuccess(success -> {
        if (success.isPresent()) {
          log.info("Successfully updated character {} for user {}", ch.fullName(), battleTag);
        } else {
          log.warn("Failed to update character {} for user {} (not found or error)", ch.fullName(), battleTag);
        }
      }).onErrorReturn(e -> {
        log.error("Failed to update character {} for user {}", ch.fullName(), battleTag, e);
        return Optional.empty();
      }))
      .collect(Collectors.toList());
    return Single.merge(updateTasks).toList().flatMapCompletable(results -> {
      List<WowAPICharacter> updatedCharacters = results.stream().flatMap(Optional::stream).toList();
      long successCount = updatedCharacters.size();
      long failCount = results.size() - successCount;
      log.info("Character update finished for user {}. Updated: {}, Failed: {}", battleTag, successCount, failCount);
      if (updatedCharacters.isEmpty()) {
        return Completable.complete();
      }
      List<WowAPICharacter> withUpdatedAlts = updatedCharacters.stream().map(ch -> {
        Set<Long> alts = new HashSet<>(ids);
        alts.remove(ch.id());
        return ch.changeAlts(alts);
      }).toList();
      return db.bulkUpdateChars(withUpdatedAlts)
        .ignoreElement()
        .doOnComplete(() -> withUpdatedAlts.forEach(characterCache::upsert))
        .onErrorResumeNext(e -> {
          log.error("Failed to bulk update user characters alts for user {}", battleTag, e);
          return Completable.complete();
        });
    });
  }
}
