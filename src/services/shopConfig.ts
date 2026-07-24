export interface ShopConfig {
  xpBoostCost: number;
  xpBoostAmount: number;
  extraLifeCost: number;
  extraLifeAmount: number;
  streakShieldCost: number;
  nameCardCost: number;
  coinPackSmallCoins: number;
  coinPackSmallPrice: string;
  coinPackLargeCoins: number;
  coinPackLargePrice: string;
  chestMaxCoins: number;
  chestMaxXp: number;
  chestCommonMin: number;
  chestCommonMax: number;
}

export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  xpBoostCost: 20,
  xpBoostAmount: 50,
  extraLifeCost: 10,
  extraLifeAmount: 1,
  streakShieldCost: 30,
  nameCardCost: 15,
  coinPackSmallCoins: 100,
  coinPackSmallPrice: 'R$ 9,90',
  coinPackLargeCoins: 500,
  coinPackLargePrice: 'R$ 29,90',
  chestMaxCoins: 10,
  chestMaxXp: 10,
  chestCommonMin: 3,
  chestCommonMax: 6,
};

const STORAGE_KEY = 'falla_shop_config';

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function sanitizeShopConfig(config: Partial<ShopConfig>): ShopConfig {
  const merged = { ...DEFAULT_SHOP_CONFIG, ...config };

  const chestMaxCoins = clampInteger(merged.chestMaxCoins, 1, 100, 10);
  const chestMaxXp = clampInteger(merged.chestMaxXp, 1, 100, 10);
  const absoluteMax = Math.min(chestMaxCoins, chestMaxXp);

  const commonMin = clampInteger(
    merged.chestCommonMin,
    1,
    absoluteMax,
    Math.min(3, absoluteMax),
  );

  const commonMax = clampInteger(
    merged.chestCommonMax,
    commonMin,
    absoluteMax,
    Math.min(6, absoluteMax),
  );

  return {
    xpBoostCost: clampInteger(merged.xpBoostCost, 0, 100000, 20),
    xpBoostAmount: clampInteger(merged.xpBoostAmount, 1, 100000, 50),
    extraLifeCost: clampInteger(merged.extraLifeCost, 0, 100000, 10),
    extraLifeAmount: clampInteger(merged.extraLifeAmount, 1, 5, 1),
    streakShieldCost: clampInteger(merged.streakShieldCost, 0, 100000, 30),
    nameCardCost: clampInteger(merged.nameCardCost, 0, 100000, 15),
    coinPackSmallCoins: clampInteger(merged.coinPackSmallCoins, 1, 1000000, 100),
    coinPackSmallPrice: String(merged.coinPackSmallPrice || 'R$ 9,90'),
    coinPackLargeCoins: clampInteger(merged.coinPackLargeCoins, 1, 1000000, 500),
    coinPackLargePrice: String(merged.coinPackLargePrice || 'R$ 29,90'),
    chestMaxCoins,
    chestMaxXp,
    chestCommonMin: commonMin,
    chestCommonMax: commonMax,
  };
}

export function loadShopConfig(): ShopConfig {
  if (typeof window === 'undefined') return DEFAULT_SHOP_CONFIG;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SHOP_CONFIG;
    return sanitizeShopConfig(JSON.parse(saved));
  } catch {
    return DEFAULT_SHOP_CONFIG;
  }
}

export function saveShopConfig(config: ShopConfig): ShopConfig {
  const sanitized = sanitizeShopConfig(config);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(
      new CustomEvent('falla-shop-config-updated', { detail: sanitized }),
    );
  }

  return sanitized;
}

/**
 * Sorteio ponderado:
 * - valores dentro da faixa comum recebem peso 8;
 * - valores fora da faixa recebem peso 1;
 * - portanto 3 a 6 aparecem com muito mais frequência nas configurações padrão.
 */
export function generateWeightedReward(
  maximum: number,
  commonMin: number,
  commonMax: number,
): number {
  const safeMaximum = Math.max(1, Math.round(maximum));
  const safeMin = Math.max(1, Math.min(Math.round(commonMin), safeMaximum));
  const safeMax = Math.max(safeMin, Math.min(Math.round(commonMax), safeMaximum));

  const weightedValues: number[] = [];

  for (let value = 1; value <= safeMaximum; value += 1) {
    const weight = value >= safeMin && value <= safeMax ? 8 : 1;

    for (let count = 0; count < weight; count += 1) {
      weightedValues.push(value);
    }
  }

  return weightedValues[Math.floor(Math.random() * weightedValues.length)] ?? 1;
}
