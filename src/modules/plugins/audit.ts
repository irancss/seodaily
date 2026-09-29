import "server-only";

import { db, schema } from "@/db";
import type { Tx } from "@/modules/slugs/registry";

/** Records a sensitive admin action (never with OTP codes, tokens or file bytes). */
export async function audit(
  userId: number | null,
  action: string,
  target: { type: string; id: string | number },
  detail: Record<string, unknown> = {},
  tx: Tx | typeof db = db,
) {
  await tx.insert(schema.adminAudit).values({ userId, action, targetType: target.type, targetId: String(target.id), detail });
}
