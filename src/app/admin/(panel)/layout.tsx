import type { ReactNode } from "react";

import { AdminShell } from "@/components/templates";
import { countNewLeads } from "@/modules/admin/dashboard-queries";
import { requireAdmin } from "@/modules/auth/session";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  const newLeads = await countNewLeads();

  return (
    <AdminShell user={user} newLeads={newLeads}>
      {children}
    </AdminShell>
  );
}
