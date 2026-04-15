// Excludes visually ambiguous characters (I, O, 0, 1) so codes are easy
// to read and type when shared on paper or by voice.
const ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generarCodigoInvitacion(length = 8) {
  let s = "";
  const bytes = new Uint8Array(length);
  // Use cryptographic randomness — Math.random() is not safe for this use case
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    s += ALPHANUM[bytes[i] % ALPHANUM.length];
  }
  return s;
}
