import getVersion from "./getVersion";

const USER_AGENT = `Dex-chan/${getVersion()} by Bartolumiu (https://github.com/Bartolumiu/dexchan)`;

export default async function fetchImageAsBuffer(
  url: URL | null
): Promise<Buffer | null> {
  if (!url) return null;

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}
