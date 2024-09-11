package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.*;
import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.DB;
import io.github.sammers.pla.db.Meta;
import io.github.sammers.pla.db.Snapshot;
import io.reactivex.Completable;
import io.reactivex.Maybe;
import io.reactivex.Observable;
import io.reactivex.Single;
import io.vertx.reactivex.core.buffer.Buffer;
import io.vertx.reactivex.ext.web.client.HttpRequest;
import io.vertx.reactivex.ext.web.client.WebClient;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static io.github.sammers.pla.Main.VTHREAD_SCHEDULER;
import static io.github.sammers.pla.blizzard.BlizzardAPI.oldRegion;
import static io.github.sammers.pla.blizzard.BlizzardAPI.realRegion;
import static io.github.sammers.pla.logic.Conts.*;
import static java.util.concurrent.TimeUnit.*;

public class Ladder {

    private static final Logger log = LoggerFactory.getLogger(Ladder.class);
    private final WebClient web;
    private final Refs refs;
    public final CharacterCache characterCache;
    private final Map<String, AtomicReference<Meta>> meta = new ConcurrentHashMap<>();
    private final NickNameSearchIndex charSearchIndex = new NickNameSearchIndex();
    public final Map<String, Cutoffs> regionCutoff;
    public final Map<String, Cutoffs> regionCutoffFromDb;
    public final AtomicReference<Realms> realms = new AtomicReference<>(new Realms(new HashMap<>()));
    public final CharUpdater charUpdater;
    private final DB db;
    private final BlizzardAPI blizzardAPI;

    private final AtomicBoolean charsLoaded = new AtomicBoolean(false);

    public Ladder(WebClient web, DB db, BlizzardAPI blizzardAPI, CharacterCache characterCache, Refs refs, Map<String, Cutoffs> regionCutoff) {
        this.web = web;
        this.db = db;
        this.blizzardAPI = blizzardAPI;
        this.refs = refs;
        this.characterCache = characterCache;
        this.regionCutoff = regionCutoff;
        this.charUpdater = new CharUpdater(blizzardAPI, characterCache, charsLoaded, refs, charSearchIndex, db);
        this.regionCutoffFromDb = new ConcurrentHashMap<>();
    }

    @SuppressWarnings("unchecked")
    public void start() {
        boolean updatesEnabled = true;
        int euPeriod = 5;
        int usPeriod = 10;
        Observable<Long> updates;
        if (updatesEnabled) {
            updates = Observable.mergeArray(runDataUpdater(EU, 1, MINUTES, new AtomicBoolean(false), new AtomicLong(System.nanoTime()), Observable.defer(() -> {
                int initialDelay = Calculator.minutesTillNextMins(euPeriod);
                return Observable.interval(initialDelay, euPeriod, MINUTES);
            })), runDataUpdater(US, 1, MINUTES, new AtomicBoolean(false), new AtomicLong(System.nanoTime()), Observable.defer(() -> {
                int initialDelay = Calculator.minutesTillNextMins(usPeriod);
                return Observable.interval(initialDelay, usPeriod, MINUTES);
            })));
        } else {
            updates = Observable.never();
        }
        loadRealms()
            .andThen(loadRegionData(EU))
            .andThen(loadRegionData(US))
            .andThen(charsAreLoaded())
            .andThen(updates).doOnError(e -> log.error("Error fetching ladder", e))
            .onErrorReturnItem(0L).subscribe();
        Observable.interval(24, 24, HOURS).flatMapCompletable(tick -> {
            log.info("Updating realms");
            return updateRealms(EU).andThen(updateRealms(US));
        }).subscribe();
    }

    private Completable charsAreLoaded() {
        return Completable.fromAction(() -> {
            charsLoaded.set(true);
            log.info("Chars are loaded. Updates are allowed now");
        });
    }

    private Observable<Long> runDataUpdater(String region, int timeout, TimeUnit timeoutUnits, AtomicBoolean running, AtomicLong lastSetToTrue, Observable<Long> obs) {
        return obs.flatMapSingle(obst -> {
            if (running.compareAndSet(false, true)) {
                lastSetToTrue.set(System.nanoTime());
                long tick = System.nanoTime();
                log.info("Starting data updater for region=" + region);
                return loadCutoffs(region)
                    .andThen(blitz(region).ignoreElement())
                    .andThen(threeVThree(region).ignoreElement())
                    .andThen(twoVTwo(region).ignoreElement())
                    .andThen(battlegrounds(region).ignoreElement())
                    .andThen(shuffle(region).ignoreElement())
                    .andThen(updateCutoffs(region))
                    .andThen(loadCutoffsFromDb(region))
                    .andThen(calculateMulticlasserLeaderboard(region))
                    .andThen(calculateMeta(region))
                    .andThen(charUpdater.updateCharacters(region, 2, DAYS, timeout, timeoutUnits)).onErrorComplete(e -> {
                        log.error("Error updating data for region {}", region, e);
                        return true;
                    }).andThen(Single.just(tick)).doAfterTerminate(() -> {
                        running.set(false);
                    }).map(t -> {
                        log.info("Data updater for " + region + " has been finished in " + (System.nanoTime() - tick) / 1_000_000_000 + " seconds");
                        return t;
                    });
            } else {
                log.info("Data updater for " + region + " is already running, skipping");
                if (System.nanoTime() - lastSetToTrue.get() > HOURS.toNanos(1)) {
                    log.warn("Data updater for " + region + " is running for more than 1 hour, resetting the lock");
                    running.set(false);
                }
                return Single.just(System.nanoTime());
            }
        });
    }

    public Completable loadRealms() {
        return Completable.defer(() -> db.loadRealms().map((Realms newValue) -> {
            Realms merge = realms.get().merge(newValue);
            realms.set(merge);
            return merge;
        }).ignoreElement());
    }

    public Completable updateRealms(String region) {
        return Completable.defer(() -> blizzardAPI.realms(region).flatMapCompletable(nRealms -> {
            realms.set(nRealms.merge(realms.get()));
            return db.insertRealms(nRealms);
        }));
    }

    public Completable loadRegionData(String region) {
        return loadCutoffs(region)
            .andThen(loadCutoffsFromDb(region))
            .andThen(loadLast(TWO_V_TWO, region))
            .andThen(loadLast(THREE_V_THREE, region))
            .andThen(loadLast(RBG, region))
            .andThen(loadLast(SHUFFLE, region))
            .andThen(loadLast(BLITZ, region))
            .andThen(updateCutoffs(region))
            .andThen(loadCutoffsFromDb(region))
            .andThen(calculateMeta(region))
            .andThen(loadWowCharApiData(region))
            .andThen(calculateMulticlasserLeaderboard(region));
    }

    private Completable calculateMulticlasserLeaderboard(String region) {
        return Completable.defer(() -> {
            log.info("Calculating multiclasser leaderboard for region " + region);
            Snapshot snapshot = refs.refByBracket(SHUFFLE, region).get();
            Multiclassers multiclassers = Calculator.calculateMulticlassers(snapshot, characterCache, regionCutoff.get(region));
            List.of(Multiclassers.Role.ALL,
                Multiclassers.Role.MELEE,
                Multiclassers.Role.RANGED,
                Multiclassers.Role.DPS,
                Multiclassers.Role.HEALER,
                Multiclassers.Role.TANK).forEach(role -> {
                Multiclassers forRole = multiclassers.forRole(role);
                refs.refMulticlassers(role, region).set(forRole);
            });
            return Completable.complete();
        });
    }

    public Single<Snapshot> threeVThree(String region) {
        String bracket = "3v3";
        return fetchLadder(bracket, region);
    }

    public Single<Snapshot> twoVTwo(String region) {
        String bracket = "2v2";
        return fetchLadder(bracket, region);
    }

    public Single<Snapshot> battlegrounds(String region) {
        String bracket = "battlegrounds";
        return fetchLadder(bracket, region);
    }

    public Single<Snapshot> shuffle(String region) {
        String bracket = "shuffle";
        return fetchLadder(bracket, region);
    }

    public Single<Snapshot> blitz(String region) {
        return fetchLadder(BLITZ, region);
    }

    public Optional<WowAPICharacter> wowChar(String realm, String name) {
        return Optional.ofNullable(characterCache.getByFullName(Character.fullNameByRealmAndName(name, realm)));
    }

    public List<SearchResult> search(String name) {
        return charSearchIndex.searchNickNames(name);
    }

    public Single<Snapshot> fetchLadder(String bracket, String region) {
        return fetchLadder(bracket, region, true);
    }

    public Single<List<Character>> pureBlizzardApiFetch(String bracket, String region) {
        Single<List<Character>> resCharList;
        if (ZOLO_BRACKETS.contains(bracket)) {
            List<String> zoloSepcs = zoloSpecList(bracket);
            Single<List<Character>> res = Single.just(new ArrayList<>(5000 * zoloSepcs.size()));
            for (String zoloSpec : zoloSepcs) {
                Single<List<Character>> sh = Single.just(new ArrayList<>(zoloSepcs.size()));
                String specForBlizApi = zoloSpec.replaceAll("/", "-");
                sh = sh.flatMap(thisSpecChars -> blizzardAPI.pvpLeaderboard(specForBlizApi, region).flatMapSingle(leaderboard -> {
                    Set<Character> chrs = leaderboard.toCharacters(characterCache, zoloSpec);
                    thisSpecChars.addAll(chrs);
                    return Single.just(thisSpecChars);
                }));
                Single<List<Character>> finalSh = sh;
                res = res.flatMap(characters -> finalSh.map(s -> {
                    characters.addAll(s);
                    return characters;
                }));
            }
            resCharList = res.map(chars -> {
                chars.sort(Comparator.comparing(Character::rating).reversed());
                return chars;
            });
        } else {
            Single<List<Character>> res = Single.just(new ArrayList<>(5000));
            resCharList = res.flatMap(s -> blizzardAPI.pvpLeaderboard(bracket, region).flatMapSingle(leaderboard -> {
                Set<Character> chrs = leaderboard.toCharacters(characterCache, bracket);
                s.addAll(chrs);
                return Single.just(s);
            }));
        }
        return resCharList;
    }

    public Single<Snapshot> fetchLadder(String bracket, String region, boolean newWay) {
        Single<List<Character>> resCharList;
        if (newWay) {
            resCharList = pureBlizzardApiFetch(bracket, region).flatMap(chars -> {
                Map<String, Character> pureleyFetchedChars = new HashMap<>();
                Function<Character, String> idf;
                if (ZOLO_BRACKETS.contains(bracket)) {
                    idf = Character::fullNameWSpec;
                } else {
                    idf = Character::fullName;
                }
                chars.forEach(c -> pureleyFetchedChars.put(idf.apply(c), c));
                return ladderPageFetch(bracket, region).map(ladderPageFetched -> {
                    long pureSize = pureleyFetchedChars.size();
                    for (Character c : ladderPageFetched) {
                        pureleyFetchedChars.putIfAbsent(idf.apply(c), c);
                    }
                    long addedFromLadderPage = pureleyFetchedChars.size() - pureSize;
                    log.info("Pure fetched: {}, added from ladder page: {}, total: {}", pureSize, addedFromLadderPage, pureleyFetchedChars.size());
                    List<Character> res = new ArrayList<>();
                    res.addAll(pureleyFetchedChars.values());
                    res.sort(Comparator.comparing(Character::rating).reversed());
                    // limit to first 50k chars
                    res = res.stream().limit(50000).collect(Collectors.toList());
                    return res;
                });
            });
        } else {
            resCharList = ladderPageFetch(bracket, region);
        }
        return resCharList.map(chars -> Snapshot.of(chars, region, System.currentTimeMillis()))
            .flatMap(d -> newDataOnBracket(bracket, region, d).andThen(Single.just(d)))
            .doOnError(e -> log.error("Error fetching ladder, returning empty snapshot", e))
            .onErrorReturnItem(Snapshot.empty(region));
    }

    public Single<List<Character>> ladderPageFetch(String bracket, String region) {
        Single<List<Character>> resCharList;
        if (ZOLO_BRACKETS.contains(bracket)) {
            List<String> zoloSpecs = zoloSpecList(bracket);
            Single<List<Character>> res = Single.just(new ArrayList<>(1000 * zoloSpecs.size()));
            for (String shuffleSpec : zoloSpecs) {
                Single<List<Character>> sh = Single.just(new ArrayList<>(zoloSpecs.size()));
                for (int i = 1; i <= 10; i++) {
                    int finalI = i;
                    sh = sh.flatMap(characters -> ladderShuffle(shuffleSpec, finalI, region).map(c -> {
                        characters.addAll(c);
                        return characters;
                    }));
                }
                String specForBlizApi = shuffleSpec.replaceAll("/", "-");
                sh = sh.flatMap(s -> blizzardAPI.pvpLeaderboard(specForBlizApi, region).map(leaderboard -> leaderboard.enrich(s)).toSingle(s));
                Single<List<Character>> finalSh = sh;
                res = res.flatMap(characters -> finalSh.map(s -> {
                    characters.addAll(s);
                    return characters;
                }));
            }
            resCharList = res.map(chars -> {
                chars.sort(Comparator.comparing(Character::rating).reversed());
                return chars;
            });
        } else {
            Single<List<Character>> res = Single.just(new ArrayList<>(1000));
            for (int i = 1; i <= 10; i++) {
                int finalI = i;
                res = res.flatMap(characters -> ladderTraditional(bracket, finalI, region).map(c -> {
                    characters.addAll(c);
                    return characters;
                }));
            }
            resCharList = res.flatMap(s -> {
                Maybe<List<Character>> map = blizzardAPI.pvpLeaderboard(bracket, region).map((PvpLeaderBoard leaderboard) -> {
                    Set<Character> enriched = new HashSet<>(leaderboard.enrich(s));
                    return enriched.stream().toList();
                });
                return map.toSingle(s);
            });
        }
        return resCharList;
    }

    private HttpRequest<Buffer> ladderRequest(String bracket, Integer page, String region) {
        String url = String.format("https://worldofwarcraft.blizzard.com/%s/game/pvp/leaderboards/%s", region, bracket);
        HttpRequest<Buffer> request = web.getAbs(url).addQueryParam("page", page.toString());
        return request;
    }

    public Single<List<Character>> ladderShuffle(String bracket, Integer page, String region) {
        return ladderRequest(bracket, page, region).rxSend().map(ok -> {
            String ers = ok.bodyAsString();
            Document parse = Jsoup.parse(ers);
            Elements select = parse.select("#main > div.Pane.Pane--dirtBlue.bordered > div.Pane-content > div.Paginator > div.Paginator-pages > div:nth-child(1) > div > div.SortTable-body");
            if (select.size() == 0) {
                return new ArrayList<Character>();
            } else {
                Element element = select.get(0);
                List<Node> nodes = element.childNodes();
                List<Character> characters = nodes.stream().map(Node::childNodes).map(nodeList -> {
                    Node nameNode = nodeList.get(2);
                    Long pos = Long.parseLong(nodeList.get(0).attr("data-value"));
                    Long rating = Long.parseLong(((Element) nodeList.get(1).childNode(0).childNode(0).childNode(0).childNode(1)).text());
                    String name = nameNode.attr("data-value");
                    String[] splitted = bracket.split("/");
                    String clazz = nodeList.get(3).attr("data-value");
                    String specName = splitted[2].substring(0, 1).toUpperCase() + splitted[2].substring(1);
                    String fullSpec = (specName + " " + clazz).trim();
                    String fraction = nodeList.get(5).attr("data-value");
                    String realm = Calculator.realmCalc(nodeList.get(6).attr("data-value"));
                    Long wins = Long.parseLong(nodeList.get(7).attr("data-value"));
                    Long losses = Long.parseLong(nodeList.get(8).attr("data-value"));
                    return enrichWithSpecialData(new Character(pos, rating, false, name, clazz, fullSpec, fraction, "", "", realm, wins, losses, Optional.empty()), bracket, region);
                }).toList();
                return characters;
            }
        }).doOnSuccess(ok -> log.debug(String.format("%s-%s ladder has been fetched page=%s", region, bracket, page))).doOnError(err -> log.error(String.format("ERR %s %s %s", region, bracket, page), err));
    }

    private Character enrichWithSpecialData(Character character, String region, String bracket) {
        Optional<WowAPICharacter> apiCharacter = Optional.ofNullable(characterCache.getByFullName(character.fullName()));
        String gender = apiCharacter.map(WowAPICharacter::gender).orElse("unknown");
        String race = apiCharacter.map(WowAPICharacter::race).orElse("unknown");
        Cutoffs cutoffs = regionCutoff.get(region);
        boolean inCutoff = false;
        if (cutoffs == null) {
            inCutoff = false;
        } else if (bracket.equals("3v3")) {
            Long cutRating = cutoffs.threeVThree();
            inCutoff = character.rating() >= cutRating;
        } else if (bracket.equals("battlegrounds")) {
            Long cutRating = cutoffs.battlegrounds(character.fraction());
            inCutoff = character.rating() >= cutRating;
        } else if (bracket.startsWith("shuffle")) {
            String[] split = bracket.split("/");
            String specialization = split[2];
            String shuffleClass = split[1];
            if (specialization.equals("frost") && shuffleClass.equals("mage")) {
                specialization = "frostm";
            } else if (specialization.equals("frost") && shuffleClass.equals("deathknight")) {
                specialization = "frostd";
            }
            Long ct = cutoffs.shuffle(specialization);
            Long cutRating = ct == null ? 0 : ct;
            inCutoff = character.rating() >= cutRating;
        }
        return new Character(
            character.pos(),
            character.rating(),
            inCutoff,
            character.name(),
            character.clazz(),
            character.fullSpec(),
            character.fraction(),
            gender,
            race,
            character.realm(),
            character.wins(),
            character.losses(),
            apiCharacter.map(WowAPICharacter::petHash)
        );
    }

    public Single<List<Character>> ladderTraditional(String bracket, Integer page, String region) {
        return ladderRequest(bracket, page, region).rxSend().map(ok -> {
            int code = ok.statusCode();
            if (code != 200) {
                log.info("NON 200 code " + code);
                return new ArrayList<Character>();
            }
            String ers = ok.bodyAsString();
            Document parse = Jsoup.parse(ers);
            Elements select = parse.select("#main > div.Pane.Pane--dirtBlue.bordered > div.Pane-content > div.Paginator > div.Paginator-pages > div:nth-child(1) > div > div.SortTable-body");
            if (select.size() == 0) {
                return new ArrayList<Character>();
            } else {
                Element element = select.get(0);
                List<Node> nodes = element.childNodes();
                List<Character> characters = nodes.stream().map(Node::childNodes).map(nodeList -> {
                    Node nameNode = nodeList.get(2);
                    String fullSpec = "UNKNOWN";
                    try {
                        Node specNode = nameNode.childNode(0).childNode(0).childNode(0).childNode(2).childNode(2);
                        fullSpec = ((Element) specNode).text().substring(2);
                    } catch (Exception e) {
                    }
                    Long pos = Long.parseLong(nodeList.get(0).attr("data-value"));
                    Long rating = Long.parseLong(((Element) nodeList.get(1).childNode(0).childNode(0).childNode(0).childNode(1)).text());
                    String name = nameNode.attr("data-value");
                    String clazz = nodeList.get(3).attr("data-value");
                    String fraction = nodeList.get(4).attr("data-value");
                    String realm = Calculator.realmCalc(nodeList.get(5).attr("data-value"));
                    Long wins = Long.parseLong(nodeList.get(6).attr("data-value"));
                    Long losses = Long.parseLong(nodeList.get(7).attr("data-value"));
                    return enrichWithSpecialData(new Character(pos, rating, false, name, clazz, fullSpec, fraction, "", "", realm, wins, losses, Optional.empty()), bracket, region);
                }).toList();
                return characters;
            }
        }).doOnSuccess(ok -> log.debug(String.format("%s-%s ladder has been fetched page=%s", region, bracket, page))).doOnError(err -> log.error(String.format("ERR %s %s %s", region, bracket, page)));
    }

    private Completable calculateMeta(String region) {
        String realRegion = realRegion(region);
        return Completable.defer(() -> {
            List<Completable> res = List.of(TWO_V_TWO, THREE_V_THREE, RBG, SHUFFLE).stream().flatMap(bracket -> {
                log.info("Calculating meta for bracket=" + bracket + " region=" + region);
                Snapshot now = refs.refByBracket(bracket, region).get();
                if (now == null) {
                    log.info("No data for bracket=" + bracket + " region=" + region);
                    return Stream.empty();
                }
                return List.of("this_season", "last_month", "last_week", "last_day").stream().flatMap(period -> List.of("all", "melee", "ranged", "dps", "healer", "tank").stream().flatMap(role -> {
                    Maybe<SnapshotDiff> diff;
                    if (period.equals("this_season")) {
                        Snapshot empty = Snapshot.empty(region);
                        SnapshotDiff sdif = Calculator.calculateDiff(empty, now, bracket, false);
                        diff = Maybe.just(sdif);
                    } else {
                        int minsAgo = 0;
                        if (period.equals("last_month")) {
                            minsAgo = 60 * 24 * 30;
                        } else if (period.equals("last_week")) {
                            minsAgo = 60 * 24 * 7;
                        } else if (period.equals("last_day")) {
                            minsAgo = 60 * 24;
                        }
                        diff = db.getMinsAgo(bracket, region, minsAgo).map(snap -> Calculator.calculateDiff(snap, now, bracket, false));
                    }
                    return Stream.of(diff.flatMapCompletable(realDiff -> {
                        try {
                            VTHREAD_SCHEDULER.scheduleDirect(() -> {
                                long tick = System.nanoTime();
                                Meta meta = Calculator.calculateMeta(realDiff, role, bracket, 0.05, 0.10, 0.85);
                                metaRef(bracket, realRegion, role, period).set(meta);
                                long elapsed = (System.nanoTime() - tick) / 1000000;
                                String msg = "Meta for bracket={} region={} role={} period={} has been calculated in {} ms";
                                if (elapsed > 1000) {
                                    log.info(msg, bracket, region, role, period, elapsed);
                                } else {
                                    log.debug(msg, bracket, region, role, period, elapsed);
                                }
                            });
                            return Completable.complete();
                        } catch (Exception e) {
                            log.error("Error calculating meta for " + bracket + " " + region + " " + role + " " + period, e);
                            return Completable.error(e);
                        }
                    }).onErrorComplete());
                }));
            }).collect(Collectors.toList());
            return Completable.merge(res);
        });
    }

    private Completable loadCutoffs(String region) {
        return Completable.defer(() -> {
            log.info("Load cutoffs for region " + region);
            return blizzardAPI.cutoffs(region).map(cutoffs -> {
                    regionCutoff.put(oldRegion(region), cutoffs);
                    regionCutoff.put(realRegion(region), cutoffs);
                    return cutoffs;
                }).doAfterSuccess(cutoffs -> log.info("Cutoffs for region={} has been loaded", region))
                .ignoreElement()
                .onErrorComplete();
        });
    }

    private Completable loadCutoffsFromDb(String region) {
        return Completable.defer(() -> {
            log.info("Load cutoffs from DB for region " + region);
            return db.getLastCutoffs(realRegion(region)).map(cutoffs -> {
                    if (cutoffs.isPresent()) {
                        Cutoffs ctf = cutoffs.get();
                        List.of(TWO_V_TWO, THREE_V_THREE, RBG, SHUFFLE).forEach(bracket -> {
                            Snapshot s = refs.refByBracket(bracket, region).get();
                            if (s != null) {
                                s.predictCutoffs(bracket, ctf);
                            }
                        });
                        regionCutoffFromDb.put(oldRegion(region), ctf);
                        regionCutoffFromDb.put(realRegion(region), ctf);
                    }
                    return cutoffs;
                }).doOnSuccess(cutoffs -> log.info("Cutoffs from DB for region={} has been loaded", region))
                .ignoreElement()
                .onErrorComplete();
        });
    }

    private Completable updateCutoffs(String region) {
        return Completable.defer(() -> {
            Cutoffs cutoffs = regionCutoff.get(region);
            if (cutoffs == null) {
                log.info("No cutoffs to update in DB");
                return Completable.complete();
            } else {
                log.info("Updating cutoffs in DB");
                return db.insertCutoffsIfDifferent(cutoffs);
            }
        });
    }

    public Completable loadWowCharApiData(String region) {
        return Completable.defer(() -> {
            log.info("Loading WoW Character API data for region " + region);
            String realRegion;
            if (region.equals(EU)) {
                realRegion = "eu";
            } else {
                realRegion = "us";
            }
            return db.fetchCharFlow(realRegion).buffer(5000)
                .flatMapCompletable(characters -> Completable.create(emitter -> {
                    VTHREAD_SCHEDULER.scheduleDirect(() -> {
                        log.info("Character data size={} for region={} is being loaded to cache", characters.size(), region);
                        long tick = System.nanoTime();
                        long totalHidden = characters.stream().filter(WowAPICharacter::hidden).count();
                        characters.forEach(characterCache::upsert);
                        charSearchIndex.insertNickNamesWC(characters);
                        log.info("Character data size={} for region={} hidden={} chars has been loaded to cache in {} ms", characters.size(), region, totalHidden, (System.nanoTime() - tick) / 1000000);
                        emitter.onComplete();
                    });
                }));
        });
    }

    private Completable loadLast(String bracket, String region) {
        return Completable.defer(() -> {
            long tick = System.nanoTime();
            return db.getLast(bracket, region).switchIfEmpty(Maybe.defer(() -> {
                log.info("No data for bracket {}-{} in DB", region, bracket);
                return Maybe.empty();
            })).flatMapCompletable(characters -> {
                refs.refByBracket(bracket, region).set(characters.applyCutoffs(bracket, regionCutoff.get(region)));
                log.info("Data for bracket {}-{} has been loaded from DB in {} ms", region, bracket, (System.nanoTime() - tick) / 1000000);
                return calcDiffs(bracket, region);
            });
        });
    }

    public Completable calcDiffs(String bracket, String region) {
        List<Maybe<Snapshot>> maybes = List.of(
//            db.getMinsAgo(bracket, region, 60 * 24 * 4),
//            db.getMinsAgo(bracket, region, 60 * 24 * 2),
//            db.getMinsAgo(bracket, region, 60 * 24),
            db.getMinsAgo(bracket, region, 60 * 12),
            db.getMinsAgo(bracket, region, 60 * 8),
            db.getMinsAgo(bracket, region, 60 * 6),
            db.getMinsAgo(bracket, region, 60 * 3),
            db.getMinsAgo(bracket, region, 60 * 2),
            db.getMinsAgo(bracket, region, 60),
            db.getMinsAgo(bracket, region, 30),
            db.getMinsAgo(bracket, region, 15),
            db.getMinsAgo(bracket, region, 10),
            db.getMinsAgo(bracket, region, 5),
            Maybe.just(refs.refByBracket(bracket, region).get()));
        return Calculator.calcDiffAndCombine(bracket, region, maybes)
            .flatMapCompletable(res -> {
                refs.diffsByBracket(bracket, region).set(res.applyCutoffs(bracket, regionCutoff.get(region)));
                return Completable.complete();
            });
    }

    public AtomicReference<Meta> metaRef(String bracket, String region, String role, String period) {
        return meta.computeIfAbsent(bracket + "_" + role + "_" + region + "_" + period, k -> new AtomicReference<>());
    }

    public Completable newDataOnBracket(String bracket, String region, Snapshot newCharacters) {
        AtomicReference<Snapshot> current = refs.refByBracket(bracket, region);
        Snapshot curVal = current.get();
        SnapshotDiff diff = Calculator.calculateDiff(curVal, newCharacters, bracket);
        boolean same = diff.chars().isEmpty();
        if (!same) {
            current.set(newCharacters.applyCutoffs(bracket, regionCutoff.get(region)));
            log.info("Data for bracket {} is different[diffs={}] performing update", bracket, diff.chars().size());
            return db.insertOnlyIfDifferent(bracket, region, newCharacters)
                .andThen(db.cleanBracketSnapshot(bracket)
                    .andThen(calcDiffs(bracket, region)))
                .andThen(Completable.defer(() -> upsertGamingHistory(bracket, diff)));
        } else {
            newCharacters.applyCutoffs(bracket, regionCutoff.get(region));
            log.info("Data for bracket {} are equal, not updating", bracket);
            return Completable.complete();
        }
    }

    private Completable upsertGamingHistory(String bracket, SnapshotDiff diff) {
        final AtomicReference<List<WowAPICharacter>> upserted = new AtomicReference<>();
        return Completable.create(emitter -> {
            VTHREAD_SCHEDULER.scheduleDirect(() -> {
                try {
                    log.info("Upserting gaming history for bracket " + bracket);
                    BracketType bracketType = BracketType.fromType(bracket);
                    long upsertTotalTick = System.nanoTime();
                    if (bracketType.partySize() == 1) {
                        upserted.set(diff.chars().stream().flatMap(df -> {
                            try {
                                return characterCache.upsertDiff(df, bracket).stream();
                            } catch (Exception e) {
                                log.warn("Error upserting diff", e);
                                return Stream.empty();
                            }
                        }).toList());
                    } else {
                        int partySize = bracketType.partySize();
                        long tick = System.nanoTime();
                        List<List<CharAndDiff>> whoWWho = Calculator.whoPlayedWithWho(diff, partySize, characterCache);
                        log.info("Who played with who for bracket {} partySize={} has been calculated in {} ms, {} groups", bracket, partySize, (System.nanoTime() - tick) / 1000000, whoWWho.size());
                        upserted.set(whoWWho.stream().flatMap(list -> {
                            try {
                                return characterCache.upsertGroupDiff(list, bracket).stream();
                            } catch (Exception e) {
                                log.warn("Error upserting diff", e);
                                return Stream.empty();
                            }
                        }).toList());
                    }
                    log.info("Upserting gaming history for bracket {} has been finished in {} ms, upserted {} chars", bracket, (System.nanoTime() - upsertTotalTick) / 1000000, upserted.get().size());
                    emitter.onComplete();
                } catch (Exception e) {
                    log.warn("Error upserting diff", e);
                    emitter.onError(e);
                }
            }, 0, SECONDS);
        }).andThen(
            Completable.defer(() -> db.bulkUpdateChars(upserted.get())
                .doAfterSuccess(ok -> log.info("Bulk update has been finished"))
                .doOnError(err -> log.error("Error bulk updating", err))
                .ignoreElement()));
    }
}
