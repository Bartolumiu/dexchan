/**
 * Retrieves the current version of the application from the package.json file.
 */
import pkg from "../../../package.json";

export default function getVersion(): string {
  return pkg.version;
}
