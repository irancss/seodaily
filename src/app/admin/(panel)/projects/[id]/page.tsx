import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/molecules";
import { ProjectForm } from "@/components/organisms";
import { getProject } from "@/modules/admin/projects-queries";
import { projectHref } from "@/modules/projects/routes";
import { projectTypes } from "@/modules/projects/types";

export const metadata = { title: "ویرایش پروژه" };

type Props = { params: Promise<{ id: string }> };

export default async function EditProject({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [project, types] = await Promise.all([getProject(id), projectTypes()]);
  if (!project) notFound();
  return (
    <>
      <PageHeader
        title={project.title}
        back={{ href: "/admin/projects", label: "نمونه‌کارها" }}
        action={project.published ? <Link href={projectHref(project.slug)} target="_blank" className="btn btn-secondary h-11 px-5 text-sm">مشاهده صفحه</Link> : undefined}
      />
      <ProjectForm project={project} types={types} />
    </>
  );
}
