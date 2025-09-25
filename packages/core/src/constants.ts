export const NAMESPACE = "reval";
export const DATA_DIR = "data";
export const PATH_DELIMITER = "::";

export const COLUMN_EXPANSION_CONFIG: Record<
  string,
  {
    depth: number;
    exclude?: string[];
  }
> = {
  result: { depth: -1, exclude: ["output"] }, // Expand infinitely but exclude output
  score: { depth: 2 },
  features: { depth: -1 },
  variants: { depth: -1 },
} as const;
