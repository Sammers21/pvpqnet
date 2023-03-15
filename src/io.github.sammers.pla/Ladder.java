package io.github.sammers.pla;

import io.reactivex.Single;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.web.client.WebClient;
import org.jsoup.Jsoup;
import org.jsoup.nodes.*;
import org.jsoup.select.Elements;

import java.util.List;

public class Ladder {

    private final Vertx vertx;
    private final WebClient web;

    public Ladder(Vertx vertx, WebClient web) {
        this.vertx = vertx;
        this.web = web;
    }

    public List<LadderRecord> threeVthree() {
        List<LadderRecord> ladder = ladder("3v3", 1).blockingGet();
        return ladder;
    }

    public Single<List<LadderRecord>> ladder(String bracket, Integer page) {
        String url = String.format("https://worldofwarcraft.blizzard.com/en-gb/game/pvp/leaderboards/%s", bracket);
        return web.getAbs(url)
                .rxSend()
                .map(ok ->{
                    String ers = ok.bodyAsString();
                    Document parse = Jsoup.parse(ers);
                    Elements select = parse.select("#main > div.Pane.Pane--dirtBlue.bordered > div.Pane-content > div.Paginator > div.Paginator-pages > div:nth-child(1) > div > div.SortTable-body");
                    Element element = select.get(0);
                    List<Node> nodes = element.childNodes();
                    nodes.stream().map(Node::childNodes).forEach(nodeList -> {
                        String pos = nodeList.get(0).attr("data-value");
                        String rating = ((Element) nodeList.get(1).childNode(0).childNode(0).childNode(0).childNode(1)).text();
                        String name = nodeList.get(2).attr("data-value");
                        System.out.println(String.format("%s %s %s", pos, rating, name));
                    });
                    String val = select.val();
                    System.out.println(val);
                    return List.of();
                });
    }
}
