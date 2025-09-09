export type BinaryLike = ArrayBuffer | Uint8Array;

export const toUint8 = (input: BinaryLike): Uint8Array => {
  if (input instanceof Uint8Array) return input;
  return new Uint8Array(input);
};

export const maybeToNodeBuffer = (u8: Uint8Array): any => {
  // Convert to Node Buffer if available (not in Cloudflare Workers)
  const anyGlobal: any = globalThis as any;
  if (typeof anyGlobal.Buffer !== "undefined") {
    return anyGlobal.Buffer.from(u8);
  }
  return null;
};

export const uint8ToBase64 = (u8: Uint8Array): string => {
  // Browser/Worker-safe Base64 from Uint8Array
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    const sub = u8.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, Array.from(sub) as any);
  }
  // btoa is available in Workers
  return btoa(binary);
};

export const getExt = (fileName?: string): string => {
  if (!fileName) return "";
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : "";
};

