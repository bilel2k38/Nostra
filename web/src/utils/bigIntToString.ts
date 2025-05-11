// Recursively convert all BigInts in an object/array to strings
export function bigIntToString(obj: any): any {
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(bigIntToString);
  if (obj && typeof obj === 'object') {
    const out: any = {};
    for (const key in obj) {
      out[key] = bigIntToString(obj[key]);
    }
    return out;
  }
  return obj;
}
