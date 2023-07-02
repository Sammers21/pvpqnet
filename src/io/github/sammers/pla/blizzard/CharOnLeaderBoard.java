package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.db.Character;

public record CharOnLeaderBoard(String name, String realm, long rank, long rating, long won, long lost) {

    public String fullName() {
        return Character.fullNameByRealmAndName(name, realm);
    }
}
