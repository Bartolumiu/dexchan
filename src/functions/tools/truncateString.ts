export default function truncateString(
  str: string | null,
  maxLength: number = 100
): string | null {
  if (str === null) return null;

  if (str.length <= maxLength) {
    return str;
  }

  if (maxLength <= 6) {
    return str.slice(0, Math.max(0, maxLength));
  }

  return (
    str
      .slice(0, maxLength - 6)
      .split(" ")
      .slice(0, -1)
      .join(" ") + " (...)"
  );
}
