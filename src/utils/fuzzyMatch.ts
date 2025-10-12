/**
 * Fuzzy matching utilities (Levenshtein distance and similarity)
 */

export function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = Array.from({ length: an + 1 }, () => new Array(bn + 1).fill(0));

  for (let i = 0; i <= an; i++) matrix[i][0] = i;
  for (let j = 0; j <= bn; j++) matrix[0][j] = j;

  for (let i = 1; i <= an; i++) {
    const ca = a.charAt(i - 1);
    for (let j = 1; j <= bn; j++) {
      const cb = b.charAt(j - 1);
      const cost = ca === cb ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[an][bn];
}

export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length) || 1;
  const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
  return 1 - dist / maxLen; // 0..1
}
