import { Dots } from "@/components/atoms";
import { cx, vars } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <span className={cx("block shrink-0 rounded-full", className)} />;
}

/** Website sketch for frames without a project picture. */
function Sketch({ className, flip = false }: { className: string; flip?: boolean }) {
  return (
    <div className={cx("flex flex-col gap-3 bg-white p-3 lg:gap-4 lg:p-4", className)}>
      <div className="flex items-center justify-between">
        <Bar className="h-2 w-12 bg-line-strong" />
        <span className="flex gap-2">
          <Bar className="h-1.5 w-6 bg-line" />
          <Bar className="h-1.5 w-6 bg-line" />
          <Bar className="h-1.5 w-6 bg-line" />
        </span>
      </div>
      <div className={cx("grid grow items-center gap-3 rounded-md bg-soft p-3", flip ? "grid-cols-[1fr_1.2fr]" : "grid-cols-[1.2fr_1fr]")}>
        <span className={cx("flex flex-col gap-2", flip && "order-2")}>
          <Bar className="h-2 w-[90%] bg-ink/70" />
          <Bar className="h-2 w-[60%] bg-gradient-to-l from-brand to-brand-decorative" />
          <Bar className="mt-1 h-1.5 w-[80%] bg-line-strong" />
          <span className="mt-1 block h-4 w-12 rounded-sm bg-brand" />
        </span>
        <span className="block h-full min-h-12 rounded-sm bg-gradient-to-br from-brand/20 to-brand-decorative/30" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <span className="h-6 rounded-sm border border-line bg-page lg:h-8" />
        <span className="h-6 rounded-sm border border-line bg-page lg:h-8" />
        <span className="h-6 rounded-sm border border-line bg-page lg:h-8" />
      </div>
    </div>
  );
}

function Frame({
  src,
  className,
  screen,
  priority = false,
  flip,
}: {
  src?: string;
  className: string;
  screen: string;
  priority?: boolean;
  flip?: boolean;
}) {
  return (
    <div className={cx("overflow-hidden rounded-xl border border-line bg-white shadow-lg", className)}>
      <div className="flex h-6 items-center border-b border-line bg-page px-2.5 lg:h-7">
        <Dots size={7} />
      </div>
      {src ? (
        <div className={cx("relative bg-page", screen)}>
          <img
            src={src}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className="absolute inset-0 size-full object-cover object-top"
          />
        </div>
      ) : (
        <Sketch className={screen} flip={flip} />
      )}
    </div>
  );
}

/**
 * Portfolio hero picture: three fanned browser frames with the latest project
 * pictures (sketches where there are fewer) and the project types.
 */
export function PortfolioHeroVisual({ images, types }: { images: string[]; types: string[] }) {
  return (
    <div aria-hidden="true" className="relative mx-auto h-[270px] w-full max-w-[540px] sm:h-[360px] lg:h-[420px]">
      <Frame
        src={images[1]}
        flip
        className="absolute top-0 right-0 w-[56%] rotate-[6deg]"
        screen="h-[130px] sm:h-[170px] lg:h-[200px]"
      />
      <Frame src={images[2]} className="absolute top-5 left-0 w-[56%] -rotate-[6deg] lg:top-8" screen="h-[130px] sm:h-[170px] lg:h-[200px]" />
      <Frame
        src={images[0]}
        priority
        className="absolute bottom-0 left-1/2 w-[78%] -translate-x-1/2 shadow-xl"
        screen="h-[160px] sm:h-[215px] lg:h-[250px]"
      />
      {types.length > 0 && (
        <div className="float-card float absolute -bottom-2 -right-2 hidden p-3.5 sm:block lg:-right-6" style={vars({ i: 1 })}>
          <ul className="flex flex-col gap-2">
            {types.slice(0, 3).map((type) => (
              <li key={type} className="flex items-center gap-2 text-xs leading-[1.7] font-semibold text-ink">
                <span className="size-2 rounded-full bg-gradient-to-l from-brand to-brand-decorative" />
                {type}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
