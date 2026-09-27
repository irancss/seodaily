import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Flash, PageHeader } from "@/components/molecules";
import { db, schema } from "@/db";
import { projectHref } from "@/modules/projects/routes";

import { ProjectForm } from "@/components/organisms";
import { projectTypes } from "@/modules/projects/types";

export const metadata = { title: "ویرایش پروژه" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function EditProject({ params, searchParams }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [sp, project, types] = await Promise.all([
    searchParams,
    db.query.projects.findFirst({ where: eq(schema.projects.id, id) }),
    projectTypes(),
  ]);
  if (!project) notFound();
  return (
    <>
      <PageHeader
        title={project.title}
        back={{ href: "/admin/projects", label: "نمونه‌کارها" }}
        action={project.published ? <Link href={projectHref(project.slug)} target="_blank" className="btn btn-secondary h-11 px-5 text-sm">مشاهده صفحه</Link> : undefined}
      />
      <Flash ok={sp.ok} error={sp.error} />
      <ProjectForm project={project} types={types} />
    </>
  );
}
