import { Flash, PageHeader } from "@/components/admin/ui";

import { ProjectForm } from "../project-form";
import { projectTypes } from "../types";

export const metadata = { title: "پروژه جدید" };

export default async function NewProject({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [sp, types] = await Promise.all([searchParams, projectTypes()]);
  return (
    <>
      <PageHeader title="پروژه جدید" back={{ href: "/admin/projects", label: "نمونه‌کارها" }} />
      <Flash error={sp.error} />
      <ProjectForm types={types} />
    </>
  );
}
