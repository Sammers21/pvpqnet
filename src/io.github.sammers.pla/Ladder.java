package io.github.sammers.pla;

import io.reactivex.Completable;
import io.reactivex.Maybe;
import io.reactivex.Observable;
import io.reactivex.Single;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.FindOptions;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.client.WebClient;
import org.apache.commons.collections4.CollectionUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.*;
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

public class Ladder {

    private static final Logger log = LoggerFactory.getLogger(Ladder.class);
    private final Vertx vertx;
    private final WebClient web;

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

    public Single<Snapshot> threeVThree() {
        String bracket = "3v3";
        return fetchLadder(bracket);
    }

    public Single<Snapshot> twoVTwo() {
        String bracket = "2v2";
        return fetchLadder(bracket);
    }

    public Single<Snapshot> battlegrounds() {
        String bracket = "battlegrounds";
        return fetchLadder(bracket);
    }

    public Single<Snapshot> shuffle() {
        String bracket = "shuffle";
        Single<List<Character>> res = Single.just(new ArrayList<>(1000 * shuffleSpecs.size()));
        for (String shuffleSpec : shuffleSpecs) {
            for (int i = 1; i <= 10; i++) {
                int finalI = i;
                res = res.flatMap(characters ->
                    ladderShuffle(shuffleSpec, finalI).map(c -> {
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
            .map(Snapshot::of)
            .flatMap(d -> newDataOnBracket(bracket, d).andThen(Single.just(d)));
    }

    public Single<Snapshot> fetchLadder(String bracket) {
        Single<List<Character>> res = Single.just(new ArrayList<>(1000));
        for (int i = 1; i <= 10; i++) {
            int finalI = i;
            res = res.flatMap(characters ->
                ladderTraditional(bracket, finalI).map(c -> {
                    characters.addAll(c);
                    return characters;
                })
            );
        }
        return res.map(Snapshot::of)
            .flatMap(d -> newDataOnBracket(bracket, d).andThen(Single.just(d)));
    }

    public Single<List<Character>> ladderShuffle(String bracket, Integer page) {
        String url = String.format("https://worldofwarcraft.blizzard.com/en-gb/game/pvp/leaderboards/%s", bracket);
        return web.getAbs(url).addQueryParam("page", page.toString()).rxSend().map(ok -> {
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
            .doOnSuccess(ok -> log.info(String.format("OK %s %s", bracket, page)))
            .doOnError(err -> log.info(String.format("ERR %s %s", bracket, page)));
    }

    public Single<List<Character>> ladderTraditional(String bracket, Integer page) {
        String url = String.format("https://worldofwarcraft.blizzard.com/en-gb/game/pvp/leaderboards/%s", bracket);
        return web.getAbs(url).addQueryParam("page", page.toString()).rxSend().map(ok -> {
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
            .doOnSuccess(ok -> log.info(String.format("%s ladder has been fetched page=%s", bracket, page)))
            .doOnError(err -> log.info(String.format("ERR %s %s", bracket, page)));
    }

    public void start() {
        loadLast(TWO_V_TWO)
            .andThen(loadLast(THREE_V_THREE))
            .andThen(loadLast(RBG))
            .andThen(loadLast(SHUFFLE))
            .andThen(Observable.interval(0, 60, TimeUnit.MINUTES)
                .flatMapSingle(tick -> threeVThree())
                .flatMapSingle(tick -> twoVTwo())
                .flatMapSingle(tick -> battlegrounds())
                .flatMapSingle(tick -> shuffle())
                .flatMapSingle(tick -> shuffle())
            ).subscribe();
    }

    private Completable loadLast(String bracket) {
        return db.getLast(bracket).flatMapCompletable(characters -> {
            refByBracket(bracket).set(characters);
            log.info("Data for bracket {} has been loaded from DB", bracket);
            return calcDiffs(bracket);
        });
    }

    public Completable calcDiffs(String bracket) {
        Maybe<Snapshot> sixHrsAgo = db.getMinsAgo(bracket, 60 * 5);
        Maybe<Snapshot> threeHrsAgo = db.getMinsAgo(bracket, 60 * 3);
        return sixHrsAgo.zipWith(threeHrsAgo, (six, three) -> {
            SnapshotDiff threeNow = Calculator.calculateDiff(three, refByBracket(bracket).get());
            SnapshotDiff sixThree = Calculator.calculateDiff(six, three);
            SnapshotDiff res = Calculator.combine(sixThree, threeNow);
            diffsByBracket(bracket).set(res);
            log.info("Diffs has been calculated for bracket {}, diffs:{}", bracket, res.chars().size());
            return Maybe.just(res);
        }).ignoreElement();
    }

    public AtomicReference<Snapshot> refByBracket(String bracket) {
        return refs.computeIfAbsent(bracket, k -> new AtomicReference<>());
    }

    public AtomicReference<SnapshotDiff> diffsByBracket(String bracket) {
        return refDiffs.computeIfAbsent(bracket, k -> new AtomicReference<>());
    }

    public Completable newDataOnBracket(String bracket, Snapshot newCharacters) {
        AtomicReference<Snapshot> current = refByBracket(bracket);
        AtomicReference<Snapshot> older = refByBracket(bracket + "_older");
        AtomicReference<Snapshot> olderOlder = refByBracket(bracket + "_older_older");
        if (!CollectionUtils.isEqualCollection(newCharacters.characters(), current.get().characters())) {
            olderOlder.set(older.get());
            older.set(current.get());
            current.set(newCharacters);
            log.info("Data for bracket {} is different performing update", bracket);
            return db.insertOnlyIfDifferent(bracket, newCharacters).andThen(calcDiffs(bracket));
        } else {
            log.info("Data for bracket {} are equal, not updating", bracket);
            return Completable.complete();
        }
    }
}
