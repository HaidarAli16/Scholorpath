const mojibakeMarker = /[\u00c2\u00c3\u00f0\u00e2]/;

export function repairMojibake(value: string) {
  let repaired = value;
  for (let pass = 0; pass < 3 && mojibakeMarker.test(repaired); pass += 1) {
    const decoded = Buffer.from(repaired, "latin1").toString("utf8");
    if (!decoded || decoded.includes("\ufffd") || decoded === repaired) break;
    repaired = decoded;
  }
  return repaired;
}

export function repairTextTree<T>(value: T): T {
  if (typeof value === "string") return repairMojibake(value) as T;
  if (Array.isArray(value)) return value.map((item) => repairTextTree(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, repairTextTree(item)])) as T;
  }
  return value;
}
