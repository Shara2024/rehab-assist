import { useMemo } from "react";
import type { Side, RomMetrics, UpperBodyPoints } from "../types/romTypes";
import { computeShoulderRom } from "../utils/shoulderAbduction";

type UseShoulderRomArgs = {
  upperBody: UpperBodyPoints | null;
  side: Side;
};

export function useShoulderRom({
  upperBody,
  side,
}: UseShoulderRomArgs): RomMetrics | null {
  return useMemo(() => {
    if (!upperBody) return null;
    return computeShoulderRom(upperBody, side);
  }, [upperBody, side]);
}
