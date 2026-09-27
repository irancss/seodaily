import { Flash, PageHeader } from "@/components/molecules";
import { ProjectForm } from "@/components/organisms";
import { projectTypes } from "@/modules/projects/types";

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
