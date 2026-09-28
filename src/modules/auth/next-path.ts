// Where to go after logging in. Only panel pages are allowed, so a crafted
// ?next= can never send the admin to another site (open redirect).
export function safeAdminPath(value: unknown): string {
  if (typeof value !== "string") return "/admin";
  let path: string;
  try {
    path = decodeURIComponent(value);
  } catch {
    return "/admin";
  }
  if (!/^\/admin(\/[^/\\]|$|\?)/.test(path) || /[\\\s]|\/\/|^\/admin\/login/.test(path)) return "/admin";
  return value;
}
