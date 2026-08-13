export type Rng = () => number;

/** PRNG determinístico (mulberry32) — mesma seed sempre gera a mesma sequência. */
export function createRng(seed: bigint | number): Rng {
  let a = Number(BigInt(seed) % 4294967296n) | 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Amostra de Poisson via algoritmo de Knuth — número de "eventos" esperados em média `lambda`. */
export function poissonRandom(rng: Rng, lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

export function weightedPick<T>(rng: Rng, items: T[], weightFn: (item: T) => number): T {
  const pesos = items.map(weightFn);
  const total = pesos.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[randomInt(rng, 0, items.length - 1)];

  let alvo = rng() * total;
  for (let i = 0; i < items.length; i++) {
    alvo -= pesos[i];
    if (alvo <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function clamp(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}
