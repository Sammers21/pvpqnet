package io.github.sammers.pla.db;

import io.vertx.core.json.JsonObject;
import java.time.Instant;

public record PvPQNetSession(String sessionId, Instant issuedAt, Instant expiresAt) {
  public boolean isExpired() {
    return Instant.now().isAfter(expiresAt);
  }

  public JsonObject toJson() {
    return new JsonObject().put("session_id", sessionId)
      .put("issued_at", issuedAt.toEpochMilli())
      .put("expires_at", expiresAt.toEpochMilli());
  }

  public static PvPQNetSession fromJson(JsonObject json) {
    return new PvPQNetSession(json.getString("session_id"), Instant.ofEpochMilli(json.getLong("issued_at")),
      Instant.ofEpochMilli(json.getLong("expires_at")));
  }
}
