package io.github.sammers.pla;

import io.reactivex.*;
import io.reactivex.Observable;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.FindOptions;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.core.buffer.Buffer;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.client.HttpRequest;
import io.vertx.reactivex.ext.web.client.WebClient;
import org.apache.commons.collections4.CollectionUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.*;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

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


    private final List<String> shuffleSpecs = new ArrayList<>() {{
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

    private final DB db;

    public Ladder(Vertx vertx, WebClient web, DB db) {
        this.vertx = vertx;
        this.web = web;
        this.db = db;
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
        Single<List<Character>> res = Single.just(new ArrayList<>(1000 * shuffleSpecs.size()));
        for (String shuffleSpec : shuffleSpecs) {
            for (int i = 1; i <= 10; i++) {
                int finalI = i;
                res = res.flatMap(characters ->
                    ladderShuffle(shuffleSpec, finalI, region).map(c -> {
                        characters.addAll(c);
                        return characters;
                    })
                );
            }
        }
        return res.map(chars -> {
                chars.sort(Comparator.comparing(Character::rating).reversed());
                return chars;
            })
            .map(chars -> Snapshot.of(chars, region))
            .flatMap(d -> newDataOnBracket(bracket, region, d).andThen(Single.just(d)));
    }

    public Single<Snapshot> fetchLadder(String bracket, String region) {
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
        return res
            .map(chars -> Snapshot.of(chars, region))
            .flatMap(d -> newDataOnBracket(bracket, region, d).andThen(Single.just(d)));
    }

    private HttpRequest<Buffer> ladderReuqest(String bracket, Integer page, String region) {
        String url = String.format("https://worldofwarcraft.blizzard.com/%s/game/pvp/leaderboards/%s", region, bracket);
        HttpRequest<Buffer> request = web.getAbs(url).addQueryParam("page", page.toString());
        return request;
    }

    public Single<List<Character>> ladderShuffle(String bracket, Integer page, String region) {
        return ladderReuqest(bracket, page, region).rxSend().map(ok -> {
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
        return ladderReuqest(bracket, page, region).rxSend().map(ok -> {
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

    public void start() {
        loadRegionData(EU)
            .andThen(loadRegionData(US))
            .andThen(
                runDataUpdater(US,
                    runDataUpdater(EU, Observable.interval(0, 60, TimeUnit.MINUTES))
                )
            )
            .subscribe();
    }

    private <R> Observable<Snapshot> runDataUpdater(String region, Observable<R> tickObservable) {
        return tickObservable
            .flatMapSingle(tick -> threeVThree(region))
            .flatMapSingle(tick -> twoVTwo(region))
            .flatMapSingle(tick -> battlegrounds(region))
            .flatMapSingle(tick -> shuffle(region));
    }

    private Completable loadRegionData(String region) {
        return loadLast(TWO_V_TWO, region)
            .andThen(loadLast(THREE_V_THREE, region))
            .andThen(loadLast(RBG, region))
            .andThen(loadLast(SHUFFLE, region));
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
        return calcDiffAndCombine(bracket, maybes)
            .flatMapCompletable(res -> {
                diffsByBracket(bracket, region).set(res);
                log.info("Diffs has been calculated for bracket {}-{}, diffs:{}", region, bracket, res.chars().size());
                return Completable.complete();
            });

    }

    public final Maybe<SnapshotDiff> calcDiffAndCombine(String bracket, List<Maybe<Snapshot>> snaps) {
        return Maybe.merge(snaps).toList()
            .map(snapshots -> snapshots.stream().distinct().sorted(Comparator.comparing(Snapshot::timestamp)).toList())
            .flatMapMaybe(snapshots -> {
                try {
                    List<SnapshotDiff> diffs = new ArrayList<>();
                    for (int i = 1; i < snapshots.size(); i++) {
                        Snapshot old = snapshots.get(i - 1);
                        Snapshot current = snapshots.get(i);
                        SnapshotDiff e = Calculator.calculateDiff(old, current, bracket);
                        if (e.chars().size() != 0) {
                            diffs.add(e);
                        }
                    }
                    SnapshotDiff res = null;
                    for (int i = diffs.size() - 1; i > 0; i--) {
                        if (i == diffs.size() - 1) {
                            res = diffs.get(i - 1);
                        }
                        res = Calculator.combine(diffs.get(i - 1), res, bracket);
                    }
                    if (res == null) {
                        return Maybe.empty();
                    }
                    return Maybe.just(res);
                } catch (Exception e) {
                    log.error("Error while calculating diff for bracket {}", bracket, e);
                    return Maybe.error(e);
                }
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
        AtomicReference<Snapshot> older = refByBracket(bracket + "_older", region);
        AtomicReference<Snapshot> olderOlder = refByBracket(bracket + "_older_older", region);
        if (current.get() == null || !CollectionUtils.isEqualCollection(newCharacters.characters(), current.get().characters())) {
            olderOlder.set(older.get());
            older.set(current.get());
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
