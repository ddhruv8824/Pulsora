// Demo password gate. Active only when DEMO_PASSWORD is set (e.g. on Vercel),
// so local development stays open. The cookie holds a hash, never the password.
export const ACCESS_COOKIE = "pulsora_access";

export async function accessToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`pulsora-demo:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
