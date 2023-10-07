function getSeasonTitle(achievement: string): { title: string; name: string } {
  console.log('achievement :>> ', achievement);
  return {
    title: achievement.split(':')[0],
    name: `Season ${parseInt(achievement.slice(-1), 10)}`,
  };
}

function getSeasonTitleDescription(title: string, seasonName: string): string {
  const expansions = ['Dragonflight', 'Battle for Azeroth', 'Shadowlands'];
  const afterDraenor = expansions.some((e) => seasonName.includes(e));

  if (!afterDraenor) {
    if (title.includes('Gladiator')) {
      return 'End PvP Season in the top 0.5% of the 3v3 arena ladder.';
    }
    if (title.includes('Elite')) {
      return 'End PvP Season in the top 0.5% of the 3v3 arena ladder.';
    }
    if (title.includes('Duelist')) {
      return 'End PvP Season in the top 3% of the 3v3 arena ladder.';
    }
    if (title.includes('Rival')) {
      return 'End PvP Season in the top 10% of the 3v3 arena ladder.';
    }
    if (title.includes('Challenger')) {
      return 'End PvP Season in the top 35% of the 3v3 arena ladder.';
    }
  }

  if (title === 'Gladiator') {
    return 'Win 50 games with more than 2400 arena rating during the PvP Season.';
  }
  if (title === 'Legend') {
    return 'Win 100 Rated Solo Shuffle rounds while at Elite rank during the PvP Season.';
  }
  if (title.includes('Gladiator')) {
    return 'End PvP Season in the top 0.1% of the 3v3 arena ladder.';
  }
  if (title.includes('Legend')) {
    return 'End PvP Season in the top 0.1% of the Solo Shuffle ladder.';
  }
  if (title.includes('Elite')) {
    return 'Earn 2400 rating during the PvP Season.';
  }
  if (title.includes('Duelist')) {
    return 'Earn between 2100 and 2399 rating during the PvP Season.';
  }
  if (title.includes('Rival')) {
    return 'Earn between 1800 and 2099 rating during the PvP Season.';
  }
  if (title.includes('Challenger')) {
    return 'Earn between 1600 and 1799 rating during the PvP season.';
  }
  return '';
}

export { getSeasonTitle, getSeasonTitleDescription };
