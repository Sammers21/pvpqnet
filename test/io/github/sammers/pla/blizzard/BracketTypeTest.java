package io.github.sammers.pla.blizzard;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

public class BracketTypeTest {

    @Test
    public void testGetBracketType() {
        assertEquals(BracketType.fromType("2v2"), BracketType.TWO_V_TWO);
        assertEquals(BracketType.fromType("ARENA_2v2"), BracketType.TWO_V_TWO);
        assertEquals(BracketType.fromType("3v3"), BracketType.THREE_V_THREE);
        assertEquals(BracketType.fromType("ARENA_3v3"), BracketType.THREE_V_THREE);
        assertEquals(BracketType.fromType("BATTLEGROUNDS"), BracketType.RBG);
        assertEquals(BracketType.fromType("RBG"), BracketType.RBG);
        assertEquals(BracketType.fromType("rbg"), BracketType.RBG);
        assertEquals(BracketType.fromType("SHUFFLE"), BracketType.SHUFFLE);
        assertEquals(BracketType.fromType("shuffle"), BracketType.SHUFFLE);
        assertEquals(BracketType.fromType("SHUFFLE-Arms"), BracketType.SHUFFLE);
    }
}