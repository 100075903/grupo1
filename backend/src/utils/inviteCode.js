const ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generarCodigoInvitacion(length = 8) {
  let s = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    s += ALPHANUM[bytes[i] % ALPHANUM.length];
  }
  return s;
}
