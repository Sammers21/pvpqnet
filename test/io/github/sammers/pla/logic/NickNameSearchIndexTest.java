package io.github.sammers.pla.logic;

import io.github.sammers.pla.db.Character;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class NickNameSearchIndexTest {

    @Test
    public void basic() {
        NickNameSearchIndex nickNameSearchIndex = new NickNameSearchIndex();
        nickNameSearchIndex.insertNickNames(new SearchResult(Character.fullNameByRealmAndName("Whitemask", "Kazzak"), "eu", "Priest"));
        Assertions.assertEquals(1, nickNameSearchIndex.searchNickNames("whitemask").size());
    }

    @Test
    public void realm() {
        NickNameSearchIndex nickNameSearchIndex = new NickNameSearchIndex();
        nickNameSearchIndex.insertNickNames(new SearchResult(Character.fullNameByRealmAndName("Whitemask", "Kazzak"), "eu", "Priest"));
        Assertions.assertEquals(1, nickNameSearchIndex.searchNickNames("whitemask-k").size());
    }

    @Test
    public void godx() {
        NickNameSearchIndex nickNameSearchIndex = new NickNameSearchIndex();
        nickNameSearchIndex.insertNickNames(new SearchResult(Character.fullNameByRealmAndName("Ømegagødx", "Outland"), "eu", "Priest"));
        Assertions.assertEquals(1, nickNameSearchIndex.searchNickNames("omegago").size());
    }

    @Test
    public void easygodx() {
        NickNameSearchIndex nickNameSearchIndex = new NickNameSearchIndex();
        nickNameSearchIndex.insertNickNames(new SearchResult(Character.fullNameByRealmAndName("Ømegagødx", "Outland"), "eu", "Priest"));
        Assertions.assertEquals(1, nickNameSearchIndex.searchNickNames("ømegagødx").size());
    }
}
