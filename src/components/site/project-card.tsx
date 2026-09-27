import Link from "next/link";

import type { Project } from "@/db/schema";
import { projectHref } from "@/lib/data";

import { ArrowBadge, BrowserFrame, cx, Visual } from "./ui";

/** Home / web-design portfolio teaser: a browser frame, category and name. */
export function ProjectCard({
  project,
  large = false,
  height,
}: {
  project: Project;
  large?: boolean;
  height?: string;
}) {
  return (
    <Link
      href={projectHref(project.slug)}
      className={cx(
        "card-link flex flex-col text-ink no-underline hover:text-ink",
        large ? "gap-3 lg:row-span-2 lg:gap-5" : "gap-3 lg:gap-4",
      )}
    >
      <BrowserFrame compact shadow="none" className="grow">
        <Visual
          src={project.imageUrl}
          alt={project.title}
          className={height ?? (large ? "h-[220px] grow lg:min-h-[480px]" : "h-[220px] lg:h-[212px]")}
        />
      </BrowserFrame>
      <div className="flex items-center justify-between gap-4">
        <div>
          {project.projectType && (
            <span className="text-sm leading-[1.7] font-medium text-muted">{project.projectType}</span>
          )}
          <h3 className="card-title t-h3">{project.title}</h3>
        </div>
        <span className="hidden lg:block">
          <ArrowBadge />
        </span>
      </div>
    </Link>
  );
}
