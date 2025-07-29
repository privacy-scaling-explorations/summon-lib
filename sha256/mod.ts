import sha256Compress from "./sha256Compress.ts";

/**
 * Computes the SHA-256 hash of the input bits.
 *
 * This implementation accepts input bits with least significant bit first
 * within each byte, but produces standard SHA-256 hashes compatible with
 * external implementations.
 *
 * Unfortunately, there isn't any way to make this not confusing. Summon is
 * little-endian, and sha256 contains big-endian assumptions. You can use
 * `sha256BigEndian` if you prefer.
 *
 * @param bits - Input bits as boolean array. Length must be a multiple of 8.
 *               Within each byte, bits are expected in LSB-first order.
 * @returns The SHA-256 hash as a 256-bit boolean array. The bytes are in
 *          standard order, but the bits are in little-endian order.
 *
 * @example
 * ```typescript
 * // Hash the string "hello" with LSB-first bit ordering within bytes
 * const inputBits = stringToLSBBits("hello");
 * const hash = sha256(inputBits);
 * // When interpreting the bits of hash, take 8 bits at a time, and interpret
 * // them as bytes in LSB order.
 * ```
 */
export default function sha256(bits: boolean[]): boolean[] {
  return sha256Impl(bits, true);
}

/**
 * Computes the SHA-256 hash of the input bits.
 *
 * This version is more internally consistent, since sha256 makes some
 * big-endian assumptions. However, it may feel less natural in other places,
 * since Summon always prefers little endian.
 * 
 * Note: These versions only differ in the way bits are ordered within bytes.
 * Byte order is always the same.
 */
export function sha256BigEndian(bits: boolean[]): boolean[] {
  return sha256Impl(bits, false);
}

function sha256Impl(bits: boolean[], littleEndian: boolean) {
  // SHA-256 constants (initial hash values)
  const IV = [
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ];

  function u32ToBits(n: number): boolean[] {
    let out: boolean[] = [];
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

  const orderedBits = littleEndian ? reverseBytes(bits) : bits;

  const padded = padMessage(orderedBits);

  // Process each 512-bit block
  for (let i = 0; i < padded.length; i += 512) {
    let block = padded.slice(i, i + 512);
    block.reverse();
    state.reverse();
    state = sha256Compress(block, state);
    state.reverse();
  }

  if (littleEndian) {
    state = reverseBytes(state);
  }

  return state; // 256 bits
}

function reverseBytes(bits: boolean[]): boolean[] {
  // take each 8-bit sequence and reverse it
  // throw if not multiple of 8
  if (bits.length % 8 !== 0) {
    throw new Error(`Input length must be a multiple of 8, got ${bits.length}`);
  }

  let result: boolean[] = [];

  for (let i = 0; i < bits.length; i += 8) {
    // Extract 8-bit sequence
    let byte = bits.slice(i, i + 8);
    // Reverse the bits within this byte and add to result
    result.push(...byte.reverse());
  }

  return result;
}
