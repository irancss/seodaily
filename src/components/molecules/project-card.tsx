import Link from "next/link";
import type { CSSProperties } from "react";

import type { Project } from "@/db/schema";
import { projectHref } from "@/modules/projects/routes";

import { ArrowBadge } from "@/components/atoms";
import { BrowserFrame } from "@/components/molecules/browser-frame";
import { cx } from "@/lib/utils";
import { Visual } from "@/components/molecules/visual";

/** Portfolio teaser: browser-framed picture that zooms on hover, category chip and name. */
export function ProjectCard({
  project,
  large = false,
  height,
  className,
  style,
}: {
  project: Project;
  large?: boolean;
  height?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Link
      href={projectHref(project.slug)}
      className={cx(
        "card-link group flex flex-col text-ink no-underline hover:text-ink",
        large ? "gap-4 lg:row-span-2 lg:gap-5" : "gap-4",
        className,
      )}
      style={style}
    >
      <div className="relative flex grow flex-col rounded-xl transition-[transform,box-shadow] duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1 group-hover:shadow-lg">
        <BrowserFrame compact shadow="sm" className="grow rounded-xl">
          <Visual
            src={project.imageUrl}
            alt={project.title}
            className={cx("img-zoom", height ?? (large ? "h-[240px] grow lg:min-h-[480px]" : "h-[240px] lg:h-[212px]"))}
          />
        </BrowserFrame>
        {project.projectType && (
          <span className="chip absolute top-10 right-3 bg-white/90 text-xs shadow-sm backdrop-blur lg:top-12 lg:right-4">
            {project.projectType}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="card-title t-h3 transition-colors">{project.title}</h3>
          {project.summary && <p className="mt-0.5 line-clamp-1 text-sm leading-[1.8] text-muted">{project.summary}</p>}
        </div>
        <ArrowBadge />
      </div>
    </Link>
  );
}
