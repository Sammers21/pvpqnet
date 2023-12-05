package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public record Realms(Map<Integer, Realm> idToRealm) implements JsonConvertable {

    private static final Map<String, Realm> realmBySlug = new HashMap<>();
    private static final Map<String, Realm> slugToRealm = new HashMap<>();

    public Realms {
        idToRealm.values().forEach(realm -> realmBySlug.put(realm.slug(), realm));
        idToRealm.values().forEach(realm -> slugToRealm.put(realm.name(), realm));
    }

    public Realms merge(Realms realms) {
        Map<Integer, Realm> map = new HashMap<>(idToRealm);
        map.putAll(realms.idToRealm);
        return new Realms(map);
    }

    public Realm realmById(int id) {
        return idToRealm.get(id);
    }

    public Realm realmBySlug(String name) {
        return realmBySlug.get(name);
    }

    public static Realms fromBlizzardJson(String realRegion, JsonObject index, List<JsonObject> values) {
        Map<Integer, Realm> map = new HashMap<>();
        values.stream().flatMap(json -> json.getJsonArray("realms").stream())
            .map(JsonObject.class::cast)
            .forEach(json -> {
                Realm realm = Realm.fromBlizzardJson(json);
                map.put(realm.id(), realm);
            });
        return new Realms(map);
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("realms", idToRealm.values().stream().map(Realm::toJson).toList());
    }

    public static Realms fromJson(List<JsonObject> json) {
        Map<Integer, Realm> map = new HashMap<>();
        json.forEach(jsonObj -> {
            Realm realm = Realm.fromJson(jsonObj);
            map.put(realm.id(), realm);
        });
        return new Realms(map);
    }

    public String slugToName(String slug) {
        Realm realm = realmBySlug.get(slug.toLowerCase());
        if (realm == null) {
            return slug;
        }
        return realm.name();
    }

    public String nameToSlug(String name) {
        Realm realm = slugToRealm.get(name);
        if (realm == null) {
            return name;
        }
        return realm.slug();
    }
}
