package io.github.sammers.pla;


import io.vertx.core.json.JsonObject;

import java.time.Instant;
import java.time.ZonedDateTime;

import static java.time.ZoneOffset.UTC;

/**
 * Blizzard auth token.
 * @param accessToken
 * @param tokenType
 * @param expiresIn
 * @param scope
 */
public record BlizzardAuthToken(String accessToken, String tokenType, int expiresIn, String scope, ZonedDateTime expiresAt) {
    public static BlizzardAuthToken fromJson(JsonObject json) {
        Instant now = Instant.now();
        Integer expires = json.getInteger("expires_in");
        return new BlizzardAuthToken(
            json.getString("access_token"),
            json.getString("token_type"),
            expires,
            json.getString("scope"),
            now.plusSeconds(expires).atZone(UTC)
        );
    }

    public boolean isExpired() {
        return ZonedDateTime.now(UTC).isAfter(expiresAt);
    }

    public boolean stillValid() {
        return !isExpired();
    }
}
