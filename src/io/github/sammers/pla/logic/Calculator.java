package io.github.sammers.pla.logic;

import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.Meta;
import io.github.sammers.pla.db.Snapshot;
import io.github.sammers.pla.db.Spec;
import io.reactivex.Maybe;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

public class Calculator {

    private static final Logger log = LoggerFactory.getLogger(Calculator.class);

    public static Maybe<SnapshotDiff> calcDiffAndCombine(String bracket, String region, List<Maybe<Snapshot>> snaps) {
        AtomicInteger snapsCnt = new AtomicInteger();
        return Maybe.merge(snaps).toList()
            .map(snapshots -> {
                snapsCnt.set(snapshots.size());
                return snapshots.stream().sorted(Comparator.comparing(Snapshot::timestamp)).toList();
            })
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
                    if (diffs.size() > 0) {
                        res = diffs.get(diffs.size() - 1);
                    }
                    for (int i = diffs.size() - 1; i > 0; i--) {
                        res = Calculator.combine(diffs.get(i - 1), res, bracket);
                    }
                    SnapshotDiff resSnap;
                    if (res == null) {
                        resSnap = SnapshotDiff.empty();
                    } else {
                        resSnap = res;
                    }
                    log.info("Diffs has been calculated for bracket {}-{}, snaps:{}, uniqSnaps={}, snapDiffs={}, diffs:{}",
                        region,
                        bracket,
                        snapsCnt.get(),
                        snapshots.size(),
                        diffs.stream().map(SnapshotDiff::chars).map(List::size).reduce(0, Integer::sum),
                        resSnap.chars().size()
                    );
                    return Maybe.just(resSnap);
                } catch (Exception e) {
                    log.error("Error while calculating diff for bracket {}", bracket, e);
                    return Maybe.error(e);
                }
            });
    }

    public static SnapshotDiff calculateDiff(Snapshot oldChars, Snapshot newChars, String bracket) {
        ArrayList<CharAndDiff> res = new ArrayList<>(newChars.characters().size());
        Function<Character, String> idF = getIdFunction(bracket);
        Map<String, Character> oldMap = oldChars.characters().stream().collect(Collectors.toMap(idF, c -> c, (a, b) -> a));
        for (Character newCharx : newChars.characters()) {
            Character newChar;
            Character oldChar = oldMap.get(idF.apply(newCharx));
            if (oldChar != null && (newCharx.wins() + newCharx.losses() < oldChar.wins() + oldChar.losses())) {
                newChar = oldChar;
                oldChar = newCharx;
            } else {
                newChar = newCharx;
            }
            CharAndDiff e;
            if (oldChar == null) {
                e = new CharAndDiff(newChar, new Diff(0L, 0L, 0L, 0L, newChars.timestamp()));
            } else {
                e = new CharAndDiff(newChar,
                    new Diff(
                        newChar.wins() - oldChar.wins(),
                        newChar.losses() - oldChar.losses(),
                        newChar.rating() - oldChar.rating(),
                        newChar.pos() - oldChar.pos(),
                        newChars.timestamp()
                    )
                );
                if (e.diff().won() < 0 || e.diff().lost() < 0) {
                    System.out.println("Negative diff: " + e);
                    e = new CharAndDiff(e.character(), new Diff(e.diff().won(), e.diff().lost(), e.diff().ratingDiff(), e.diff().rankDiff(), e.diff().timestamp()));
                }
            }
            if (e.diff().lost() == 0 && e.diff().won() == 0) {
                continue;
            } else {
                res.add(e);
            }
        }
        res.sort(Comparator.comparing((CharAndDiff o) -> o.character().rating()).reversed());
        return new SnapshotDiff(res, newChars.timestamp());
    }

    public static Function<Character, String> getIdFunction(String bracket) {
        Function<Character, String> idF;
        if (bracket.equals("shuffle")) {
            idF = Character::fullNameWSpec;
        } else {
            idF = Character::fullNameWClass;
        }
        return idF;
    }

    public static SnapshotDiff combine(SnapshotDiff older, SnapshotDiff newver, String bracket) {
        Function<CharAndDiff, String> idF = c -> getIdFunction(bracket).apply(c.character());
        Map<String, CharAndDiff> res = newver.chars().stream().collect(Collectors.toMap(idF, c -> c, (a, b) -> a));
        for (CharAndDiff oldChar : older.chars()) {
            res.putIfAbsent(idF.apply(oldChar), oldChar);
        }
        List<CharAndDiff> resList = res.values().stream().sorted(Comparator.comparing((CharAndDiff o) -> o.character().rating()).reversed()).toList();
        return new SnapshotDiff(new ArrayList<>(resList), newver.timestamp());
    }

    public static double pWinrate(List<CharAndDiff> chars) {
        return 0;
    }

    public static double pPresence(List<CharAndDiff> chars ) {
        return 0;
    }

    public static Meta calculateMeta(SnapshotDiff snapshot, String role, double... ratios) {
        Set<String> acceptedSpecs;
        if (role.equals("all")){
            acceptedSpecs = Spec.ALL_SPECS;
        } else if (role.equals("dps")) {
            acceptedSpecs = Spec.DPS_SPECS;
        } else if (role.equals("heal")) {
            acceptedSpecs = Spec.HEAL_SPECS;
        } else if (role.equals("tank")) {
            acceptedSpecs = Spec.TANK_SPECS;
        } else if (role.equals("melee")) {
            acceptedSpecs = Spec.MELEE_SPECS;
        } else if (role.equals("ranged")) {
            acceptedSpecs = Spec.RANGED_SPECS;
        } else {
            throw new IllegalArgumentException("Unknown role: " + role);
        }
        List<CharAndDiff> characters = snapshot.chars();
        Map<String, List<CharAndDiff>> specAndChars = characters.stream()
            .filter((CharAndDiff character) -> acceptedSpecs.contains(character.character().fullSpec()))
            .collect(Collectors.groupingBy(character -> character.character().fullSpec(), Collectors.toList()));
        List<Spec> specs = specAndChars.entrySet().stream().map(entry -> {
            Map<String, Double> res = new HashMap<>();
            for(double ratio : ratios) {
//                double pWinrate = pWinrate(entry.getValue(), r, r + 0.1, 0, role);
//                double pPresence = pPresence(entry.getValue(), r, r + 0.1, 0, role);
//                res.put(String.format("%.1f", r), pWinrate * pPresence);
            }
            return new Spec(entry.getKey(), res);
        }).collect(Collectors.toList());

//        long p01 = p001 * 10;
//        long p001Cutoff = snapshot.chars().stream().sorted(Comparator.comparing(x -> {}).reversed()).skip(p001).findFirst().map(Character::rating).orElse(0L);
//        long p01Cutoff = snapshot.characters().stream().sorted(Comparator.comparing(Character::rating).reversed()).skip(p01).findFirst().map(Character::rating).orElse(0L);
//
//        List<Spec> specs = specAndChars.entrySet().stream().map(e -> {
//            List<Character> p01Chars = e.getValue().stream().filter(c -> c.rating() >= p01Cutoff).toList();
//            List<Character> p001Chars = e.getValue().stream().filter(c -> c.rating() >= p001Cutoff).toList();
//            List<Character> p100Chars = e.getValue().stream().toList();
//            double p001Winrate = 0;
//            double p001Presence = 0;
//            if (p001Chars.size() != 0) {
//                p001Winrate = p001Chars.stream().mapToDouble(c -> c.wins() * 1.0 / (c.wins() + c.losses())).average().orElse(0);
//                p001Presence = (double) p001Chars.size() / p001;
//            }
//            double p01Winrate = 0;
//            double p01Presence = 0;
//            if (p01Chars.size() != 0) {
//                p01Winrate = p01Chars.stream().mapToDouble(c -> c.wins() * 1.0 / (c.wins() + c.losses())).average().orElse(0);
//                p01Presence = (double) p01Chars.size() / p01;
//            }
//            double p100Winrate = 0;
//            double p100Presence = 0;
//            if (p01Chars.size() != 0) {
//                p100Winrate = p100Chars.stream().mapToDouble(c -> c.wins() * 1.0 / (c.wins() + c.losses())).average().orElse(0);
//                p100Presence = (double) p100Chars.size() / p01;
//            }
//            return new Spec(e.getKey(),
//                p001Winrate, p001Presence,
//                p01Winrate, p01Presence,
//                p01Winrate, p01Presence,
//                p01Winrate, p01Presence,
//                p01Winrate, p01Presence,
//                p100Winrate, p100Presence
//            );
//        }).collect(Collectors.toList());
        return new Meta(Map.of(), specs);
    }

    public static Long totalPages(long itemsTotal, long pageSize) {
        long result;
        if (itemsTotal % pageSize == 0) {
            result = itemsTotal / pageSize;
        } else {
            result = itemsTotal / pageSize + 1;
        }
        return result;
    }
}
