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

import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static io.github.sammers.pla.Main.VTHREAD_SCHEDULER;
import static io.github.sammers.pla.blizzard.BlizzardAPI.realRegion;

public class Ladder {

    private static final Logger log = LoggerFactory.getLogger(Ladder.class);
    private final WebClient web;
    public static String EU = "en-gb";
    public static String US = "en-us";
    public static String TWO_V_TWO = "2v2";
    public static String THREE_V_THREE = "3v3";
    public static String RBG = "battlegrounds";
    public static String SHUFFLE = "shuffle";
    private final Random rnd = new Random();
    public static List<String> BRACKETS = List.of(TWO_V_TWO, THREE_V_THREE, RBG, SHUFFLE);

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
        add("shuffle/evoker/augmentation");
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

    public static Map<String, String> SHUFFLE_SPEC_TO_SPEC = new HashMap<>() {
        {
            put("shuffle/deathknight/blood", "Blood Death Knight");
            put("shuffle/deathknight/frost", "Frost Death Knight");
            put("shuffle/deathknight/unholy", "Unholy Death Knight");
            put("shuffle/demonhunter/havoc", "Havoc Demon Hunter");
            put("shuffle/demonhunter/vengeance", "Vengeance Demon Hunter");
            put("shuffle/druid/balance", "Balance Druid");
            put("shuffle/druid/feral", "Feral Druid");
            put("shuffle/druid/guardian", "Guardian Druid");
            put("shuffle/druid/restoration", "Restoration Druid");
            put("shuffle/evoker/devastation", "Devastation Evoker");
            put("shuffle/evoker/preservation", "Preservation Evoker");
            put("shuffle/evoker/augmentation", "Augmentation Evoker");
            put("shuffle/hunter/beastmastery", "Beast Mastery Hunter");
            put("shuffle/hunter/marksmanship", "Marksmanship Hunter");
            put("shuffle/hunter/survival", "Survival Hunter");
            put("shuffle/mage/arcane", "Arcane Mage");
            put("shuffle/mage/fire", "Fire Mage");
            put("shuffle/mage/frost", "Frost Mage");
            put("shuffle/monk/brewmaster", "Brewmaster Monk");
            put("shuffle/monk/mistweaver", "Mistweaver Monk");
            put("shuffle/monk/windwalker", "Windwalker Monk");
            put("shuffle/paladin/holy", "Holy Paladin");
            put("shuffle/paladin/protection", "Protection Paladin");
            put("shuffle/paladin/retribution", "Retribution Paladin");
            put("shuffle/priest/discipline", "Discipline Priest");
            put("shuffle/priest/holy", "Holy Priest");
            put("shuffle/priest/shadow", "Shadow Priest");
            put("shuffle/rogue/assassination", "Assassination Rogue");
            put("shuffle/rogue/outlaw", "Outlaw Rogue");
            put("shuffle/rogue/subtlety", "Subtlety Rogue");
            put("shuffle/shaman/elemental", "Elemental Shaman");
            put("shuffle/shaman/enhancement", "Enhancement Shaman");
            put("shuffle/shaman/restoration", "Restoration Shaman");
            put("shuffle/warlock/affliction", "Affliction Warlock");
            put("shuffle/warlock/demonology", "Demonology Warlock");
            put("shuffle/warlock/destruction", "Destruction Warlock");
            put("shuffle/warrior/arms", "Arms Warrior");
            put("shuffle/warrior/fury", "Fury Warrior");
            put("shuffle/warrior/protection", "Protection Warrior");
        }
    };

    private final Map<String, AtomicReference<Snapshot>> refs = new ConcurrentHashMap<>();
    private final Map<String, AtomicReference<SnapshotDiff>> refDiffs = new ConcurrentHashMap<>();
    public final Map<String, WowAPICharacter> characterCache = new ConcurrentHashMap<>();
    public final Map<Integer, Set<WowAPICharacter>> alts = new ConcurrentHashMap<>();
    private final Map<String, AtomicReference<Meta>> meta = new ConcurrentHashMap<>();
    private final NickNameSearchIndex charSearchIndex = new NickNameSearchIndex();
    private final Map<String, Cutoffs> regionCutoff = new ConcurrentHashMap<>();
    public final CharUpdater charUpdater;
    private final DB db;
    private final BlizzardAPI blizzardAPI;

    public Ladder(WebClient web, DB db, BlizzardAPI blizzardAPI) {
        this.web = web;
        this.db = db;
        this.blizzardAPI = blizzardAPI;
        this.charUpdater = new CharUpdater(blizzardAPI, characterCache, refs, alts, charSearchIndex, db);
    }

    public void start() {
        loadRegionData(EU)
            .andThen(loadRegionData(US))
            .andThen(
                runDataUpdater(US,
                    runDataUpdater(EU,
                        Observable.defer(() -> {
                            int initialDelay = minutesTillNextHour();
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
            .flatMapSingle(tick -> calculateMeta(region).andThen(Single.just(tick)))
            .flatMapSingle(tick -> loadCutoffs(region).andThen(Single.just(tick)))
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
        return Optional.ofNullable(characterCache.get(Character.fullNameByRealmAndName(name, realm)));
    }

    public List<SearchResult> search(String name) {
        return charSearchIndex.searchNickNames(name);
    }

    public Single<Snapshot> fetchLadder(String bracket, String region) {
        return fetchLadder(bracket, region, true);
    }

    public Completable calcAlts(){
        return Completable.fromAction(() -> Calculator.calculateAlts(characterCache.values(), alts));
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
                            Set<Character> chrs = leaderboard.toCharacters(characterCache, shuffleSpec);
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
                        Set<Character> chrs = leaderboard.toCharacters(characterCache, bracket);
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

    private Completable updateChar(String region, String name, String realm) {
        String fullName = Character.fullNameByRealmAndName(name, realm);
        return blizzardAPI.character(region, realm, name).flatMap(c -> {
            characterCache.put(fullName, c);
            charSearchIndex.insertNickNames(new SearchResult(fullName, region, c.clazz()));
            return db.upsertCharacter(c);
        }).subscribeOn(VTHREAD_SCHEDULER)
            .doOnSuccess(d -> log.debug("Updated character: " + fullName))
            .doOnError(e -> {
                if (rnd.nextLong() % 1000 == 0) {
                    log.error("Failed to update character: " + fullName);
                }
            })
            .ignoreElement()
            .onErrorComplete();
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
        Optional<WowAPICharacter> apiCharacter = Optional.ofNullable(characterCache.get(character.fullName()));
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
                Snapshot now = refByBracket(bracket, region).get();
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
                        return Stream.of(diff.map(realDiff -> {
                            try {
                                Meta meta = Calculator.calculateMeta(realDiff, role, bracket, 0.05, 0.10, 0.85);
                                metaRef(bracket, realRegion, role, period).set(meta);
                                return meta;
                            } catch (Exception e) {
                                log.error("Error calculating meta for " + bracket + " " + region + " " + role + " " + period, e);
                                return new Meta(Map.of(), Map.of(), List.of());
                            }
                        }).ignoreElement().onErrorComplete());
                    }));
            }).collect(Collectors.toList());
            return Completable.merge(res);
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
                        characters.forEach(character -> {
                            Calculator.indexCharAlts(alts, character);
                            characterCache.put(character.fullName(), character);
                            charSearchIndex.insertNickNames(new SearchResult(character.fullName(), character.region(), character.clazz()));
                        });
                        log.info("Character data size={} for region={} has been loaded to cache in {} ms", characters.size(), region, (System.nanoTime() - tick) / 1000000);
//                        VTHREAD_SCHEDULER.schedulePeriodicallyDirect(() -> charUpdater.updateCharsInfinite(region).subscribe(), 0, 24, TimeUnit.HOURS);
                        emitter.onComplete();
                    });
                }));
        });
    }

    private Completable loadLast(String bracket, String region) {
        return db.getLast(bracket, region)
            .switchIfEmpty(Maybe.defer(() -> {
                log.info("No data for bracket {}-{} in DB", region, bracket);
                return Maybe.empty();
            }))
            .flatMapCompletable(characters -> {
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

    public static String bucketRef(String bracket, String region) {
        return bracket + "_" + region;
    }

    public AtomicReference<Snapshot> refByBracket(String bracket, String region) {
        return refs.compute(bucketRef(bracket, region), (k, v) -> {
            if (v == null) {
                return new AtomicReference<>();
            } else {
                v.lazySet(applyCutoffs(bracket, region, v.get()));
                return v;
            }
        });
    }

    public AtomicReference<SnapshotDiff> diffsByBracket(String bracket, String region) {
        return refDiffs.compute(bucketRef(bracket, region), (k, v) -> {
            if (v == null) {
                return new AtomicReference<>();
            } else {
                v.lazySet(applyCutoffs(bracket, region, v.get()));
                return v;
            }
        });
    }

    private SnapshotDiff applyCutoffs(String bracket, String region, SnapshotDiff diff) {
        Cutoffs cutoffs = regionCutoff.get(region);
        if (cutoffs == null) {
            return diff;
        }
        if (diff == null) {
            return null;
        }
        if (bracket.equals(THREE_V_THREE)) {
            Long cutoff = cutoffs.threeVThree();
            return new SnapshotDiff(diff.chars().stream().map(charAndDiff -> {
                if (charAndDiff.character().rating() >= cutoff) {
                    return new CharAndDiff(charAndDiff.character().changeCutoff(true), charAndDiff.diff());
                } else {
                    return charAndDiff;
                }
            }).collect(Collectors.toList()), diff.timestamp());
        } else if (bracket.equals(RBG)) {
            Long cutoff = cutoffs.battlegrounds("ALLIANCE");
            return new SnapshotDiff(diff.chars().stream().map(charAndDiff -> {
                if (charAndDiff.character().rating() >= cutoff) {
                    return new CharAndDiff(charAndDiff.character().changeCutoff(true), charAndDiff.diff());
                } else {
                    return charAndDiff;
                }
            }).collect(Collectors.toList()), diff.timestamp());
        } else if (bracket.equals(SHUFFLE)) {
            return new SnapshotDiff(diff.chars().stream().map(charAndDiff -> {
                String fullSpec = charAndDiff.character().fullSpec();
                String spec = fullSpec.toLowerCase().split(" ")[0];
                if (fullSpec.equals("Frost Mage")) {
                    spec = "frostm";
                } else if (fullSpec.equals("Frost Death Knight")) {
                    spec = "frostd";
                } else if (fullSpec.equals("Beast Mastery Hunter")) {
                    spec = "beastmastery";
                }
                Long cutoff = cutoffs.shuffle(spec);
                if(cutoff == null) {
                    log.warn("No cutoff for spec {} in shuffle", spec + " " + fullSpec);
                    return charAndDiff;
                }
                if (charAndDiff.character().rating() >= cutoff) {
                    return new CharAndDiff(charAndDiff.character().changeCutoff(true), charAndDiff.diff());
                } else {
                    return charAndDiff;
                }
            }).collect(Collectors.toList()), diff.timestamp());
        }
        return diff;
    }

    private Snapshot applyCutoffs(String bracket, String region, Snapshot diff) {
        Cutoffs cutoffs = regionCutoff.get(region);
        if (cutoffs == null) {
            return diff;
        }
        if (diff == null) {
            return null;
        }
        if (bracket.equals(THREE_V_THREE)) {
            Long cutoff = cutoffs.threeVThree();
            return new Snapshot(diff.characters().stream().map(ch -> {
                if (ch.rating() >= cutoff) {
                    return ch.changeCutoff(true);
                } else {
                    return ch;
                }
            }).collect(Collectors.toList()), diff.timestamp(), diff.region(), diff.dateTime());
        } else if (bracket.equals(RBG)) {
            Long cutoff = cutoffs.battlegrounds("ALLIANCE");
            return new Snapshot(diff.characters().stream().map(ch -> {
                if (ch.rating() >= cutoff) {
                    return ch.changeCutoff(true);
                } else {
                    return ch;
                }
            }).collect(Collectors.toList()), diff.timestamp(), diff.region(), diff.dateTime());
        } else if (bracket.equals(SHUFFLE)) {
            return new Snapshot(diff.characters().stream().map(ch -> {
                String fullSpec = ch.fullSpec();
                String spec = fullSpec.toLowerCase().split(" ")[0];
                if (fullSpec.equals("Frost Mage")) {
                    spec = "frostm";
                } else if (fullSpec.equals("Frost Death Knight")) {
                    spec = "frostd";
                } else if (fullSpec.equals("Beast Mastery Hunter")) {
                    spec = "beastmastery";
                }
                Long cutoff = cutoffs.shuffle(spec);
                if(cutoff == null) {
                    log.warn("No cutoff for spec {} in shuffle", spec + " " + fullSpec);
                    return ch;
                }
                if (ch.rating() >= cutoff) {
                    return ch.changeCutoff(true);
                } else {
                    return ch;
                }
            }).collect(Collectors.toList()), diff.timestamp(), diff.region(), diff.dateTime());
        }
        return diff;
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
                .andThen(db.deleteOlderThanHours(bracket, 24 * 30)
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
