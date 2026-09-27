/** URL of the admin leads list for a status filter and page. */
export function leadsHref(status?: string, page?: number) {
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  if (page && page > 1) q.set("page", String(page));
  const qs = q.toString();
  return `/admin/leads${qs ? `?${qs}` : ""}`;
}
