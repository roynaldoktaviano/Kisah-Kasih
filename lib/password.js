import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);

// format tersimpan: scrypt$<salt hex>$<hash hex>
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(String(password), salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [algo, saltHex, hashHex] = String(stored).split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(String(password), Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

// password acak yang mudah diketik untuk akun customer baru
export function suggestPassword() {
  const words = ["mawar", "melati", "kasih", "cinta", "bahagia", "senja", "pelangi", "bintang", "anggrek", "lestari"];
  const w = words[randomBytes(1)[0] % words.length];
  return `${w}${100 + (randomBytes(2).readUInt16BE() % 900)}`;
}
