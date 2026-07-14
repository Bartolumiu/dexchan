/**
 * Capitalises the first letter of the provided string
 * @param str The string to be transformed
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
