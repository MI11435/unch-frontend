const cache = new Map();
const STALE_TIME = 60_000;

export async function cachedFetch(url, options) {
  const key = url;
  const entry = cache.get(key);

  if (entry && Date.now() - entry.time < STALE_TIME) {
    return entry.data;
  }

  const res = await fetch(url, options);
  const data = await res.json();
  cache.set(key, { data, time: Date.now() });
  return data;
}

export function clearCache() {
  cache.clear();
}
