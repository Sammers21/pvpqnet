package io.github.sammers.pla.blizzard;

import io.vertx.core.json.JsonObject;
import java.time.Instant;
import java.time.ZonedDateTime;
import static java.time.ZoneOffset.UTC;

public record BlizzardTokenResponse(String accessToken, String tokenType, Integer expiresIn, String scope, String sub,
  String idToken, String refreshToken, ZonedDateTime expiresAt) {
  public static BlizzardTokenResponse parse(JsonObject json) {
    Integer expiresIn = json.getInteger("expires_in");
    ZonedDateTime expiresAt = null;
    if (expiresIn != null) {
      expiresAt = Instant.now().plusSeconds(expiresIn).atZone(UTC);
    }
    return new BlizzardTokenResponse(json.getString("access_token"), json.getString("token_type"), expiresIn,
      json.getString("scope"), json.getString("sub"), json.getString("id_token"), json.getString("refresh_token"),
      expiresAt);
  }
}
