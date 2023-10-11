package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.BlizzardAPI;
import io.github.sammers.pla.blizzard.Cutoffs;
import io.github.sammers.pla.blizzard.PvpLeaderBoard;
import io.github.sammers.pla.blizzard.WowAPICharacter;
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
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static io.github.sammers.pla.Main.VTHREAD_SCHEDULER;
import static io.github.sammers.pla.blizzard.BlizzardAPI.oldRegion;
import static io.github.sammers.pla.blizzard.BlizzardAPI.realRegion;
import static io.github.sammers.pla.logic.Calculator.minutesTill5am;
import static io.github.sammers.pla.logic.Conts.*;

public class Ladder {

    private static final Logger log = LoggerFactory.getLogger(Ladder.class);
    private final WebClient web;
    private final Refs refs;
    public final CharacterCache characterCache;
    private final Map<String, AtomicReference<Meta>> meta = new ConcurrentHashMap<>();
    private final NickNameSearchIndex charSearchIndex = new NickNameSearchIndex();
    public final Map<String, Cutoffs> regionCutoff;
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
    }

    public void start() {
        loadRegionData(EU)
            .andThen(loadRegionData(US))
            .andThen(charsAreLoaded())
            .andThen(
                runDataUpdater(US,
                    runDataUpdater(EU,
                        Observable.defer(() -> {
                            int initialDelay = Calculator.minutesTillNextHour();
                            return Observable.interval(initialDelay, 60, TimeUnit.MINUTES)
                                    .observeOn(VTHREAD_SCHEDULER)
                                    .subscribeOn(VTHREAD_SCHEDULER);
                        })
                    )
                )
            )
            .doOnError(e -> log.error("Error fetching ladder", e))
            .onErrorReturnItem(Snapshot.empty(EU))
            .subscribe();
    }

    private Completable charsAreLoaded() {
        return Completable.fromAction(() -> {
            charsLoaded.set(true);
            log.info("Chars are loaded. Updates are allowed now");
        });
    }

    private <R> Observable<Snapshot> runDataUpdater(String region, Observable<R> tickObservable) {
        return tickObservable
            .flatMapSingle(tick -> {
                log.info("Starting data updater for " + region);
                return Single.just(tick);
            })
            .flatMapSingle(tick -> threeVThree(region))
            .flatMapSingle(tick -> twoVTwo(region))
            .flatMapSingle(tick -> battlegrounds(region))
            .flatMapSingle(tick -> shuffle(region))
            .flatMapSingle(tick -> loadCutoffs(region).andThen(Single.just(tick)))
            .flatMapSingle(tick -> calculateMeta(region).andThen(Single.just(tick)))
            .flatMapSingle(tick -> {
                log.info("Data updater for " + region + " has been finished");
                return Single.just(tick);
            });
    }

    public Completable loadRegionData(String region) {
        return loadLast(TWO_V_TWO, region)
            .andThen(loadCutoffs(region))
            .andThen(loadLast(THREE_V_THREE, region))
            .andThen(loadLast(RBG, region))
            .andThen(loadLast(SHUFFLE, region))
            .andThen(calculateMeta(region))
            .andThen(loadWowCharApiData(region));
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

    public Optional<WowAPICharacter> wowChar(String realm, String name) {
        return Optional.ofNullable(characterCache.getByFullName(Character.fullNameByRealmAndName(name, realm)));
    }

    public List<SearchResult> search(String name) {
        return charSearchIndex.searchNickNames(name);
    }

    public Single<Snapshot> fetchLadder(String bracket, String region) {
        return fetchLadder(bracket, region, true);
    }

    public Single<List<Character>> pureBlizzardApiFetch(String bracket, String region){
        Single<List<Character>> resCharList;
        if (bracket.equals(SHUFFLE)) {
            Single<List<Character>> res = Single.just(new ArrayList<>(5000 * shuffleSpecs.size()));
            for (String shuffleSpec : shuffleSpecs) {
                Single<List<Character>> sh = Single.just(new ArrayList<>(shuffleSpecs.size()));
                String specForBlizApi = shuffleSpec.replaceAll("/", "-");
                sh = sh.flatMap(thisSpecChars -> blizzardAPI.pvpLeaderboard(specForBlizApi, region)
                    .flatMapSingle(leaderboard -> {
                            Set<Character> chrs = leaderboard.toCharacters(characterCache.nameCache(), shuffleSpec);
                            thisSpecChars.addAll(chrs);
                            return Single.just(thisSpecChars);
                        }
                    )
                );
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
            resCharList = res.flatMap(s -> blizzardAPI.pvpLeaderboard(bracket, region)
                .flatMapSingle(leaderboard -> {
                        Set<Character> chrs = leaderboard.toCharacters(characterCache.nameCache(), bracket);
                        s.addAll(chrs);
                        return Single.just(s);
                    }
                )
            );
        }
        return resCharList;
    }

    public Single<Snapshot> fetchLadder(String bracket, String region, boolean newWay) {
        Single<List<Character>> resCharList;
        if (newWay) {
            resCharList = pureBlizzardApiFetch(bracket, region).flatMap(chars -> {
                Map<String, Character> pureleyFetchedChars = new HashMap<>();
                Function<Character, String> idf;
                if (bracket.equals(SHUFFLE)) {
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
        return resCharList
            .map(chars -> Snapshot.of(chars, region, System.currentTimeMillis()))
            .flatMap(d -> newDataOnBracket(bracket, region, d).andThen(Single.just(d)))
            .doOnError(e -> log.error("Error fetching ladder, returning empty snapshot", e))
            .onErrorReturnItem(Snapshot.empty(region));
    }

    public Single<List<Character>> ladderPageFetch(String bracket, String region){
        Single<List<Character>> resCharList;
        if (bracket.equals(SHUFFLE)) {
            Single<List<Character>> res = Single.just(new ArrayList<>(1000 * shuffleSpecs.size()));
            for (String shuffleSpec : shuffleSpecs) {
                Single<List<Character>> sh = Single.just(new ArrayList<>(shuffleSpecs.size()));
                for (int i = 1; i <= 10; i++) {
                    int finalI = i;
                    sh = sh.flatMap(characters ->
                        ladderShuffle(shuffleSpec, finalI, region).map(c -> {
                            characters.addAll(c);
                            return characters;
                        })
                    );
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
                res = res.flatMap(characters ->
                    ladderTraditional(bracket, finalI, region).map(c -> {
                        characters.addAll(c);
                        return characters;
                    })
                );
            }
            resCharList = res.flatMap(s -> {
                Maybe<List<Character>> map = blizzardAPI.pvpLeaderboard(bracket, region)
                    .map((PvpLeaderBoard leaderboard) -> {
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
                        return enrichWithSpecialData(new Character(pos, rating, false, name, clazz, fullSpec, fraction, "", "", realm, wins, losses), bracket, region);
                    }).toList();
                    return characters;
                }
            })
            .doOnSuccess(ok -> log.debug(String.format("%s-%s ladder has been fetched page=%s", region, bracket, page)))
            .doOnError(err -> log.error(String.format("ERR %s %s %s", region, bracket, page), err));
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
            character.losses()
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
                        return enrichWithSpecialData(new Character(pos, rating, false, name, clazz, fullSpec,fraction,"", "", realm, wins, losses), bracket, region);
                    }).toList();
                    return characters;
                }
            })
            .doOnSuccess(ok -> log.debug(String.format("%s-%s ladder has been fetched page=%s", region, bracket, page)))
            .doOnError(err -> log.error(String.format("ERR %s %s %s", region, bracket, page)));
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
                return List.of("this_season", "last_month", "last_week", "last_day").stream().flatMap(period ->
                    List.of("all", "melee", "ranged", "dps", "healer", "tank").stream().flatMap(role -> {
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
                            diff = db.getMinsAgo(bracket, region, minsAgo)
                                .map(snap -> Calculator.calculateDiff(snap, now, bracket, false));
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

    public Completable loadWowCharApiData(String region) {
        return Completable.defer(() -> {
            log.info("Loading WoW Character API data for region " + region);
            String realRegion;
            if (region.equals(EU)) {
                realRegion = "eu";
            } else {
                realRegion = "us";
            }
            return db.fetchChars(realRegion)
                .flatMapCompletable(characters -> Completable.create(emitter -> {
                    VTHREAD_SCHEDULER.scheduleDirect(() -> {
                        log.info("Character data size={} for region={} is being loaded to cache", characters.size(), region);
                        long tick = System.nanoTime();
                        characters.forEach(characterCache::upsert);
                        List<SearchResult> list = characters.stream().map(charz -> new SearchResult(charz.fullName(), charz.region(), charz.clazz())).toList();
                        charSearchIndex.insertNickNames(list);
                        log.info("Character data size={} for region={} has been loaded to cache in {} ms", characters.size(), region, (System.nanoTime() - tick) / 1000000);
                        VTHREAD_SCHEDULER.schedulePeriodicallyDirect(() -> charUpdater.updateCharsInfinite(region).subscribe(), minutesTill5am(), 24 * 60, TimeUnit.MINUTES);
                        emitter.onComplete();
                    });
                }));
        });
    }

    private Completable loadLast(String bracket, String region) {
        return Completable.defer(() -> {
            long tick = System.nanoTime();
            return db.getLast(bracket, region)
                .switchIfEmpty(Maybe.defer(() -> {
                    log.info("No data for bracket {}-{} in DB", region, bracket);
                    return Maybe.empty();
                }))
                .flatMapCompletable(characters -> {
                    refs.refByBracket(bracket, region).set(characters);
                    log.info("Data for bracket {}-{} has been loaded from DB in {} ms", region, bracket, (System.nanoTime() - tick) / 1000000);
                    return calcDiffs(bracket, region);
                });
        });
    }

    public Completable calcDiffs(String bracket, String region) {
        List<Maybe<Snapshot>> maybes = List.of(
            db.getMinsAgo(bracket, region, 60 * 12),
            db.getMinsAgo(bracket, region, 60 * 8),
            db.getMinsAgo(bracket, region, 60 * 6),
            db.getMinsAgo(bracket, region, 60 * 3),
            db.getMinsAgo(bracket, region, 60 * 2),
            db.getMinsAgo(bracket, region, 60),
            Maybe.just(refs.refByBracket(bracket, region).get()));
        return Calculator.calcDiffAndCombine(bracket, region, maybes)
            .flatMapCompletable(res -> {
                refs.diffsByBracket(bracket, region).set(res);
                return Completable.complete();
            });
    }

    public AtomicReference<Meta> metaRef(String bracket, String region, String role, String period) {
        return meta.computeIfAbsent(bracket + "_" + role + "_" + region + "_" + period, k -> new AtomicReference<>());
    }

    public Completable newDataOnBracket(String bracket, String region, Snapshot newCharacters) {
        AtomicReference<Snapshot> current = refs.refByBracket(bracket, region);
        Snapshot curVal = current.get();
        String newChars = newCharacters.toJson().getJsonArray("characters").encode();
        String currentCharacters = curVal == null ? null : curVal.toJson().getJsonArray("characters").encode();
        boolean same = newChars.equals(currentCharacters);
        if (!same) {
            SnapshotDiff diff = Calculator.calculateDiff(curVal, newCharacters, bracket, false);
            diff.chars().forEach(df -> characterCache.upsertDiff(df, bracket));
            current.set(newCharacters);
            log.info("Data for bracket {} is different[diffs={}] performing update", bracket, diff.chars().size());
            return db.insertOnlyIfDifferent(bracket, region, newCharacters)
                .andThen(db.deleteOlderThanHours(bracket, 24 * 30)
                    .ignoreElement()
                    .andThen(calcDiffs(bracket, region)));
        } else {
            log.info("Data for bracket {} are equal, not updating", bracket);
            return Completable.complete();
        }
    }
}
