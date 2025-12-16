package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.List;
import java.util.Optional;

/**
 * Represents a PvP talent from the WoW API specializations endpoint. PvP
 * talents are included in the specializations response under each spec's
 * pvp_talent_slots.
 *
 * Example structure: { "pvp_talent_slots": [ { "selected": { "talent": { "id":
 * 12345, "key": { "href": "..." }, "name": "Precognition" }, "spell_tooltip": {
 * "spell": { "id": 377360 }, "description": "...", "cast_time": "Passive" } },
 * "slot_number": 1 } ] }
 */
public record PvpTalent(long talentId, String name, long spellId, String description, String castTime,
  int slotNumber) implements JsonConvertable {
  public static PvpTalent parse(JsonObject pvpTalentSlot) {
    JsonObject selected = pvpTalentSlot.getJsonObject("selected");
    if (selected == null) {
      return null;
    }
    JsonObject talent = selected.getJsonObject("talent");
    JsonObject spellTooltip = selected.getJsonObject("spell_tooltip");
    long talentId = Optional.ofNullable(talent).map(t -> t.getLong("id", 0L)).orElse(0L);
    String name = Optional.ofNullable(talent).map(t -> t.getString("name", "")).orElse("");
    long spellId = Optional.ofNullable(spellTooltip)
      .flatMap(st -> Optional.ofNullable(st.getJsonObject("spell")))
      .map(s -> s.getLong("id", 0L))
      .orElse(0L);
    String description = Optional.ofNullable(spellTooltip).map(st -> st.getString("description", "")).orElse("");
    String castTime = Optional.ofNullable(spellTooltip).map(st -> st.getString("cast_time", "")).orElse("");
    int slotNumber = pvpTalentSlot.getInteger("slot_number", 0);
    return new PvpTalent(talentId, name, spellId, description, castTime, slotNumber);
  }

  public static PvpTalent fromJson(JsonObject json) {
    return new PvpTalent(json.getLong("talentId", 0L), json.getString("name", ""), json.getLong("spellId", 0L),
      json.getString("description", ""), json.getString("castTime", ""), json.getInteger("slotNumber", 0));
  }

  @Override
  public JsonObject toJson() {
    return new JsonObject().put("talentId", talentId)
      .put("name", name)
      .put("spellId", spellId)
      .put("description", description)
      .put("castTime", castTime)
      .put("slotNumber", slotNumber);
  }

  /**
   * Generate Wowhead spell link for this PvP talent.
   */
  public String wowheadLink() {
    return "https://www.wowhead.com/spell=" + spellId;
  }

  /**
   * Parse PvP talents from the specializations API response for the active spec.
   */
  public static List<PvpTalent> parseFromSpecs(JsonObject specsResponse, String activeSpec) {
    JsonArray specializations = specsResponse.getJsonArray("specializations");
    if (specializations == null) {
      return List.of();
    }
    return specializations.stream().map(s -> (JsonObject) s).filter(s -> {
      JsonObject spec = s.getJsonObject("specialization");
      return spec != null && activeSpec.equals(spec.getString("name"));
    }).findFirst().map(specObj -> {
      JsonArray pvpTalentSlots = specObj.getJsonArray("pvp_talent_slots");
      if (pvpTalentSlots == null) {
        return List.<PvpTalent> of();
      }
      return pvpTalentSlots.stream()
        .map(slot -> PvpTalent.parse((JsonObject) slot))
        .filter(pvpTalent -> pvpTalent != null)
        .toList();
    }).orElse(List.of());
  }
}
