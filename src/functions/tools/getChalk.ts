import type { ChalkInstance } from "chalk";

const getChalk = async (): Promise<ChalkInstance> => {
  const chalkModule = await import("chalk");
  return chalkModule.default;
};

export default getChalk;
