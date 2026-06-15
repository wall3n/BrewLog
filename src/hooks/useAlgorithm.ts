import { solveRatio } from '../utils/ratioCalc';
import { calculateEY, getSCAZone, type SCAZone } from '../utils/scaChart';
import { getTargets, extractionZone } from '../utils/methodDefaults';

export type { SCAZone };

export function useAlgorithm() {
  return {
    solveRatio,
    calculateEY,
    getSCAZone,
    getTargets,
    extractionZone,
  };
}
