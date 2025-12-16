package io.github.sammers.pla.db;

/**
 * Extended Character record for multiclasser calculations. Composes a Character
 * with posUniq - the rank of that character on the leaderboard if we don't
 * count alts (only unique players).
 *
 * @param character
 *          The original Character
 * @param posUniq
 *          The unique position (rank without alts)
 */
public record CharacterMLExt(Character character, Long posUniq) {
  /**
   * Delegate methods to underlying Character for convenience
   */
  public Long pos() {
    return character.pos();
  }

  public Long rating() {
    return character.rating();
  }

  public boolean inCutoff() {
    return character.inCutoff();
  }

  public String name() {
    return character.name();
  }

  public String clazz() {
    return character.clazz();
  }

  public String fullSpec() {
    return character.fullSpec();
  }

  public String fraction() {
    return character.fraction();
  }

  public String gender() {
    return character.gender();
  }

  public String race() {
    return character.race();
  }

  public String realm() {
    return character.realm();
  }

  public Long wins() {
    return character.wins();
  }

  public Long losses() {
    return character.losses();
  }

  public String fullName() {
    return character.fullName();
  }

  public String fullNameWSpec() {
    return character.fullNameWSpec();
  }

  public String fullNameWClass() {
    return character.fullNameWClass();
  }

  public boolean isHealerSpec() {
    return character.isHealerSpec();
  }

  public boolean isTankSpec() {
    return character.isTankSpec();
  }

  public boolean isDpsSpec() {
    return character.isDpsSpec();
  }
}
