package io.github.sammers.pla;

import java.util.ArrayList;
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
                e = new CharAndDiff(newChar, new Diff(newChar.wins(), newChar.losses(), newChar.rating(), 0L));
            } else {
                e = new CharAndDiff(newChar, new Diff(newChar.wins() - oldChar.wins(), newChar.losses() - oldChar.losses(), newChar.rating() - oldChar.rating(), newChar.pos() - oldChar.pos()));
            }
            if(e.diff().lost() == 0 && e.diff().won() == 0 && e.diff().ratingDiff() == 0) {
                continue;
            } else {
                res.add(e);
            }
        }
        return new SnapshotDiff(res, newChars.timestamp());
    }
}
