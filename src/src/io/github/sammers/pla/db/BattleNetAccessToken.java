package io.github.sammers.pla.db;

import io.vertx.core.json.JsonObject;
import java.time.Instant;

public record BattleNetAccessToken(String accessToken, Instant issuedAt, Instant expiresAt) {
  public boolean isExpired() {
    return Instant.now().isAfter(expiresAt);
  }

  public JsonObject toJson() {
    return new JsonObject().put("access_token", accessToken)
      .put("issued_at", issuedAt.toEpochMilli())
      .put("expires_at", expiresAt.toEpochMilli());
  }

  public static BattleNetAccessToken fromJson(JsonObject json) {
    return new BattleNetAccessToken(json.getString("access_token"), Instant.ofEpochMilli(json.getLong("issued_at")),
      Instant.ofEpochMilli(json.getLong("expires_at")));
  }
}
