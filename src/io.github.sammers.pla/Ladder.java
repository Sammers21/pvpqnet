package io.github.sammers.pla;

import io.reactivex.Completable;
import io.reactivex.Observable;
import io.reactivex.Single;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.FindOptions;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.client.WebClient;
import org.jsoup.Jsoup;
import org.jsoup.nodes.*;
import org.jsoup.select.Elements;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

public class Ladder {

    private final Vertx vertx;
    private final WebClient web;

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

    public final AtomicReference<List<Character>> twoVTwoladder = new AtomicReference<>();
    public final AtomicReference<List<Character>> threeVThreeLadder = new AtomicReference<>();
    public final AtomicReference<List<Character>> shuffleLadder = new AtomicReference<>();
    public final AtomicReference<List<Character>> bgLadder = new AtomicReference<>();
    private final MongoClient mongoClient;

    public Ladder(Vertx vertx, WebClient web, MongoClient mongoClient) {
        this.vertx = vertx;
        this.web = web;
        this.mongoClient = mongoClient;
    }

    public Single<List<Character>> threeVThree() {
        String bracket = "3v3";
        return fetchLadder(bracket)
                .doOnSuccess(threeVThreeLadder::set)
                .flatMap(chars -> saveToMongo(bracket, Snapshot.of(chars)).andThen(Single.just(chars)));
    }

    public Single<List<Character>> twoVTwo() {
        String bracket = "2v2";
        return fetchLadder(bracket)
                .doOnSuccess(twoVTwoladder::set)
                .flatMap(chars -> saveToMongo(bracket, Snapshot.of(chars)).andThen(Single.just(chars)));
    }

    public Single<List<Character>> battlegrounds() {
        String bracket = "battlegrounds";
        return fetchLadder(bracket)
                .doOnSuccess(bgLadder::set)
                .flatMap(chars -> saveToMongo(bracket, Snapshot.of(chars)).andThen(Single.just(chars)));
    }

    public Single<List<Character>> shuffle() {
        String shuffle = "shuffle";
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
                }).flatMap(chars -> saveToMongo(shuffle, Snapshot.of(chars)).andThen(Single.just(chars)))
                .doOnSuccess(shuffleLadder::set);
    }

    public Single<List<Character>> fetchLadder(String bracket) {
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
        return res;
    }

    public Completable saveToMongo(String bracket, Snapshot snapshot) {
        return mongoClient.rxSave(bracket, snapshot.toJson()).ignoreElement();
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
                .doOnSuccess(ok -> System.out.println(String.format("OK %s %s", bracket, page)))
                .doOnError(err -> System.out.println(String.format("ERR %s %s", bracket, page)));
    }

    public Single<List<Character>> ladderTraditional(String bracket, Integer page) {
        String url = String.format("https://worldofwarcraft.blizzard.com/en-gb/game/pvp/leaderboards/%s", bracket);
        return web.getAbs(url).addQueryParam("page", page.toString()).rxSend().map(ok -> {
                    int code = ok.statusCode();
                    if (code != 200) {
                        System.out.println("NON 200 code " + code);
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
                .doOnSuccess(ok -> System.out.println(String.format("OK %s %s", bracket, page)))
                .doOnError(err -> System.out.println(String.format("ERR %s %s", bracket, page)));
    }

    public void start() {
        loadLast("2v2", twoVTwoladder)
                .andThen(loadLast("3v3", threeVThreeLadder))
                .andThen(loadLast("battlegrounds", bgLadder))
                .andThen(loadLast("shuffle", shuffleLadder))
                .andThen(Observable.interval(0, 60, TimeUnit.MINUTES)
                        .flatMapSingle(tick -> threeVThree())
                        .flatMapSingle(tick -> twoVTwo())
                        .flatMapSingle(tick -> battlegrounds())
                        .flatMapSingle(tick -> shuffle())
                ).subscribe();
    }

    private Completable loadLast(String bracket, AtomicReference<List<Character>> ref) {
        FindOptions fopts = new FindOptions().setSort(new JsonObject().put("timestamp", -1)).setLimit(10);
        JsonObject opts = new JsonObject();
        return mongoClient.rxFindWithOptions(bracket, opts, fopts).flatMapCompletable(res -> {
            List<Snapshot> snapshots = res.stream().map(Snapshot::fromJson).toList();
            if (snapshots.size() > 0) {
                System.out.println(bracket + " bracket data has been loaded from mongo");
                ref.set(snapshots.get(0).characters().stream().map(c -> (Character) c).toList());
            }
            return Completable.complete();
        });
    }
}
