package io.github.sammers.pla;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class Calculator {

    public static List<CharAndDiff> calculateDiff(List<Character> oldChars, List<Character> newChars) {
        ArrayList<CharAndDiff> res = new ArrayList<>(newChars.size());
        Map<String, Character> oldMap = oldChars.stream().collect(Collectors.toMap(Character::fullName, c -> c));
        for (Character newChar : newChars) {
            Character oldChar = oldMap.get(newChar.fullName());
            CharAndDiff e;
            if (oldChar == null) {
                e = new CharAndDiff(newChar, new Diff(newChar.wins(), newChar.losses(), newChar.rating()));
            } else {
                e = new CharAndDiff(newChar, new Diff(newChar.wins() - oldChar.wins(), newChar.losses() - oldChar.losses(), newChar.rating() - oldChar.rating()));
            }
            if(e.diff().lost() == 0 && e.diff().won() == 0 && e.diff().ratingDiff() == 0) {
                continue;
            } else {
                res.add(e);
            }
        }
        return res;
    }
}
