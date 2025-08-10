// Helper functions for game mechanics
export const uid = () => Math.random().toString(36).slice(2, 9);
export const nowISO = () => new Date().toISOString();

// XP -> level function (simple exponential)
export function xpForNextLevel(level: number) {
  return 100 + (level - 1) * 75;
}

// Calculate level from XP
export function calculateLevel(currentXP: number, currentLevel: number) {
  let newXP = currentXP;
  let newLevel = currentLevel;
  
  while (newXP >= xpForNextLevel(newLevel)) {
    newXP -= xpForNextLevel(newLevel);
    newLevel += 1;
  }
  
  return { level: newLevel, xp: newXP };
}