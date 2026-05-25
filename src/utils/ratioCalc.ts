interface RatioInput {
  dose?: number;
  yield?: number;
  ratio?: number;
}

interface RatioResult {
  dose: number;
  yield: number;
  ratio: number;
}

export function solveRatio(input: RatioInput): RatioResult | null {
  const { dose, yield: yieldG, ratio } = input;
  if (dose != null && ratio != null) {
    return { dose, yield: Math.round(dose * ratio * 10) / 10, ratio };
  }
  if (yieldG != null && ratio != null && ratio !== 0) {
    return { dose: Math.round((yieldG / ratio) * 10) / 10, yield: yieldG, ratio };
  }
  if (dose != null && yieldG != null && dose !== 0) {
    return { dose, yield: yieldG, ratio: Math.round((yieldG / dose) * 100) / 100 };
  }
  return null;
}
