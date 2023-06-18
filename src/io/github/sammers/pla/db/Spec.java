package io.github.sammers.pla.db;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

public record Spec(String specName,
                   double p001WinRate,
                   double p001Presence,
                   double p01WinRate,
                   double p01Presence,
                   double p10WinRate,
                   double p10Presence,
                   double p35WinRate,
                   double p35Presence,
                   double p50WinRate,
                   double p50Presence,
                   double p100WinRate,
                   double p100Presence) implements JsonConvertable {
    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("spec_name", specName)
            .put("p001_win_rate", p001WinRate)
            .put("p001_presence", p001Presence)
            .put("p01_win_rate", p01WinRate)
            .put("p01_presence", p01Presence)
            .put("p10_win_rate", p10WinRate)
            .put("p10_presence", p10Presence)
            .put("p35_win_rate", p35WinRate)
            .put("p35_presence", p35Presence)
            .put("p50_win_rate", p50WinRate)
            .put("p50_presence", p50Presence)
            .put("p100_win_rate", p100WinRate)
            .put("p100_presence", p100Presence);
    }
}
