import { YEAR_MIN } from "@/polymet/data/timeline-data";

export const MIN_PX_PER_YEAR = 2.5;
export const MAX_PX_PER_YEAR = 18;
export const DEFAULT_PX_PER_YEAR = 6;

export function yearToX(year: number, pxPerYear: number): number {
  return (year - YEAR_MIN) * pxPerYear;
}

export function spanWidth(
  startYear: number,
  endYear: number,
  pxPerYear: number
): number {
  return Math.max((endYear - startYear) * pxPerYear, 4);
}

export function isSpanEntry(startYear: number, endYear?: number): boolean {
  return typeof endYear === "number" && endYear - startYear >= 8;
}
