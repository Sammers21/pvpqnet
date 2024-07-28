package io.github.sammers.pla.logic;

import org.javatuples.Pair;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Stats on how popular each realm is.
 */
public class RealmStats {

    private Map<Pair<String, String>, Long> realmStats = new HashMap<>();

    public void addRealmStat(String realm, String region, long count) {
        realmStats.compute(Pair.with(realm, region), (k, v) -> v == null ? count : v + count);
    }

    public List<Pair<String, String>> top20Realms() {
        List<Pair<String, String>> top20 = new ArrayList<>(realmStats.keySet());
        top20.sort((r1, r2) -> Long.compare(realmStats.get(r2), realmStats.get(r1)));
        return top20.subList(0, Math.min(20, top20.size()));
    }

    public List<Pair<String, String>> realmsStartingWithTop20(String prefix) {
        List<Pair<String, String>> realms = new ArrayList<>();
        for (Pair<String, String> realm : realmStats.keySet()) {
            if (realm.getValue0().toLowerCase().startsWith(prefix.toLowerCase())) {
                realms.add(realm);
            }
        }
        return realms;
    }

}
