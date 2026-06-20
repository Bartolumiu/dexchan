export default function truncateString(
  str: string | null,
  maxLength: number = 100
): string | null {
  if (str === null) return null;

  if (str.length <= maxLength) {
    return str;
  }

  if (maxLength <= 6) {
    throw new RangeError("maxLength must be greater than 6");
  }

  return (
    str
      .slice(0, maxLength - 6)
      .split(" ")
      .slice(0, -1)
      .join(" ") + " (...)"
  );
}
