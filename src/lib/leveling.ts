export const getLevel = (xp: number) => {
  if (xp < 0) return 1;
  // Progressive leveling: Each level takes more XP
  // Level = sqrt(xp / 450) + 1
  return Math.floor(Math.sqrt(Math.max(0, xp) / 450)) + 1;
};

export const getLevelProgress = (xp: number) => {
  const currentLevel = getLevel(xp);
  const nextLevelXp = Math.pow(currentLevel, 2) * 450;
  const prevLevelXp = Math.pow(currentLevel - 1, 2) * 450;
  
  const xpInLevel = xp - prevLevelXp;
  const xpNeeded = nextLevelXp - prevLevelXp;
  
  return Math.min(100, Math.max(0, (xpInLevel / xpNeeded) * 100));
};
