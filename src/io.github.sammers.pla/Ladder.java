package io.github.sammers.pla;

import io.reactivex.Completable;
import io.reactivex.Maybe;
import io.reactivex.Observable;
import io.reactivex.Single;
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

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
                sh = sh.flatMap(s -> blizzardAPI.pvpLeaderboard(specForBlizApi, region).map(leaderboard -> leaderboard.enrich(s)));
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
            resCharList = res.flatMap(s -> blizzardAPI.pvpLeaderboard(bracket, region).map(leaderboard -> leaderboard.enrich(s)));
        }
        return resCharList
            .map(chars -> Snapshot.of(chars, region, currentTimeMillis))
            .flatMap(d -> newDataOnBracket(bracket, region, d).andThen(Single.just(d)));
    }

    public void start() {
        loadRegionData(EU)
            .andThen(loadRegionData(US))
            .andThen(updateChars(EU))
            .andThen(updateChars(US))
            .andThen(
                runDataUpdater(US,
                    runDataUpdater(EU, Observable.interval(0, 30, TimeUnit.MINUTES))
                )
            )
            .flatMapCompletable(d -> updateChars("eu"))
            .andThen(updateChars("us"))
            .subscribe();
    }

    private Completable updateChars(String region) {
        return Completable.defer(() -> {
            List<Completable> completables = brackets.stream().flatMap(bracket -> {
                    AtomicReference<Snapshot> snapshotAtomicReference = refByBracket(bracket, region);
                    Snapshot snapshot = snapshotAtomicReference.get();
                    if (snapshot == null) {
                        return Stream.of();
                    }
                    return snapshot.characters().stream().flatMap(c -> {
                        WowAPICharacter wowAPICharacter = characterCache.get(c.fullName());
                        if (wowAPICharacter == null) {
                            return Stream.of(c);
                        } else {
                            return Stream.of();
                        }
                    });
                }).collect(Collectors.toSet()).stream()
                .map(wowChar ->
                    blizzardAPI.character(region, wowChar.realm(), wowChar.name()).flatMap(c -> {
                        characterCache.put(wowChar.fullName(), c);
                        return db.upsertCharacter(c);
                    }).doOnSuccess(d -> log.info("Updated character: " + wowChar))
                    .ignoreElement()).toList();
            return Completable.concat(completables);
        }).onErrorComplete();
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
                        return new Character(pos, rating, name, clazz, fullSpec, fraction, realm, wins, losses);
                    }).toList();
                    return characters;
                }
            })
            .doOnSuccess(ok -> log.info(String.format("%s-%s ladder has been fetched page=%s", region, bracket, page)))
            .doOnError(err -> log.info(String.format("ERR %s %s %s", region, bracket, page)));
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
                    return new Character(pos, rating, name, clazz, fullSpec, fraction, realm, wins, losses);
                }).toList();
                return characters;
            })
            .doOnSuccess(ok -> log.info(String.format("%s-%s ladder has been fetched page=%s", region, bracket, page)))
            .doOnError(err -> log.info(String.format("ERR %s %s %s", region, bracket, page)));
    }

    private <R> Observable<Snapshot> runDataUpdater(String region, Observable<R> tickObservable) {
        return tickObservable
            .flatMapSingle(tick -> threeVThree(region))
            .flatMapSingle(tick -> twoVTwo(region))
            .flatMapSingle(tick -> battlegrounds(region))
            .flatMapSingle(tick -> shuffle(region));
    }

    private Completable loadRegionData(String region) {
        return loadWowCharApiData(region).onErrorComplete()
            .andThen(loadLast(TWO_V_TWO, region))
            .andThen(loadLast(THREE_V_THREE, region))
            .andThen(loadLast(RBG, region))
            .andThen(loadLast(SHUFFLE, region));
    }

    private Completable loadWowCharApiData(String region) {
        String realRegion;
        if(region.equals(EU)) {
            realRegion = "eu";
        } else {
            realRegion = "us";
        }
        return db.fetchChars(realRegion)
            .flatMapCompletable(characters -> {
                log.info("Data size= {} for region {} has been loaded from DB", characters.size(), region);
                characters.forEach(character -> {
                    characterCache.put(character.fullName(), character);
                });
                return Completable.complete();
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
        Maybe<Snapshot> sixHrsAgo = db.getMinsAgo(bracket, region, 60 * 6);
        Maybe<Snapshot> fiveHrsAgo = db.getMinsAgo(bracket, region, 60 * 5);
        Maybe<Snapshot> fourHrsAgo = db.getMinsAgo(bracket, region, 60 * 4);
        Maybe<Snapshot> threeHrsAgo = db.getMinsAgo(bracket, region, 60 * 3);
        Maybe<Snapshot> twoHrsAgo = db.getMinsAgo(bracket, region, 60 * 2);
        Maybe<Snapshot> oneHrAgo = db.getMinsAgo(bracket, region, 60);
        List<Maybe<Snapshot>> maybes = List.of(sixHrsAgo, fiveHrsAgo, fourHrsAgo, threeHrsAgo, twoHrsAgo, oneHrAgo, Maybe.just(refByBracket(bracket, region).get()));
        return Calculator.calcDiffAndCombine(bracket, region, maybes)
            .flatMapCompletable(res -> {
                diffsByBracket(bracket, region).set(res);
                return Completable.complete();
            });

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
                .andThen(db.deleteOlderThan24Hours(bracket)
                    .ignoreElement()
                    .andThen(calcDiffs(bracket, region)));
        } else {
            log.info("Data for bracket {} are equal, not updating", bracket);
            return Completable.complete();
        }
    }
}
