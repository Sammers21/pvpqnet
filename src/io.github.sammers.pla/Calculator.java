package io.github.sammers.pla;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public class Calculator {

    public static SnapshotDiff calculateDiff(Snapshot oldChars, Snapshot newChars, String bracket) {
        ArrayList<CharAndDiff> res = new ArrayList<>(newChars.characters().size());
        Function<Character, String> idF = getIdFunction(bracket);
        Map<String, Character> oldMap = oldChars.characters().stream().collect(Collectors.toMap(idF, c -> c, (a, b) -> a));
        for (Character newChar : newChars.characters()) {
            Character oldChar = oldMap.get(idF.apply(newChar));
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
        if(bracket.equals("shuffle")) {
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
