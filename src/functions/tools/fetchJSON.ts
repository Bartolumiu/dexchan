import getVersion from "./getVersion";

const USER_AGENT = `Dex-chan/${getVersion()} by Bartolumiu (https://github.com/Bartolumiu/dexchan)`

export default async function fetchJSON(url: URL | null): Promise<any | null> {
  if (!url) return null;

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
