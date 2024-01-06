package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.Multiclassers;
import io.github.sammers.pla.db.Snapshot;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

import static io.github.sammers.pla.logic.Conts.SHUFFLE;

public class Refs {
    private final Map<String, AtomicReference<Snapshot>> refs;
    private final Map<String, AtomicReference<SnapshotDiff>> refDiffs;
    private final Map<String, AtomicReference<Multiclassers>> multiclassers;

    public Refs() {
        this.refs = new ConcurrentHashMap<>();
        this.refDiffs = new ConcurrentHashMap<>();
        this.multiclassers = new ConcurrentHashMap<>();
    }

    public Snapshot snapshotByBracketType(String btype, String region) {
        if (btype.startsWith("SHUFFLE")) {
            return refByBracket(SHUFFLE, region).get();
        } else if (btype.equals("ARENA_2v2")) {
            return refByBracket(Conts.TWO_V_TWO, region).get();
        } else if (btype.equals("ARENA_3v3")) {
            return refByBracket(Conts.THREE_V_THREE, region).get();
        } else if (btype.equals("BATTLEGROUNDS")) {
            return refByBracket(Conts.RBG, region).get();
        }
        return refByBracket(btype, region).get();
    }

    public AtomicReference<Multiclassers> refMulticlassers(Multiclassers.Role role, String region) {
        return multiclassers.compute(bucketRef(role.role, region), (k, v) -> {
            if (v == null) {
                return new AtomicReference<>();
            } else {
                return v;
            }
        });
    }

    public AtomicReference<Snapshot> refByBracket(String bracket, String region) {
        return refs.compute(bucketRef(bracket, region), (k, v) -> {
            if (v == null) {
                return new AtomicReference<>();
            } else {
                return v;
            }
        });
    }

    public AtomicReference<SnapshotDiff> diffsByBracket(String bracket, String region) {
        return refDiffs.compute(bucketRef(bracket, region), (k, v) -> {
            if (v == null) {
                return new AtomicReference<>();
            } else {
                return v;
            }
        });
    }

    public static String bucketRef(String bracket, String region) {
        return bracket + "_" + region;
    }


}
