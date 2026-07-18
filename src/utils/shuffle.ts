/**
 * Fisher-Yates Shuffle algorithm
 * Returns a NEW shuffled array without mutating the original array.
 */
export function shuffleArray<T>(array: T[]): T[] {
  if (!array) return [];
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}
