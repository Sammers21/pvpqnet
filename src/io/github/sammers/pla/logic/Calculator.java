package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.Multiclassers;
import io.github.sammers.pla.blizzard.Multiclassers.Info;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.Meta;
import io.github.sammers.pla.db.Snapshot;
import io.github.sammers.pla.db.Spec;
import io.reactivex.Maybe;
import org.javatuples.Triplet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

public class Calculator {

    private static final Logger log = LoggerFactory.getLogger(Calculator.class);

    public static Multiclassers calculateMulticlassers(Snapshot shuffleSnapshot, CharacterCache cache) {
        if (shuffleSnapshot == null) {
            return new Multiclassers(List.of());
        }
        Map<Integer, List<Character>> charsGrpd = new HashMap<>();
        for (Character character : shuffleSnapshot.characters()) {
            WowAPICharacter wowAPICharacter = cache.getByFullName(character.fullName());
            if (wowAPICharacter != null) {
                charsGrpd.compute(wowAPICharacter.petHash(), (k, v) -> {
                    if (k == -1) {
                        return null;
                    } else if (v == null) {
                        ArrayList<Character> characters = new ArrayList<>();
                        characters.add(character);
                        return characters;
                    } else {
                        v.add(character);
                        return v;
                    }
                });
            }
        }
        Map<String, Multiclassers.Info> res = new HashMap<>();
        for (Map.Entry<Integer, List<Character>> entry : charsGrpd.entrySet()) {
            List<Character> characters = entry.getValue();
            // group by spec
            Map<String, List<Character>> specGrpd = characters.stream().collect(Collectors.groupingBy(Character::fullSpec));
            // in every spec group find the highest rated character
            Map<String, Character> specAndHighestRated = specGrpd.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, entry1 -> {
                List<Character> value = entry1.getValue();
                return value.stream().max(Comparator.comparing(Character::rating)).orElseThrow();
            }));
            Map<String, Multiclassers.CharAndScore> specAndScore = specAndHighestRated.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, entry1 -> {
                Character character = entry1.getValue();
                return new Multiclassers.CharAndScore(character, calculateScore(Math.toIntExact(character.pos())));
            }));
            int totalScore = specAndScore.values().stream().mapToInt(Multiclassers.CharAndScore::score).sum();
            Character main = specAndScore.values().stream().max(Comparator.comparing(Multiclassers.CharAndScore::score)).orElseThrow().character();
            Multiclassers.Info info = new Multiclassers.Info(-1, totalScore, main, specAndScore);
            res.put(entry.getKey().toString(), info);
        }
        // sort by total score
        List<Info> list = res.values().stream().sorted(Comparator.comparing(Multiclassers.Info::totalScore).reversed()).toList();
        List<Info> resList = new ArrayList<>(list.size());
        for (int i = 0; i < list.size(); i++) {
            Info info = list.get(i);
            resList.add(new Info(i + 1, info.totalScore(), info.main(), info.specs()));
        }
        return new Multiclassers(resList);
    }

    /**
     * Same as in this python funtion
     * def ladderScrore(x):
     *     if x>=1 and x<=50:
     *         # return 600 + (50 - x) * (400 / 50)
     *         return 600 + (50 - x) * (400 / 50)
     *     elif x>=51 and x<=100:
     *         return 400 + (100 - x) * (200 / 50)
     *     elif x>=101 and x<=5000:
     *         return 0 + Math.floor((5000 - x) * (400 / 4900))
     *     else:
     *         throw("x is out of range")
     * @return score
     */
    public static Integer calculateScore(Integer ladderPos) {
        if (ladderPos >= 1 && ladderPos <= 50) {
            return 600 + (50 - (ladderPos - 1)) * (400 / 50);
        } else if (ladderPos >= 51 && ladderPos <= 100) {
            return 400 + (100 - (ladderPos - 1)) * (200 / 50);
        } else if (ladderPos >= 101 && ladderPos <= 5000) {
            return Math.round((5000 - (ladderPos - 1)) * (400 / 4900));
        } else {
            throw new IllegalArgumentException("ladderPos is out of range: " + ladderPos);
        }
    }


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
        return calculateDiff(oldChars, newChars, bracket, true);
    }

    public static List<List<CharAndDiff>> whoPlayedWithWho(SnapshotDiff diff, int pplInTheGroup, CharacterCache cache) {
        long maxHealersInOneGroup;
        long maxDpsInOneGroup;
        long maxTanksInOneGroup;
        if (pplInTheGroup == 2) {
            maxHealersInOneGroup = 1;
            maxDpsInOneGroup = 2;
            maxTanksInOneGroup = 1;
        } else if (pplInTheGroup == 3) {
            maxHealersInOneGroup = 1;
            maxDpsInOneGroup = 2;
            maxTanksInOneGroup = 1;
        } else if (pplInTheGroup == 10) {
            maxHealersInOneGroup = 3;
            maxDpsInOneGroup = 7;
            maxTanksInOneGroup = 2;
        } else {
            throw new IllegalArgumentException("Unknown pplInTheGroup: " + pplInTheGroup);
        }
        Map<Triplet<Long, Long, Long>, List<List<CharAndDiff>>> whoWWhoClassic = new HashMap<>();
        Map<Triplet<Long, Long, Long>, List<List<CharAndDiff>>> whoWWhoWAlts = new HashMap<>();
        for (var charAndDiff : diff.chars()) {
            Diff df = charAndDiff.diff();
            Triplet<Long, Long, Long> key = Triplet.with(df.won(), df.lost(), df.timestamp());
            whoWWhoClassic.compute(key, (k, v) -> {
                if (v == null) {
                    v = new ArrayList<>();
                }
                if (v.isEmpty()) {
                    ArrayList<CharAndDiff> group = new ArrayList<>();
                    group.add(charAndDiff);
                    v.add(group);
                } else {
                    boolean healerSpec = charAndDiff.character().isHealerSpec();
                    boolean tankSpec = charAndDiff.character().isTankSpec();
                    boolean dpsSpec = charAndDiff.character().isDpsSpec();
                    if (healerSpec) {
                        roleGroup(pplInTheGroup, maxHealersInOneGroup, c -> c.character().isHealerSpec(), charAndDiff, v);
                    } else if (tankSpec) {
                        roleGroup(pplInTheGroup, maxTanksInOneGroup, c -> c.character().isTankSpec(), charAndDiff, v);
                    } else if (dpsSpec) {
                        roleGroup(pplInTheGroup, maxDpsInOneGroup, c -> c.character().isDpsSpec(), charAndDiff, v);
                    }
                }
                return v;
            });
        }
        return whoWWhoClassic.values().stream().flatMap(Collection::stream).filter(group -> group.size() >= 1).toList();
    }

    private static void roleGroup(int pplInTheGroup, long maxOfThatRoleInGroup, Predicate<CharAndDiff>  roleFilter, CharAndDiff charAndDiff, List<List<CharAndDiff>> wholeList) {
        List<CharAndDiff> group = wholeList.stream().filter(g -> {
            if(g.size() >= pplInTheGroup) {
                return false;
            }
            long currentRoleInGroupCount = g.stream().filter(roleFilter).count();
            return currentRoleInGroupCount < maxOfThatRoleInGroup;
        }).findFirst().orElse(null);
        if(group == null) {
            ArrayList<CharAndDiff> newGroup = new ArrayList<>();
            newGroup.add(charAndDiff);
            wholeList.add(newGroup);
        } else {
            group.add(charAndDiff);
        }
    }


    public static SnapshotDiff calculateDiff(Snapshot oldChars, Snapshot newChars, String bracket, boolean newIsZero) {
        ArrayList<CharAndDiff> res = new ArrayList<>(newChars.characters().size());
        Function<Character, String> idF = getIdFunction(bracket);
        Map<String, Character> oldMap;
        if (oldChars == null) {
            oldMap = new HashMap<>();
        } else {
            oldMap = oldChars.characters().stream().collect(Collectors.toMap(idF, c -> c, (a, b) -> a));
        }
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
                if (newIsZero) {
                    e = new CharAndDiff(newChar, new Diff(0L, 0L, 0L, 0L, newChars.timestamp()));
                } else {
                    e = new CharAndDiff(newChar,
                        new Diff(
                            newChar.wins(),
                            newChar.losses(),
                            newChar.rating(),
                            newChar.pos(),
                            newChars.timestamp()
                        )
                    );
                }
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
                    log.debug("Negative diff: " + e);
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
        return chars.stream().mapToDouble(c -> {
            if (c == null || c.diff() == null) {
                log.error("Null diff: {}", c);
                return 0;
            }
            return c.diff().won() / (double) (c.diff().won() + c.diff().lost());
        }).average().orElse(0);
    }

    public static double pPresence(List<CharAndDiff> chars, int total) {
        return chars.size() / (double) total;
    }

    public static Meta calculateMeta(SnapshotDiff snapshot, String role, String bracket, double... ratios) {
        Set<String> acceptedSpecs;
        if (role.equals("all")) {
            acceptedSpecs = Spec.ALL_SPECS;
        } else if (role.equals("dps")) {
            acceptedSpecs = Spec.DPS_SPECS;
        } else if (role.equals("healer")) {
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
        List<CharAndDiff> totalSortedRoleList = snapshot.chars().stream()
            .filter((CharAndDiff character) -> acceptedSpecs.contains(character.character().fullSpec()))
            .sorted(Comparator.comparing((CharAndDiff o) -> o.character().rating()).reversed()).toList();
        if (bracket.equals("shuffle")) {
            int maxMinRating = totalSortedRoleList.stream().collect(Collectors.groupingBy(character -> character.character().fullSpec(), Collectors.toList()))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue().stream().mapToLong(c -> c.character().rating()).min().orElse(0)))
                .values().stream().mapToInt(Long::intValue).max().orElse(0);
            totalSortedRoleList = totalSortedRoleList.stream().filter(c -> c.character().rating() >= maxMinRating).toList();
        }
        LinkedList<CharAndDiff> fsrtList = new LinkedList<>(totalSortedRoleList);
        LinkedList<List<Spec>> diviedLists = new LinkedList<>();
        int total = fsrtList.size();
        Map<String, Long> sizing = new HashMap<>();
        for (double ratio : ratios) {
            int take = (int) (total * ratio);
            ArrayList<CharAndDiff> sortedRatioList = new ArrayList<>();
            for (int i = 0; i < take; i++) {
                if (fsrtList.isEmpty()) {
                    log.error("Empty fsrtList: {}", i);
                    break;
                }
                CharAndDiff charD = fsrtList.removeFirst();
                sortedRatioList.add(charD);
            }
            int thisRatioTotal = sortedRatioList.size();
            long maxInRatio = sortedRatioList.stream().mapToLong(c -> c.character().rating()).max().orElse(0);
            long minInRatio = sortedRatioList.stream().mapToLong(c -> c.character().rating()).min().orElse(0);
            sizing.put(String.format("%.3f_total", ratio), (long) thisRatioTotal);
            sizing.put(String.format("%.3f_max", ratio), maxInRatio);
            sizing.put(String.format("%.3f_min", ratio), minInRatio);
            Map<String, List<CharAndDiff>> specAndChars = sortedRatioList.stream()
                .collect(Collectors.groupingBy(character -> character.character().fullSpec(), Collectors.toList()));
            List<Spec> specList = specAndChars.entrySet().stream().map(specAndChar -> {
                Map<String, Double> res = new HashMap<>();
                double pWinrate = pWinrate(specAndChar.getValue());
                double pPresence = pPresence(specAndChar.getValue(), thisRatioTotal);
                res.put(String.format("%.3f_win_rate", ratio), pWinrate);
                res.put(String.format("%.3f_presence", ratio), pPresence);
                return new Spec(specAndChar.getKey(), res);
            }).toList();
            diviedLists.add(specList);
        }
        List<Spec> specs = diviedLists.stream().flatMap(List::stream).collect(Collectors.groupingBy(Spec::specName, Collectors.toList()))
            .entrySet().stream().map(entry -> {
                Map<String, Double> res = new HashMap<>();
                for (Spec spec : entry.getValue()) {
                    res.putAll(spec.winRates());
                }
                for (Double ratio : ratios) {
                    if (!res.containsKey(String.format("%.3f_win_rate", ratio))) {
                        res.put(String.format("%.3f_win_rate", ratio), 0.0);
                    }
                    if (!res.containsKey(String.format("%.3f_presence", ratio))) {
                        res.put(String.format("%.3f_presence", ratio), 0.0);
                    }
                }
                return new Spec(entry.getKey(), res);
            }).toList();
        return new Meta(Map.of(), sizing, specs);
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

    public static String realmCalc(String realm) {
        String withCapFirst = realm.substring(0, 1).toUpperCase() + realm.substring(1).toLowerCase();
        return withCapFirst.replace(" ", "-");
    }

    public static int minutesTillNextMins(int mins) {
        ZoneId zone = ZoneId.systemDefault();
        ZonedDateTime now = ZonedDateTime.now(zone);
        int minutes = now.getMinute();
        int minutesTillNext = minutes % mins;
        ZonedDateTime nextTime = now.plusMinutes(minutesTillNext);
        Duration duration = Duration.between(now, nextTime);
        return (int) duration.toMinutes();
    }

    public static int minutesTill5am() {
        ZoneId zone = ZoneId.systemDefault();
        ZonedDateTime now = ZonedDateTime.now(zone);
        ZonedDateTime nextHour = now.withMinute(0).withSecond(0).withHour(5).plusDays(1);
        Duration duration = Duration.between(now, nextHour);
        return (int) duration.toMinutes();
    }
}
