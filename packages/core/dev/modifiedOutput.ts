// import { loadData } from "../src/utils";

// export default async function modifyOutput(args: {
//   file: string;
//   model: string;
// }) {
//   const data = await loadData();
//   const { file, model } = args;

//   const index = data.features.findIndex((item: string) => item === file);
//   const result = data.target[index];

//   const modifiedResult = eraseRandomCharacters(result, 10, 20);

//   console.log("file", file);
//   console.log("model", model);
//   console.log("result", modifiedResult);
//   return {
//     content: modifiedResult,
//     tokens: {
//       in: 10,
//       out: 10,
//     },
//   };
// }

// const eraseRandomCharacters = (
//   jsonStr: string,
//   min: number,
//   max: number
// ): string => {
//   const eraseFromString = (str: string): string => {
//     const numToErase = Math.floor(Math.random() * (max - min + 1)) + min;
//     const chars = str.split("");
//     const positions = new Set<number>();

//     while (positions.size < Math.min(numToErase, str.length)) {
//       positions.add(Math.floor(Math.random() * chars.length));
//     }

//     Array.from(positions)
//       .sort((a, b) => b - a)
//       .forEach((pos) => chars.splice(pos, 1));

//     return chars.join("");
//   };

//   const processValue = (value: any): any => {
//     if (typeof value === "string") {
//       return eraseFromString(value);
//     } else if (Array.isArray(value)) {
//       return value.map(processValue);
//     } else if (value && typeof value === "object") {
//       const result: any = {};
//       for (const [key, val] of Object.entries(value)) {
//         result[key] = processValue(val);
//       }
//       return result;
//     }
//     return value;
//   };

//   const parsed = JSON.parse(jsonStr);
//   const processed = processValue(parsed);
//   return JSON.stringify(processed);
// };
