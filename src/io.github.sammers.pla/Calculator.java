package io.github.sammers.pla;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class Calculator {

    public static SnapshotDiff calculateDiff(Snapshot oldChars, Snapshot newChars) {
        ArrayList<CharAndDiff> res = new ArrayList<>(newChars.characters().size());
        Map<String, Character> oldMap = oldChars.characters().stream().collect(Collectors.toMap(Character::fullName, c -> c, (a, b) -> a));
        for (Character newChar : newChars.characters()) {
            Character oldChar = oldMap.get(newChar.fullName());
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

    public static SnapshotDiff combine(SnapshotDiff older, SnapshotDiff newver) {
        Map<String, CharAndDiff> res = newver.chars().stream().collect(Collectors.toMap(c -> c.character().fullName(), c -> c, (a, b) -> a));
        for (CharAndDiff oldChar : older.chars()) {
            res.putIfAbsent(oldChar.character().fullName(), oldChar);
        }
        List<CharAndDiff> resList = res.values().stream().sorted(Comparator.comparing((CharAndDiff o) -> o.character().rating()).reversed()).collect(Collectors.toList());
        return new SnapshotDiff(new ArrayList<>(resList), newver.timestamp());
    }
}
