package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.PvpLeaderBoard;
import io.github.sammers.pla.blizzard.BlizzardAPI;
import io.github.sammers.pla.blizzard.Cutoffs;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.DB;
import io.github.sammers.pla.db.Meta;
import io.github.sammers.pla.db.Snapshot;
import io.reactivex.*;
import io.reactivex.Observable;
import io.vertx.reactivex.core.Vertx;
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

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static io.github.sammers.pla.Main.VTHREAD_SCHEDULER;
import static io.github.sammers.pla.blizzard.BlizzardAPI.realRegion;

public class Ladder {

    private static final Logger log = LoggerFactory.getLogger(Ladder.class);
    private final Vertx vertx;
    private final WebClient web;

    public static String EU = "en-gb";
    public static String US = "en-us";
    public static String TWO_V_TWO = "2v2";
    public static String THREE_V_THREE = "3v3";
    public static String RBG = "battlegrounds";
    public static String SHUFFLE = "shuffle";

    public static List<String> brackets = List.of(TWO_V_TWO, THREE_V_THREE, RBG, SHUFFLE);

    public static final List<String> shuffleSpecs = new ArrayList<>() {{
        add("shuffle/deathknight/blood");
        add("shuffle/deathknight/frost");
        add("shuffle/deathknight/unholy");
        add("shuffle/demonhunter/havoc");
        add("shuffle/demonhunter/vengeance");
        add("shuffle/druid/balance");
        add("shuffle/druid/feral");
        add("shuffle/druid/guardian");
        add("shuffle/druid/restoration");
        add("shuffle/evoker/devastation");
        add("shuffle/evoker/preservation");
        add("shuffle/hunter/beastmastery");
        add("shuffle/hunter/marksmanship");
        add("shuffle/hunter/survival");
        add("shuffle/mage/arcane");
        add("shuffle/mage/fire");
        add("shuffle/mage/frost");
        add("shuffle/monk/brewmaster");
        add("shuffle/monk/mistweaver");
        add("shuffle/monk/windwalker");
        add("shuffle/paladin/holy");
        add("shuffle/paladin/protection");
        add("shuffle/paladin/retribution");
        add("shuffle/priest/discipline");
        add("shuffle/priest/holy");
        add("shuffle/priest/shadow");
        add("shuffle/rogue/assassination");
        add("shuffle/rogue/outlaw");
        add("shuffle/rogue/subtlety");
        add("shuffle/shaman/elemental");
        add("shuffle/shaman/enhancement");
        add("shuffle/shaman/restoration");
        add("shuffle/warlock/affliction");
        add("shuffle/warlock/demonology");
        add("shuffle/warlock/destruction");
        add("shuffle/warrior/arms");
        add("shuffle/warrior/fury");
        add("shuffle/warrior/protection");
    }};

    private final Map<String, AtomicReference<Snapshot>> refs = new ConcurrentHashMap<>();
    private final Map<String, AtomicReference<SnapshotDiff>> refDiffs = new ConcurrentHashMap<>();
    private final Map<String, WowAPICharacter> characterCache = new ConcurrentHashMap<>();
    private final Map<String, AtomicReference<Meta>> meta = new ConcurrentHashMap<>();
    private final NickNameSearchIndex charSearchIndex = new NickNameSearchIndex();
    private final Map<String, Cutoffs> regionCutoff = new ConcurrentHashMap<>();
    private final DB db;
    private BlizzardAPI blizzardAPI;

    public Ladder(Vertx vertx, WebClient web, DB db, BlizzardAPI blizzardAPI) {
        this.vertx = vertx;
        this.web = web;
        this.db = db;
        this.blizzardAPI = blizzardAPI;
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
        return Optional.ofNullable(characterCache.get(Character.fullNameByRealmAndName(name, realm)));
    }

    public List<SearchResult> search(String name) {
        return charSearchIndex.searchNickNames(name);
    }

    public Single<Snapshot> fetchLadder(String bracket, String region) {
        long currentTimeMillis = System.currentTimeMillis();
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
        return resCharList
            .map(chars -> Snapshot.of(chars, region, currentTimeMillis))
            .flatMap(d -> newDataOnBracket(bracket, region, d).andThen(Single.just(d)))
            .doOnError(e -> log.error("Error fetching ladder, returning empty snapshot", e))
            .onErrorReturnItem(Snapshot.empty(region));
    }

    public void start() {
        loadRegionData(EU)
            .andThen(loadRegionData(US))
            .andThen(
                runDataUpdater(US,
                    runDataUpdater(EU,
                        Observable.interval(minutesTillNextHour(), 30, TimeUnit.MINUTES)
                            .observeOn(VTHREAD_SCHEDULER)
                            .subscribeOn(VTHREAD_SCHEDULER)
                    )
                )
            )
            .doOnError(e -> log.error("Error fetching ladder", e))
            .onErrorReturnItem(Snapshot.empty(EU))
            .subscribe();
    }

    private Completable updateChars(String region) {
        return Completable.defer(() -> {
                log.info("Updating chars in region " + region);
                long dayAgo = Instant.now().minus(1, ChronoUnit.DAYS).toEpochMilli();
                Set<Character> uniqChars = brackets.stream().flatMap(bracket -> {
                    AtomicReference<Snapshot> snapshotAtomicReference = refByBracket(bracket, region);
                    Snapshot snapshot = snapshotAtomicReference.get();
                    if (snapshot == null) {
                        return Stream.of();
                    }
                    return snapshot.characters().stream().flatMap(c -> {
                        WowAPICharacter wowAPICharacter = characterCache.get(c.fullName());
                        if (wowAPICharacter == null) {
                            return Stream.of(c);
                        } else if (wowAPICharacter.lastUpdatedUTCms() < dayAgo) {
                            return Stream.of(c);
                        } else {
                            return Stream.of();
                        }
                    });
                }).collect(Collectors.toSet());
                log.info("Updating " + uniqChars.size() + " characters");
                List<Completable> completables = uniqChars.stream().map(wowChar -> blizzardAPI.character(region, wowChar.realm(), wowChar.name()).flatMap(c -> {
                        characterCache.put(wowChar.fullName(), c);
                        charSearchIndex.insertNickNames(new SearchResult(wowChar.fullName(), region, wowChar.clazz()));
                        return db.upsertCharacter(c);
                    })
                    .subscribeOn(VTHREAD_SCHEDULER)
                    .doOnSuccess(d -> log.debug("Updated character: " + wowChar))
                    .doOnError(e -> log.error("Failed to update character: " + wowChar + "Maybe can do it next time", e))
                    .ignoreElement()
                    .onErrorComplete()
                ).toList();
                return Flowable.fromIterable(completables)
                    .buffer(5)
                    .toList()
                    .flatMapCompletable(list -> Completable.concat(list.stream().map(Completable::merge).toList()));
            })
            .onErrorComplete()
            .subscribeOn(VTHREAD_SCHEDULER);
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
                        String fullSpec = specName + " " + clazz;
                        String fraction = nodeList.get(5).attr("data-value");
                        String realm = nodeList.get(6).attr("data-value");
                        Long wins = Long.parseLong(nodeList.get(7).attr("data-value"));
                        Long losses = Long.parseLong(nodeList.get(8).attr("data-value"));
                        return enrichWithSpecialData(bracket, region, pos, rating, name, clazz, fullSpec, fraction, realm, wins, losses);
                    }).toList();
                    return characters;
                }
            })
            .doOnSuccess(ok -> log.debug(String.format("%s-%s ladder has been fetched page=%s", region, bracket, page)))
            .doOnError(err -> log.error(String.format("ERR %s %s %s", region, bracket, page), err));
    }

    private Character enrichWithSpecialData(String bracket, String region, Long pos, Long rating, String name, String clazz, String fullSpec, String fraction, String realm, Long wins, Long losses) {
        Optional<WowAPICharacter> apiCharacter = Optional.ofNullable(characterCache.get(Character.fullNameByRealmAndName(name, realm)));
        String gender = apiCharacter.map(WowAPICharacter::gender).orElse("unknown");
        String race = apiCharacter.map(WowAPICharacter::race).orElse("unknown");
        Cutoffs cutoffs = regionCutoff.get(region);
        boolean inCutoff = false;
        if (cutoffs == null) {
            inCutoff = false;
        } else if (bracket.equals("3v3")) {
            Long cutRating = cutoffs.threeVThree();
            inCutoff = rating >= cutRating;
        } else if (bracket.equals("battlegrounds")) {
            Long cutRating = cutoffs.battlegrounds(fraction);
            inCutoff = rating >= cutRating;
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
            inCutoff = rating >= cutRating;
        }
        return new Character(pos, rating, inCutoff, name, clazz, fullSpec, fraction, gender, race, realm, wins, losses);
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
                        String realm = nodeList.get(5).attr("data-value");
                        Long wins = Long.parseLong(nodeList.get(6).attr("data-value"));
                        Long losses = Long.parseLong(nodeList.get(7).attr("data-value"));
                        return enrichWithSpecialData(bracket, region, pos, rating, name, clazz, fullSpec, fraction, realm, wins, losses);
                    }).toList();
                    return characters;
                }
            })
            .doOnSuccess(ok -> log.debug(String.format("%s-%s ladder has been fetched page=%s", region, bracket, page)))
            .doOnError(err -> log.error(String.format("ERR %s %s %s", region, bracket, page)));
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
            .flatMapSingle(tick -> updateChars(region).andThen(Single.just(tick)))
            .flatMapSingle(tick -> loadCutoffs(region).andThen(Single.just(tick)))
            .flatMapSingle(tick -> {
                log.info("Data updater for " + region + " has been finished");
                return Single.just(tick);
            });
    }

    private Completable loadRegionData(String region) {
        return loadLast(TWO_V_TWO, region)
            .andThen(loadLast(THREE_V_THREE, region))
            .andThen(loadLast(RBG, region))
            .andThen(loadLast(SHUFFLE, region))
            .andThen(loadWowCharApiData(region));
    }

    private Completable calculateMeta(String region) {
        String realRegion = realRegion(region);
        Cutoffs cutoffs = regionCutoff.get(region);
        return Completable.defer(() -> {
            List<Completable> res = List.of("2v2", "3v3", "rbg", "shuffle").stream().flatMap(bracket -> {
                Snapshot now = refByBracket(bracket, region).get();
                return List.of("this_season", "last_month", "last_week", "last_day").stream().flatMap(period ->
                    List.of("all", "melee", "ranged", "dps", "healer", "tank").stream().flatMap(role -> {
                        log.info("Calculating meta for bracket=" + bracket + " region=" + region + " period=" + period + " role=" + role);
                        Maybe<SnapshotDiff> diff;
                        long bracketR1Cutoff = 0;
                        if (bracket.equals("2v2")) {
                            bracketR1Cutoff = 2109;
                        } else if (bracket.equals("3v3")) {
                            bracketR1Cutoff = cutoffs.threeVThree();
                        } else if (bracket.equals("rbg")) {
                            bracketR1Cutoff = cutoffs.battlegrounds("horde");
                        } else if (bracket.equals("shuffle")) {
                            bracketR1Cutoff = 2300;
                        }
                        if (period.equals("this_season")) {
                            diff = Maybe.just(Calculator.calculateDiff(Snapshot.empty(region), now, bracket));
                        } else {
                            int minsAgo = 0;
                            if (period.equals("last_month")) {
                                minsAgo = 60 * 24 * 30;
                            } else if (period.equals("last_week")) {
                                minsAgo = 60 * 24 * 7;
                            } else if (period.equals("last_day")) {
                                minsAgo = 60 * 24;
                            } else {
                                diff = Maybe.empty();
                            }
                            diff = db.getMinsAgo(region, bracket, minsAgo).map(snap -> Calculator.calculateDiff(snap, now, bracket));
                        }
                        return Stream.of(diff.map(realDiff -> {
                            Meta meta = Calculator.calculateMeta(realDiff, role, 16.6, 33.2, 50.2);
                            return meta;
                        }).ignoreElement());
                    }));
            }).collect(Collectors.toList());
            return Completable.merge(res);

//                log.info("Calculating meta for " + bracket + " " + region + " " + role);
//                Snapshot snapshot = refByBracket(bracket, region).get();
//                long p001;
//                if (bracket.equals(THREE_V_THREE)) {
//                    p001 = 42L;
//                } else if (bracket.equals(TWO_V_TWO)) {
//                    p001 = 45L;
//                } else if (bracket.equals(RBG)) {
//                    p001 = 46;
//                } else if (bracket.equals(SHUFFLE)) {
//                    p001 = 200L;
//                } else {
//                    p001 = 100L;
//                }
//                Meta calcMeta = Calculator.calculateMeta(snapshot, role, p001);
//                metaRef(bracket, region, role).set(calcMeta);
        });
    }

    private Completable loadCutoffs(String region) {
        return Completable.defer(() -> {
            log.info("Load cutoffs for region " + region);
            return blizzardAPI.cutoffs(region).map(cutoffs -> {
                    regionCutoff.put(region, cutoffs);
                    return cutoffs;
                }).doAfterSuccess(cutoffs -> log.info("Cutoffs for region={} has been loaded", region))
                .ignoreElement()
                .onErrorComplete();
        });
    }

    private Completable loadWowCharApiData(String region) {
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
                        characters.forEach(character -> {
                            characterCache.put(character.fullName(), character);
                            charSearchIndex.insertNickNames(new SearchResult(character.fullName(), character.region(), character.clazz()));
                        });
                        log.info("Character data size={} for region={} has been loaded to cache in {} ms", characters.size(), region, (System.nanoTime() - tick) / 1000000);
                        emitter.onComplete();
                    });
                }));
        });
    }

    private Completable loadLast(String bracket, String region) {
        return db.getLast(bracket, region).flatMapCompletable(characters -> {
            refByBracket(bracket, region).set(characters);
            log.info("Data for bracket {}-{} has been loaded from DB", region, bracket);
            return calcDiffs(bracket, region);
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
            Maybe.just(refByBracket(bracket, region).get()));
        return Calculator.calcDiffAndCombine(bracket, region, maybes)
            .flatMapCompletable(res -> {
                diffsByBracket(bracket, region).set(res);
                return Completable.complete();
            });
    }

    public AtomicReference<Meta> metaRef(String bracket, String region, String role, String period) {
        return meta.computeIfAbsent(bracket + "_" + role + "_" + region + "_" + period, k -> new AtomicReference<>());
    }

    public AtomicReference<Snapshot> refByBracket(String bracket, String region) {
        return refs.computeIfAbsent(bracket + "_" + region, k -> new AtomicReference<>());
    }

    public AtomicReference<SnapshotDiff> diffsByBracket(String bracket, String region) {
        return refDiffs.computeIfAbsent(bracket + "_" + region, k -> new AtomicReference<>());
    }

    public Completable newDataOnBracket(String bracket, String region, Snapshot newCharacters) {
        AtomicReference<Snapshot> current = refByBracket(bracket, region);
        Snapshot curVal = current.get();
        String newChars = newCharacters.toJson().getJsonArray("characters").encode();
        String currentCharacters = curVal == null ? null : curVal.toJson().getJsonArray("characters").encode();
        boolean same = newChars.equals(currentCharacters);
        if (!same) {
            current.set(newCharacters);
            log.info("Data for bracket {} is different performing update", bracket);
            return db.insertOnlyIfDifferent(bracket, region, newCharacters)
                .andThen(db.deleteOlderThanHours(bracket, 24 * 7)
                    .ignoreElement()
                    .andThen(calcDiffs(bracket, region)));
        } else {
            log.info("Data for bracket {} are equal, not updating", bracket);
            return Completable.complete();
        }
    }

    public static int minutesTillNextHour() {
        ZoneId zone = ZoneId.systemDefault();
        ZonedDateTime now = ZonedDateTime.now(zone);
        ZonedDateTime nextHour = now.withMinute(0).withSecond(0).withNano(0).plusHours(1).plusMinutes(1);
        Duration duration = Duration.between(now, nextHour);
        return (int) duration.toMinutes();
    }
}
