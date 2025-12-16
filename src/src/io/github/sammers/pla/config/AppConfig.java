package io.github.sammers.pla.config;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;

public record AppConfig(String dbUri, String clientId, String clientSecret, String indexerClientId,
  String indexerClientSecret, String callback) {
  public record Loaded(Path path, AppConfig config) {
  }

  public static AppConfig load(String[] args) throws IOException {
    return loadWithSource(args).config();
  }

  public static Loaded loadWithSource(String[] args) throws IOException {
    Path configPath = resolveConfigPath(args);
    String yaml = Files.readString(configPath, StandardCharsets.UTF_8);
    return new Loaded(configPath, fromYaml(yaml, configPath.toString()));
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  record ConfigFile(DbConfig db, @JsonAlias("battle_net") BattleNetConfig battlenet, AuthConfig auth) {
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  record DbConfig(String uri) {
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  record AuthConfig(String callback) {
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  record BattleNetConfig(BattleNetCredentials api, BattleNetCredentials indexer) {
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  record BattleNetCredentials(@JsonProperty("client_id") @JsonAlias("clientId") String clientId,
    @JsonProperty("client_secret") @JsonAlias("clientSecret") String clientSecret) {
  }

  static AppConfig fromYaml(String yaml, String sourceName) throws IOException {
    ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
    mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    ConfigFile config = mapper.readValue(yaml, ConfigFile.class);
    if (config == null) {
      throw new IllegalArgumentException("Empty config in " + sourceName);
    }
    DbConfig db = requireNonNull(sourceName, "db", config.db());
    String dbUri = requiredNonBlank(sourceName, "db.uri", db.uri());
    BattleNetConfig battlenet = requireNonNull(sourceName, "battlenet", config.battlenet());
    BattleNetCredentials api = requireNonNull(sourceName, "battlenet.api", battlenet.api());
    String clientId = requiredNonBlank(sourceName, "battlenet.api.client_id", api.clientId());
    String clientSecret = requiredNonBlank(sourceName, "battlenet.api.client_secret", api.clientSecret());
    BattleNetCredentials indexer = battlenet.indexer();
    String indexerClientId = firstNonBlank(indexer != null ? indexer.clientId() : null, clientId);
    String indexerClientSecret = firstNonBlank(indexer != null ? indexer.clientSecret() : null, clientSecret);
    AuthConfig auth = requireNonNull(sourceName, "auth", config.auth());
    String callback = requiredNonBlank(sourceName, "auth.callback", auth.callback());
    return new AppConfig(dbUri, clientId, clientSecret, indexerClientId, indexerClientSecret, callback);
  }

  public String toSafeLogString() {
    return "AppConfig{dbUri=" + redactDbUri(dbUri) + ", clientId=" + clientId + ", clientSecret="
      + redactSecret(clientSecret) + ", indexerClientId=" + indexerClientId + ", indexerClientSecret="
      + redactSecret(indexerClientSecret) + ", callback=" + callback + "}";
  }

  @Override
  public String toString() {
    return toSafeLogString();
  }

  private static String redactSecret(String secret) {
    if (secret == null || secret.isBlank()) {
      return "<missing>";
    }
    return "*** (len=" + secret.length() + ")";
  }

  private static String redactDbUri(String uri) {
    if (uri == null || uri.isBlank()) {
      return "<missing>";
    }
    int schemeSep = uri.indexOf("://");
    if (schemeSep < 0) {
      return "<redacted>";
    }
    int credsStart = schemeSep + "://".length();
    int at = uri.indexOf('@', credsStart);
    if (at < 0) {
      return uri;
    }
    String userInfo = uri.substring(credsStart, at);
    if (userInfo.isBlank()) {
      return uri.substring(0, credsStart) + "***@" + uri.substring(at + 1);
    }
    int colon = userInfo.indexOf(':');
    String user = colon >= 0 ? userInfo.substring(0, colon) : userInfo;
    String redactedUserInfo = user.isBlank() ? "***" : user + ":***";
    return uri.substring(0, credsStart) + redactedUserInfo + "@" + uri.substring(at + 1);
  }

  private static String requiredNonBlank(String sourceName, String key, String value) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException("Missing required config key " + key + " in " + sourceName);
    }
    return value;
  }

  private static <T> T requireNonNull(String sourceName, String key, T value) {
    if (value == null) {
      throw new IllegalArgumentException("Missing required config section " + key + " in " + sourceName);
    }
    return value;
  }

  private static String firstNonBlank(String... values) {
    for (String value : values) {
      if (value != null && !value.isBlank()) {
        return value;
      }
    }
    return null;
  }

  static Path resolveConfigPath(String[] args) {
    Objects.requireNonNull(args, "args");
    for (int i = 0; i < args.length; i++) {
      String arg = args[i];
      if (arg == null) {
        continue;
      }
      if (arg.equals("--config") || arg.equals("-c")) {
        if (i + 1 >= args.length || args[i + 1] == null || args[i + 1].isBlank()) {
          throw new IllegalArgumentException("Missing value for " + arg);
        }
        return Paths.get(args[i + 1]);
      }
      if (arg.startsWith("--config=")) {
        String value = arg.substring("--config=".length());
        if (value.isBlank()) {
          throw new IllegalArgumentException("Missing value for --config");
        }
        return Paths.get(value);
      }
    }
    throw new IllegalArgumentException("Missing required argument: --config <path>");
  }
}
