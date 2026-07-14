/**
 * Retrieves the current version of the application from the package.json file.
 */
export default function getVersion(): string {
  const pkg = require("../../../package.json");
  return pkg.version as string;
}
