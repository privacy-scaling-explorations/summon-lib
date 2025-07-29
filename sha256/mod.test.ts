import { assertEquals } from "@std/assert/mod.ts";
import sha256 from "./mod.ts";

// Helper function to convert string to boolean array (UTF-8 bytes)
function stringToBits(str: string): boolean[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const bits: boolean[] = [];

  for (const byte of bytes) {
    for (let i = 0; i < 8; i++) {
      // Little endian
      bits.push(((byte >> i) & 1) === 1);
    }
  }

  return bits;
}

// Helper function to convert boolean array to hex string
// Note: Summon always prefers little endian, but hex always puts the most
// significant nibble first. (In 0x3a, '3' and 'a' are nibbles.)
// Eg: 15 is always 0x0f, even though 0xf0 would be more consistent with our
// little endian preference.
function bitsToHex(bits: boolean[]): string {
  let hex = "";
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      if (i + j < bits.length && bits[i + j]) {
        // Little endian
        byte |= 1 << j;
      }
    }
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

Deno.test("SHA-256 hash of 'summon'", () => {
  const input = "summon";
  const inputBits = stringToBits(input);
  const hashBits = sha256(inputBits);
  const hashHex = bitsToHex(hashBits);

  const expected =
    "2815cb02b95b6d15383bf551f09b33e01806ad2f4221b035a592c1be146d6a99";

  assertEquals(hashHex, expected);
});
