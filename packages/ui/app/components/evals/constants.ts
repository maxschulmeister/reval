// Single source of truth for hidden columns
export const HIDDEN_COLUMNS = [
  "args",
  "dataIndex",
  "evalId",
  "id",
  "eval_id",
] as const;

export type HiddenColumn = (typeof HIDDEN_COLUMNS)[number];

// Path delimiter for object key exploration
export const PATH_DELIMITER = "::" as const;
