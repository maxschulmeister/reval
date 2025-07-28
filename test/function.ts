export const functionWithOneArg = async ({
  file,
  model,
}: {
  file: string;
  model: string;
}) => {
  console.log("using file: ", file);
  console.log("using model: ", model);
  return {
    response: "test",
    tokens: {
      in: 10,
      out: 10,
    },
  };
};

export const functionWithMultipleArgs = async (file: string, model: string) => {
  console.log("using file: ", file);
  console.log("using model: ", model);
  return {
    response: "test",
    tokens: {
      in: 10,
      out: 10,
    },
  };
};
