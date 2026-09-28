import { Dots, Icon } from "@/components/atoms";
import { Visual } from "@/components/molecules";
import type { Service } from "@/db/schema";
import { cx, vars } from "@/lib/utils";

const SCREEN = "h-[230px] sm:h-[300px] lg:h-[340px]";

function Bar({ className }: { className?: string }) {
  return <span className={cx("block shrink-0 rounded-full", className)} />;
}

/** Search-results sketch shown for SEO services without a picture. */
function SerpSketch() {
  return (
    <div className={cx("grid-bg flex flex-col gap-3 bg-page p-4 lg:gap-4 lg:p-6", SCREEN)} style={vars({ grid: "22px" })}>
      <div className="flex h-10 shrink-0 items-center gap-2.5 rounded-full border border-line bg-white px-4 text-brand shadow-sm">
        <Icon name="search" size={16} />
        <Bar className="h-2 w-28 bg-line-strong" />
        <span className="ms-auto block h-4 w-0.5 rounded-full bg-brand" />
      </div>
      <div className="flex min-h-0 grow gap-3 lg:gap-4">
        <div className="flex min-w-0 grow flex-col gap-2.5">
          <div className="flex flex-col gap-2 rounded-lg border border-brand/25 bg-white p-3 shadow-md lg:p-3.5">
            <span className="flex items-center gap-2">
              <span className="icon-gradient size-4 rounded-full shadow-none" />
              <Bar className="h-1.5 w-16 bg-line-strong" />
              <span className="ms-auto flex items-center gap-1 rounded-full bg-success-bg px-1.5 py-0.5 text-success">
                <Icon name="arrow-up" size={11} strokeWidth={3} />
                <Bar className="h-1 w-4 bg-success/60" />
              </span>
            </span>
            <Bar className="h-2.5 w-[72%] bg-gradient-to-l from-brand to-brand-decorative" />
            <Bar className="h-1.5 w-[92%] bg-line" />
            <Bar className="h-1.5 w-[70%] bg-line" />
          </div>
          {[0.58, 0.64].map((w, i) => (
            <div key={i} className={cx("flex flex-col gap-2 rounded-lg border border-line bg-white/80 p-3 lg:p-3.5", i === 1 && "hidden sm:flex")}>
              <span className="flex items-center gap-2">
                <span className="size-4 rounded-full bg-line" />
                <Bar className="h-1.5 w-14 bg-line" />
              </span>
              <span className="block h-2.5 rounded-full bg-line-strong" style={{ width: `${w * 100}%` }} />
              <Bar className="h-1.5 w-[85%] bg-line" />
            </div>
          ))}
        </div>
        <div className="hidden w-[34%] shrink-0 flex-col gap-3 sm:flex">
          <div className="flex grow flex-col justify-end gap-2 rounded-lg border border-line bg-white p-3">
            <Bar className="h-1.5 w-12 bg-line-strong" />
            <span className="mt-auto flex h-[60%] items-end gap-1.5">
              {[35, 50, 45, 70, 100].map((h, i) => (
                <span key={i} className="grow rounded-t-sm bg-gradient-to-t from-brand to-brand-decorative" style={{ height: `${h}%` }} />
              ))}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white p-3">
            <span className="flex size-6 items-center justify-center rounded-md bg-soft text-brand">
              <Icon name="gauge" size={14} />
            </span>
            <span className="flex grow flex-col gap-1.5">
              <Bar className="h-1.5 w-[80%] bg-line-strong" />
              <Bar className="h-1.5 w-[55%] bg-success/40" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Website sketch shown for web design services without a picture. */
function SiteSketch() {
  return (
    <div className={cx("flex flex-col gap-4 bg-white p-4 lg:gap-5 lg:p-6", SCREEN)}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="icon-gradient size-5 rounded-md shadow-none" />
          <Bar className="h-2.5 w-14 bg-line-strong" />
        </span>
        <span className="hidden items-center gap-3 sm:flex">
          <Bar className="h-2 w-9 bg-line" />
          <Bar className="h-2 w-9 bg-line" />
          <Bar className="h-2 w-9 bg-line" />
          <span className="block h-6 w-16 rounded-md bg-brand" />
        </span>
      </div>
      <div className="relative grid grow grid-cols-[1fr_1.1fr] items-stretch gap-4 overflow-hidden rounded-lg bg-soft p-4 lg:gap-5 lg:p-5">
        <div className="flex flex-col justify-center gap-2.5">
          <Bar className="h-3 w-[92%] bg-ink/80" />
          <Bar className="h-3 w-[60%] bg-gradient-to-l from-brand to-brand-decorative" />
          <Bar className="mt-1.5 h-1.5 w-[95%] bg-line-strong" />
          <Bar className="h-1.5 w-[78%] bg-line-strong" />
          <span className="mt-2.5 flex gap-2">
            <span className="block h-6 w-16 rounded-md bg-brand" />
            <span className="block h-6 w-12 rounded-md border border-line-strong bg-white" />
          </span>
        </div>
        <div className="relative rounded-md bg-white shadow-md">
          <span className="absolute inset-2.5 rounded-sm bg-gradient-to-br from-brand/15 to-brand-decorative/25" />
          <span className="absolute right-4 bottom-4 flex size-9 items-center justify-center rounded-full bg-white text-brand shadow-md">
            <Icon name="image" size={16} />
          </span>
        </div>
      </div>
      <div className="hidden grid-cols-3 gap-3 sm:grid">
        {["layout", "responsive", "gauge"].map((icon) => (
          <span key={icon} className="flex h-12 items-center gap-2 rounded-lg border border-line bg-page px-3 lg:h-14">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-soft text-brand">
              <Icon name={icon} size={14} />
            </span>
            <span className="flex grow flex-col gap-1.5">
              <Bar className="h-1.5 w-[80%] bg-line-strong" />
              <Bar className="h-1.5 w-[55%] bg-line" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Service hero picture: the uploaded image (or a sketch matching the category)
 * in a glass browser frame, with floating cards built from the service itself.
 */
export function ServiceHeroVisual({ service, categoryTitle }: { service: Service; categoryTitle: string }) {
  const steps = service.process.slice(0, 3);
  return (
    <div className="relative mx-auto w-full max-w-[560px] sm:pt-8 sm:pb-12 lg:pt-6 lg:pb-14">
      <div className="frame-glass rounded-2xl p-2 lg:p-2.5">
        <div className="overflow-hidden rounded-xl bg-white">
          <div aria-hidden="true" className="flex h-8 items-center gap-3 border-b border-line bg-page px-3 lg:h-9">
            <Dots size={8} />
            <span className="flex h-5 grow items-center gap-1.5 rounded-full border border-line bg-white px-2.5">
              <span className="size-2 shrink-0 rounded-full bg-success/60" />
              <span className="h-1.5 w-2/5 rounded-full bg-line-strong" />
            </span>
          </div>
          {service.imageUrl ? (
            <Visual src={service.imageUrl} alt={service.title} priority className={SCREEN} />
          ) : (
            <div aria-hidden="true">{service.category === "seo" ? <SerpSketch /> : <SiteSketch />}</div>
          )}
        </div>
      </div>

      {/* The service itself */}
      <div
        aria-hidden="true"
        className="float-card float absolute top-0 -left-3 hidden max-w-[260px] items-center gap-3 py-3 ps-3 pe-5 sm:flex lg:-left-10"
        style={vars({ i: 0 })}
      >
        <span className="icon-gradient size-11 rounded-full">
          <Icon name={service.icon} size={20} />
        </span>
        <span className="flex min-w-0 flex-col">
          {categoryTitle && <span className="css-label text-xs leading-[1.7] text-muted" data-label={categoryTitle} />}
          <span dir={service.englishTitle ? "ltr" : undefined} className="truncate text-sm leading-[1.7] font-bold text-ink">
            <span className="css-label" data-label={service.englishTitle || service.title} />
          </span>
        </span>
      </div>

      {/* First steps of its process */}
      {steps.length > 0 && (
        <div
          aria-hidden="true"
          className="float-card float absolute -right-3 bottom-0 hidden w-[236px] p-4 sm:block lg:-right-10"
          style={vars({ i: 1 })}
        >
          <p className="flex items-center justify-between gap-3 text-xs leading-[1.7] font-semibold text-ink">
            <span className="css-label" data-label="روند اجرای پروژه" />
            <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-bold text-brand-hover"><span className="css-label" data-label={`${service.process.length.toLocaleString("fa-IR")} مرحله`} /></span>
          </p>
          <ol className="mt-3 flex flex-col gap-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-2.5 text-xs leading-[1.7] text-ink-2">
                <span
                  className={cx(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    i === 0 ? "icon-gradient shadow-none" : "border border-line bg-page text-muted",
                  )}
                >
                  {i + 1}
                </span>
                <span className="css-label truncate" data-label={step.title} />
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
