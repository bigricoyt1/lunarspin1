export function fmtMoney(n: number): string {
  n = Math.round(n);
  if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export function parseBet(s: string): number {
  if (!s) return 0;
  s = String(s).trim().toUpperCase();
  let m = 1;
  if (s.endsWith('K')) { m = 1e3; s = s.slice(0, -1); }
  else if (s.endsWith('M')) { m = 1e6; s = s.slice(0, -1); }
  else if (s.endsWith('B')) { m = 1e9; s = s.slice(0, -1); }
  else if (s.endsWith('T')) { m = 1e12; s = s.slice(0, -1); }
  return Math.floor(parseFloat(s) * m) || 0;
}

export function getGameResult(defaultChance: number, userRigRate: number | null | undefined): boolean {
  // Use userRigRate if it exists, otherwise use global difficulty (passed as defaultChance or managed here)
  const targetChance = (userRigRate !== null && userRigRate !== undefined) ? userRigRate : defaultChance;
  return (Math.random() * 100) < targetChance;
}
