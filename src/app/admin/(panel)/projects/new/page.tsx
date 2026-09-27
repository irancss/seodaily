import { PageHeader } from "@/components/molecules";
import { ProjectForm } from "@/components/organisms";
import { projectTypes } from "@/modules/projects/types";

export const metadata = { title: "پروژه جدید" };

export default async function NewProject() {
  const types = await projectTypes();
  return (
    <>
      <PageHeader title="پروژه جدید" back={{ href: "/admin/projects", label: "نمونه‌کارها" }} />
      <ProjectForm types={types} />
    </>
  );
}
