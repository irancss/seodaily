import Link from "next/link";

import { Icon } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { ProjectsGrid } from "@/components/organisms/admin";
import { listProjects } from "@/modules/admin/projects-queries";

export const metadata = { title: "نمونه‌کارها" };

export default async function ProjectsAdmin() {
  const projects = await listProjects();

  return (
    <>
      <PageHeader
        title="نمونه‌کارها"
        description="پروژه‌ها به همین ترتیب در سایت نمایش داده می‌شوند (ویژه‌ها اول)."
        action={
          <Link href="/admin/projects/new" className="btn btn-primary h-11 px-5 text-sm">
            <Icon name="plus" size={18} />
            پروژه جدید
          </Link>
        }
      />
      <ProjectsGrid projects={projects} />
    </>
  );
}
