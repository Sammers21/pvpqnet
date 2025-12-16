package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.List;
import java.util.Optional;

/**
 * Represents an equipped item from the WoW API equipment endpoint. Example
 * response structure from Blizzard API: { "slot": { "type": "HEAD", "name":
 * "Head" }, "item": { "id": 212075 }, "quality": { "type": "EPIC", "name":
 * "Epic" }, "name": "Fathomdweller's Casque", "level": { "value": 639 },
 * "sockets": [{ "socket_type": { "type": "PRISMATIC" }, "item": { "id": 213743
 * } }], "enchantments": [{ "enchantment_id": 7355, "display_string": "..." }],
 * "bonus_list": [1540, 10299, 10876, ...], "set": { "item_set": { "id": 1681 },
 * "display_string": "..." } }
 */
public record EquippedItem(long itemId, String slot, String name, String quality, int itemLevel, List<Long> bonusList,
  List<Enchantment> enchantments, List<Socket> sockets, SetInfo setInfo, List<Stat> stats) implements JsonConvertable {
  public record Stat(String type, int value) implements JsonConvertable {
    public static Stat parse(JsonObject json) {
      String type = Optional.ofNullable(json.getJsonObject("type")).map(t -> t.getString("type", "")).orElse("");
      int value = json.getInteger("value", 0);
      return new Stat(type, value);
    }

    public static Stat fromJson(JsonObject json) {
      return new Stat(json.getString("type", ""), json.getInteger("value", 0));
    }

    @Override
    public JsonObject toJson() {
      return new JsonObject().put("type", type).put("value", value);
    }
  }

  public record Enchantment(long enchantmentId, String displayString) implements JsonConvertable {
    public static Enchantment parse(JsonObject json) {
      return new Enchantment(json.getLong("enchantment_id", 0L), json.getString("display_string", ""));
    }

    public static Enchantment fromJson(JsonObject json) {
      return new Enchantment(json.getLong("enchantmentId", 0L), json.getString("displayString", ""));
    }

    @Override
    public JsonObject toJson() {
      return new JsonObject().put("enchantmentId", enchantmentId).put("displayString", displayString);
    }
  }

  public record Socket(String socketType, Long gemId) implements JsonConvertable {
    public static Socket parse(JsonObject json) {
      String type = Optional.ofNullable(json.getJsonObject("socket_type"))
        .map(st -> st.getString("type", "PRISMATIC"))
        .orElse("PRISMATIC");
      Long gem = Optional.ofNullable(json.getJsonObject("item")).map(item -> item.getLong("id")).orElse(null);
      return new Socket(type, gem);
    }

    public static Socket fromJson(JsonObject json) {
      return new Socket(json.getString("socketType", "PRISMATIC"), json.getLong("gemId"));
    }

    @Override
    public JsonObject toJson() {
      return new JsonObject().put("socketType", socketType).put("gemId", gemId);
    }
  }

  public record SetInfo(long setId, String displayString, int equippedCount) implements JsonConvertable {
    public static SetInfo parse(JsonObject json) {
      long id = Optional.ofNullable(json.getJsonObject("item_set")).map(is -> is.getLong("id", 0L)).orElse(0L);
      String display = json.getString("display_string", "");
      int count = Optional.ofNullable(json.getJsonArray("items"))
        .map(items -> (int) items.stream()
          .map(i -> (JsonObject) i)
          .filter(i -> i.getBoolean("is_equipped", false))
          .count())
        .orElse(0);
      return new SetInfo(id, display, count);
    }

    public static SetInfo fromJson(JsonObject json) {
      if (json == null)
        return null;
      return new SetInfo(json.getLong("setId", 0L), json.getString("displayString", ""),
        json.getInteger("equippedCount", 0));
    }

    @Override
    public JsonObject toJson() {
      return new JsonObject().put("setId", setId)
        .put("displayString", displayString)
        .put("equippedCount", equippedCount);
    }
  }

  public static EquippedItem parse(JsonObject json) {
    long itemId = Optional.ofNullable(json.getJsonObject("item")).map(item -> item.getLong("id", 0L)).orElse(0L);
    String slot = Optional.ofNullable(json.getJsonObject("slot")).map(s -> s.getString("type", "")).orElse("");
    String name = json.getString("name", "");
    String quality = Optional.ofNullable(json.getJsonObject("quality"))
      .map(q -> q.getString("type", "COMMON"))
      .orElse("COMMON");
    int itemLevel = Optional.ofNullable(json.getJsonObject("level")).map(l -> l.getInteger("value", 0)).orElse(0);
    List<Long> bonusList = Optional.ofNullable(json.getJsonArray("bonus_list"))
      .map(arr -> arr.stream().map(b -> ((Number) b).longValue()).toList())
      .orElse(List.of());
    List<Enchantment> enchantments = Optional.ofNullable(json.getJsonArray("enchantments"))
      .map(arr -> arr.stream().map(e -> Enchantment.parse((JsonObject) e)).toList())
      .orElse(List.of());
    List<Socket> sockets = Optional.ofNullable(json.getJsonArray("sockets"))
      .map(arr -> arr.stream().map(s -> Socket.parse((JsonObject) s)).toList())
      .orElse(List.of());
    SetInfo setInfo = Optional.ofNullable(json.getJsonObject("set")).map(SetInfo::parse).orElse(null);
    List<Stat> stats = Optional.ofNullable(json.getJsonArray("stats"))
      .map(arr -> arr.stream().map(s -> Stat.parse((JsonObject) s)).toList())
      .orElse(List.of());
    return new EquippedItem(itemId, slot, name, quality, itemLevel, bonusList, enchantments, sockets, setInfo, stats);
  }

  public static EquippedItem fromJson(JsonObject json) {
    List<Long> bonusList = Optional.ofNullable(json.getJsonArray("bonusList"))
      .map(arr -> arr.stream().map(b -> ((Number) b).longValue()).toList())
      .orElse(List.of());
    List<Enchantment> enchantments = Optional.ofNullable(json.getJsonArray("enchantments"))
      .map(arr -> arr.stream().map(e -> Enchantment.fromJson((JsonObject) e)).toList())
      .orElse(List.of());
    List<Socket> sockets = Optional.ofNullable(json.getJsonArray("sockets"))
      .map(arr -> arr.stream().map(s -> Socket.fromJson((JsonObject) s)).toList())
      .orElse(List.of());
    SetInfo setInfo = SetInfo.fromJson(json.getJsonObject("setInfo"));
    List<Stat> stats = Optional.ofNullable(json.getJsonArray("stats"))
      .map(arr -> arr.stream().map(s -> Stat.fromJson((JsonObject) s)).toList())
      .orElse(List.of());
    return new EquippedItem(json.getLong("itemId", 0L), json.getString("slot", ""), json.getString("name", ""),
      json.getString("quality", "COMMON"), json.getInteger("itemLevel", 0), bonusList, enchantments, sockets, setInfo,
      stats);
  }

  @Override
  public JsonObject toJson() {
    JsonObject json = new JsonObject().put("itemId", itemId)
      .put("slot", slot)
      .put("name", name)
      .put("quality", quality)
      .put("itemLevel", itemLevel)
      .put("bonusList", new JsonArray(bonusList))
      .put("enchantments", new JsonArray(enchantments.stream().map(Enchantment::toJson).toList()))
      .put("sockets", new JsonArray(sockets.stream().map(Socket::toJson).toList()))
      .put("stats", new JsonArray(stats.stream().map(Stat::toJson).toList()));
    if (setInfo != null) {
      json.put("setInfo", setInfo.toJson());
    }
    return json;
  }

  /**
   * Generates a Wowhead link for this item with bonus IDs, gems, and enchants.
   */
  public String wowheadLink() {
    StringBuilder sb = new StringBuilder("https://www.wowhead.com/item=").append(itemId);
    if (!bonusList.isEmpty()) {
      sb.append("&bonus=").append(String.join(":", bonusList.stream().map(String::valueOf).toList()));
    }
    List<Long> gemIds = sockets.stream().map(Socket::gemId).filter(g -> g != null).toList();
    if (!gemIds.isEmpty()) {
      sb.append("&gems=").append(String.join(":", gemIds.stream().map(String::valueOf).toList()));
    }
    if (!enchantments.isEmpty()) {
      sb.append("&ench=").append(enchantments.get(0).enchantmentId());
    }
    return sb.toString();
  }

  /**
   * Parse a list of equipped items from the equipment API response.
   */
  public static List<EquippedItem> parseEquipment(JsonObject equipmentResponse) {
    JsonArray items = equipmentResponse.getJsonArray("equipped_items");
    if (items == null) {
      return List.of();
    }
    return items.stream().map(item -> EquippedItem.parse((JsonObject) item)).toList();
  }
}
