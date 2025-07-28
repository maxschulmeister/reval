export const combineArgs = (input: any[]) => {
  if (input.length === 0) return [];

  const cartesian = (...arrays: any[][]) => {
    return arrays.reduce(
      (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
      [[]]
    );
  };

  // Handle array of objects with array values
  if (typeof input[0] === "object" && !Array.isArray(input[0])) {
    const keys = Object.keys(input[0]);
    const values = keys.map((key) => input[0][key]);
    const combinations = cartesian(...values);
    return combinations.map((combo) => [
      keys.reduce((obj, key, index) => ({ ...obj, [key]: combo[index] }), {}),
    ]);
  }

  // Handle array of arrays
  return cartesian(...input);
};
