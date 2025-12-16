package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.Cutoffs;
import io.github.sammers.pla.blizzard.Multiclassers;
import io.github.sammers.pla.blizzard.Multiclassers.Info;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.*;
import io.github.sammers.pla.db.Character;
import io.reactivex.rxjava3.core.Maybe;
import org.javatuples.Pair;
import org.javatuples.Triplet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

public class Calculator {
  private static final Logger log = LoggerFactory.getLogger(Calculator.class);

  public static Multiclassers calculateMulticlassers(Snapshot shuffleSnapshot, CharacterCache cache, Cutoffs cutoffs) {
    if (shuffleSnapshot == null) {
      return Multiclassers.of(List.of());
    }
    // Transform Snapshot to SnapshotMLExt at the start - this calculates posUniq
    // for all characters
    SnapshotMLExt shuffleSnapshotMLExt = shuffleSnapshot.mlExt(cache);
    List<CharacterMLExt> snapshotCharacters = shuffleSnapshotMLExt.characters();
    Map<String, Set<CharacterMLExt>> charactersByFullName = snapshotCharacters.stream()
      .collect(Collectors.groupingBy(CharacterMLExt::fullName, Collectors.mapping(c -> c, Collectors.toSet())));
    // storing everything here
    List<Set<CharacterMLExt>> groups = new ArrayList<>();
    // char id -> element of groups array where it should be
    Map<Long, Integer> routingMap = new HashMap<>();
    for (CharacterMLExt characterExt : snapshotCharacters) {
      WowAPICharacter wowAPICharacter = cache.getByFullName(characterExt.fullName());
      if (wowAPICharacter == null) {
        continue;
      }
      Set<WowAPICharacter> all = new HashSet<>(cache.altsFor(wowAPICharacter));
      all = all.stream().filter(Objects::nonNull).collect(Collectors.toSet());
      Set<CharacterMLExt> allCharacters = all.stream()
        .map(WowAPICharacter::fullName)
        .map(charactersByFullName::get)
        .filter(Objects::nonNull)
        .flatMap(Set::stream)
        .collect(Collectors.toSet());
      all.add(wowAPICharacter);
      Set<Long> allIds = all.stream().map(WowAPICharacter::id).collect(Collectors.toSet());
      boolean anyRoute = false;
      Integer routeIdx = -1;
      for (Long id : allIds) {
        routeIdx = routingMap.get(id);
        if (routeIdx != null) {
          anyRoute = true;
          break;
        }
      }
      // if there is route, use it
      if (anyRoute) {
        Set<CharacterMLExt> group = groups.get(routeIdx);
        group.addAll(allCharacters);
        for (WowAPICharacter c : all) {
          routingMap.put(c.id(), routeIdx);
        }
      }
      // if no route - create new one in case allCharacters notEmpty
      else if (!allCharacters.isEmpty()) {
        groups.add(allCharacters);
        Integer idx = groups.size() - 1;
        for (WowAPICharacter c : all) {
          routingMap.put(c.id(), idx);
        }
      }
    }
    // Calculate total unique players for percentile calculation
    long totalUniquePlayers = groups.size();
    // Use intermediate record to collect data before creating final Info objects
    record MulticlasserData(int totalScore, Character main, Map<String, Multiclassers.CharAndScore> specs,
      int bestRankWithoutAlts) {
    }
    List<MulticlasserData> intermediateData = new ArrayList<>();
    for (Set<CharacterMLExt> characters : groups) {
      // group by normalized spec name to handle format differences like "Beast
      // Mastery Hunter" vs
      // "Beastmastery Hunter"
      Map<String, List<CharacterMLExt>> specGrpd = characters.stream()
        .collect(Collectors.groupingBy(c -> Cutoffs.normalizeSpecName(c.fullSpec())));
      // in every spec group find the highest rated character
      Map<String, CharacterMLExt> specAndHighestRated = specGrpd.entrySet()
        .stream()
        .collect(Collectors.toMap(Map.Entry::getKey, entry1 -> {
          List<CharacterMLExt> value = entry1.getValue();
          return value.stream().max(Comparator.comparing(CharacterMLExt::rating)).orElseThrow();
        }));
      // Use the character's actual fullSpec as the key for display, not the
      // normalized key
      // Also track the best character for rankWithoutAlts calculation
      final int[] bestRankWithoutAlts = { Integer.MAX_VALUE };
      Map<String, Multiclassers.CharAndScore> specAndScore = specAndHighestRated.entrySet()
        .stream()
        .collect(Collectors.toMap(entry1 -> entry1.getValue().fullSpec(), // Use character's fullSpec
          // as key
          entry1 -> {
            CharacterMLExt characterExt = entry1.getValue();
            String specKey = "SHUFFLE" + "/" + Cutoffs.specCodeByFullName(characterExt.fullSpec());
            // Get total unique players for this spec
            long specTotalPlayers = cutoffs != null && cutoffs.spotWithNoAlts.containsKey(specKey)
              ? Math.toIntExact(cutoffs.spotWithNoAlts.get(specKey)) * 1000
              : 5000; // fallback estimate
            // Use posUniq for score calculation instead of pos
            int rankWithoutAlts = characterExt.posUniq().intValue();
            Integer score = cutoffs == null
              ? Calculator.calculateScoreMclassOld(rankWithoutAlts)
              : Calculator.calculateMulticlassScoreBasedOnCutoff(rankWithoutAlts,
                Math.toIntExact(cutoffs.spotWithNoAlts.get(specKey)));
            // Tank specs have a max score of 400 instead of 1000
            if (Spec.TANK_SPECS.contains(characterExt.fullSpec())) {
              score = (int) (score / 2.5);
            }
            // Calculate percentile for this spec: lower is better
            double percentile = specTotalPlayers > 0 ? (double) rankWithoutAlts / specTotalPlayers * 100.0 : 0.0;
            String scoringTier = calculateScoringTier(percentile);
            // Track the best rank without alts for the overall multiclasser
            if (rankWithoutAlts < bestRankWithoutAlts[0]) {
              bestRankWithoutAlts[0] = rankWithoutAlts;
            }
            return new Multiclassers.CharAndScore(characterExt.character(), score, rankWithoutAlts, percentile,
              scoringTier);
          }));
      int totalScore = specAndScore.values().stream().mapToInt(Multiclassers.CharAndScore::score).sum();
      Character main = specAndScore.values()
        .stream()
        .max(Comparator.comparing(Multiclassers.CharAndScore::score))
        .orElseThrow()
        .character();
      intermediateData.add(new MulticlasserData(totalScore, main, specAndScore, bestRankWithoutAlts[0]));
    }
    // sort by total score and create final Info objects with all fields populated
    List<MulticlasserData> sorted = intermediateData.stream()
      .sorted(Comparator.comparing(MulticlasserData::totalScore).reversed())
      .toList();
    List<Info> resList = new ArrayList<>(sorted.size());
    for (int i = 0; i < sorted.size(); i++) {
      MulticlasserData data = sorted.get(i);
      int rank = i + 1;
      // Calculate percentile: (position / total) * 100, lower is better
      double percentile = totalUniquePlayers > 0 ? (double) rank / totalUniquePlayers * 100.0 : 0.0;
      // Determine scoring tier based on percentile
      String scoringTier = calculateScoringTier(percentile);
      // Create Info with all fields populated - never null
      resList.add(new Info(rank, data.totalScore(), data.main(), data.specs(), data.bestRankWithoutAlts(), percentile,
        scoringTier));
    }
    return Multiclassers.of(resList);
  }

  /**
   * Determines the scoring tier based on percentile position.
   *
   * @param percentile
   *          The percentile (0-100, lower is better)
   * @return String representation of the tier, e.g., "Top 0.1%", "Top 1%", etc.
   */
  public static String calculateScoringTier(double percentile) {
    if (percentile <= 0.1) {
      return "Top 0.1%";
    } else if (percentile <= 0.5) {
      return "Top 0.5%";
    } else if (percentile <= 1) {
      return "Top 1%";
    } else if (percentile <= 2) {
      return "Top 2%";
    } else if (percentile <= 5) {
      return "Top 5%";
    } else if (percentile <= 10) {
      return "Top 10%";
    } else if (percentile <= 20) {
      return "Top 20%";
    } else if (percentile <= 50) {
      return "Top 50%";
    } else {
      return "Below 50%";
    }
  }

  /**
   * Same as in this python funtion def ladderScrore(x): if x>=1 and x<=50: #
   * return 600 + (50 - x) * (400 / 50) return 600 + (50 - x) * (400 / 50) elif
   * x>=51 and x<=100: return 400 + (100 - x) * (200 / 50) elif x>=101 and
   * x<=5000: return 0 + Math.floor((5000 - x) * (400 / 4900)) else: throw("x is
   * out of range")
   *
   * @return score
   */
  public static Integer calculateScoreMclassOld(Integer ladderPos) {
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

  /**
   * The score is: 0.1% 1000-900 0.1%-0.2% 899-800 0.2%-0.5% 799-700 0.5%-1%
   * 699-600 1%-2% 599-500 2%-5% 499-400 5%-10% 399-300 10%-20% 299-200 20%-50%
   * 199-100 50%-100% 99-0
   *
   * @return score
   */
  public static Integer calculateMulticlassScoreBasedOnCutoff(Integer ladderPos, Integer numberOfR1Spot) {
    log.trace("calculateMulticlassScoreBasedOnCutoff: ladderPos={}, numberOfR1Spot={}", ladderPos, numberOfR1Spot);
    List<Pair<Pair<Integer, Integer>, Pair<Integer, Integer>>> percentAndLinearRange = List.of(
      new Pair<>(new Pair<>(0, 1), new Pair<>(1000, 900)), new Pair<>(new Pair<>(1, 2), new Pair<>(900, 750)),
      new Pair<>(new Pair<>(2, 5), new Pair<>(750, 550)), new Pair<>(new Pair<>(5, 10), new Pair<>(550, 300)),
      new Pair<>(new Pair<>(10, 20), new Pair<>(300, 150)), new Pair<>(new Pair<>(20, 50), new Pair<>(150, 50)),
      new Pair<>(new Pair<>(50, 1000), new Pair<>(50, 0)));
    for (int i = 0; i < percentAndLinearRange.size(); i++) {
      Pair<Pair<Integer, Integer>, Pair<Integer, Integer>> pair = percentAndLinearRange.get(i);
      Integer ladderSpotFrom = pair.getValue0().getValue0() * numberOfR1Spot;
      Integer ladderSpotTo = pair.getValue0().getValue1() * numberOfR1Spot;
      Integer spotsInThisRange = ladderSpotTo - ladderSpotFrom;
      Integer scoreFrom = pair.getValue1().getValue0();
      Integer scoreTo = pair.getValue1().getValue1();
      Integer scoreRange = scoreFrom - scoreTo;
      if (ladderPos >= ladderSpotFrom && ladderPos <= ladderSpotTo) {
        Integer ladderPosInThisRange = (ladderPos - ladderSpotFrom) - 1;
        double scoreInThisRange = Double.valueOf(scoreFrom)
          - ((double) (ladderPosInThisRange * scoreRange) / spotsInThisRange);
        return (int) scoreInThisRange;
      }
    }
    return 0;
  }

  public static Maybe<SnapshotDiff> calcDiffAndCombine(String bracket, String region, List<Maybe<Snapshot>> snaps) {
    AtomicInteger snapsCnt = new AtomicInteger();
    return Maybe.merge(snaps).toList().map(snapshots -> {
      snapsCnt.set(snapshots.size());
      return snapshots.stream().sorted(Comparator.comparing(Snapshot::timestamp)).toList();
    }).flatMapMaybe(snapshots -> {
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
        log.info("Diffs has been calculated for bracket {}-{}, snaps:{}, uniqSnaps={}, snapDiffs={}, " + "diffs:{}",
          region, bracket, snapsCnt.get(), snapshots.size(),
          diffs.stream().map(SnapshotDiff::chars).map(List::size).reduce(0, Integer::sum), resSnap.chars().size());
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

  private static void roleGroup(int pplInTheGroup, long maxOfThatRoleInGroup, Predicate<CharAndDiff> roleFilter,
    CharAndDiff charAndDiff, List<List<CharAndDiff>> wholeList) {
    List<CharAndDiff> group = wholeList.stream().filter(g -> {
      if (g.size() >= pplInTheGroup) {
        return false;
      }
      long currentRoleInGroupCount = g.stream().filter(roleFilter).count();
      return currentRoleInGroupCount < maxOfThatRoleInGroup;
    }).findFirst().orElse(null);
    if (group == null) {
      ArrayList<CharAndDiff> newGroup = new ArrayList<>();
      newGroup.add(charAndDiff);
      wholeList.add(newGroup);
    } else {
      group.add(charAndDiff);
    }
  }

  public static SnapshotDiff calculateDiff(Snapshot oldChars, Snapshot newChars, String bracket, boolean newIsZero) {
    if ((oldChars != null && newChars != null) && oldChars.timestamp() > newChars.timestamp()) {
      Snapshot temp = oldChars;
      oldChars = newChars;
      newChars = temp;
    }
    ArrayList<CharAndDiff> res = new ArrayList<>(newChars.characters().size());
    Function<Character, String> idF = getIdFunction(bracket);
    Map<String, Character> oldMap;
    if (oldChars == null) {
      oldMap = new HashMap<>();
    } else {
      oldMap = oldChars.characters().stream().collect(Collectors.toMap(idF, c -> c, (a, b) -> a));
    }
    for (Character newChar : newChars.characters()) {
      Character oldChar = oldMap.get(idF.apply(newChar));
      CharAndDiff e;
      if (oldChar == null) {
        if (newIsZero) {
          e = new CharAndDiff(newChar, new Diff(0L, 0L, 0L, 0L, newChars.timestamp()));
        } else {
          e = new CharAndDiff(newChar,
            new Diff(newChar.wins(), newChar.losses(), newChar.rating(), newChar.pos(), newChars.timestamp()));
        }
      } else {
        e = new CharAndDiff(newChar, new Diff(newChar.wins() - oldChar.wins(), newChar.losses() - oldChar.losses(),
          newChar.rating() - oldChar.rating(), newChar.pos() - oldChar.pos(), newChars.timestamp()));
        if (e.diff().won() < 0 || e.diff().lost() < 0) {
          log.debug("Negative diff: " + e);
          e = new CharAndDiff(e.character(), new Diff(e.diff().won(), e.diff().lost(), e.diff().ratingDiff(),
            e.diff().rankDiff(), e.diff().timestamp()));
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
    List<CharAndDiff> resList = res.values()
      .stream()
      .sorted(Comparator.comparing((CharAndDiff o) -> o.character().rating()).reversed())
      .toList();
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
    List<CharAndDiff> totalSortedRoleList = snapshot.chars()
      .stream()
      .filter((CharAndDiff character) -> acceptedSpecs.contains(character.character().fullSpec()))
      .sorted(Comparator.comparing((CharAndDiff o) -> o.character().rating()).reversed())
      .toList();
    if (bracket.equals("shuffle") || bracket.equals("blitz")) {
      int maxMinRating = totalSortedRoleList.stream()
        .collect(Collectors.groupingBy(character -> character.character().fullSpec(), Collectors.toList()))
        .entrySet()
        .stream()
        .collect(Collectors.toMap(Map.Entry::getKey,
          entry -> entry.getValue().stream().mapToLong(c -> c.character().rating()).min().orElse(0)))
        .values()
        .stream()
        .mapToInt(Long::intValue)
        .max()
        .orElse(0);
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
    List<Spec> specs = diviedLists.stream()
      .flatMap(List::stream)
      .collect(Collectors.groupingBy(Spec::specName, Collectors.toList()))
      .entrySet()
      .stream()
      .map(entry -> {
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
      })
      .toList();
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

  public static byte[] gzipCompress(byte[] uncompressedData) {
    byte[] result = new byte[] {};
    try (ByteArrayOutputStream bos = new ByteArrayOutputStream(uncompressedData.length);
      GZIPOutputStream gzipOS = new GZIPOutputStream(bos)) {
      gzipOS.write(uncompressedData);
      // You need to close it before using bos
      gzipOS.close();
      result = bos.toByteArray();
    } catch (IOException e) {
      e.printStackTrace();
    }
    return result;
  }

  public static byte[] gzipUncompress(byte[] compressedData) {
    if (compressedData == null) {
      return null;
    }
    byte[] result = new byte[] {};
    try (ByteArrayInputStream bis = new ByteArrayInputStream(compressedData);
      ByteArrayOutputStream bos = new ByteArrayOutputStream();
      GZIPInputStream gzipIS = new GZIPInputStream(bis)) {
      byte[] buffer = new byte[1024];
      int len;
      while ((len = gzipIS.read(buffer)) != -1) {
        bos.write(buffer, 0, len);
      }
      result = bos.toByteArray();
    } catch (IOException e) {
      e.printStackTrace();
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
