import sha256Compress from "./sha256Compress.ts";

export default function sha256(bits: boolean[]): boolean[] {
  // SHA-256 constants (initial hash values)
  const IV = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  function u32ToBits(n: number): boolean[] {
    let out = [];
    for (let i = 0; i < 32; i++) {
      out[31 - i] = ((n >>> i) & 1) === 1;
    }
    return out;
  }

  function padMessage(bits: boolean[]): boolean[] {
    const l = bits.length;
    let padded = bits.slice();
    // Append '1'
    padded.push(true);
    // Append '0's until length ≡ 448 mod 512
    while ((padded.length + 64) % 512 !== 0) {
      padded.push(false);
    }
    // Append 64-bit big-endian length
    const lenBits = BigInt(l);
    for (let i = 63; i >= 0; i--) {
      padded.push(((lenBits >> BigInt(i)) & 1n) === 1n);
    }
    return padded;
  }

  // Initial state
  let state = IV.flatMap(u32ToBits); // 8 × 32 = 256 bits

  const padded = padMessage(bits);

  // Process each 512-bit block
  for (let i = 0; i < padded.length; i += 512) {
    let block = padded.slice(i, i + 512);
    block.reverse();
    state.reverse();
    state = sha256Compress(block, state);
    state.reverse();
  }

  return state; // 256 bits
}
