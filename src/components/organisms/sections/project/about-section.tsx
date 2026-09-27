import { Icon, IconTile, type IconName } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { cx, stepNo, vars } from "@/lib/utils";

type Props = {
  description: string;
  /** [title, body] pairs: مسئله / راهکار / نتیجه, empty ones already removed. */
  story: string[][];
};

const STORY_ICONS: Record<string, IconName> = { مسئله: "alert", راهکار: "sparkle", نتیجه: "trending-up" };

export function ProjectAboutSection({ description, story }: Props) {
  const paragraphs = description ? description.split(/\n{2,}/) : [];

  return (
    <section className="section bg-white">
      <div className="container-site">
        <div className={cx("grid items-start gap-6 lg:gap-16", paragraphs.length > 0 && "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]")}>
          <SectionHeading align="stack" eyebrow="جزئیات پروژه" title="درباره *پروژه*" />
          {paragraphs.length > 0 && (
            <div className="reveal flex flex-col gap-4 lg:pt-2">
              {paragraphs.map((para, i) => (
                <p key={i} className="body-lg whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>

        {story.length > 0 && (
          <ol
            className={cx(
              "mt-10 grid gap-4 lg:mt-14 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))] lg:gap-6",
              story.length === 1 && "lg:max-w-[640px]",
            )}
            style={vars({ cols: story.length })}
          >
            {story.map(([title, body], i) => {
              // The outcome is the emphasised card.
              const result = title === "نتیجه";
              return (
                <li key={title} className="reveal relative" style={vars({ i })}>
                  <div
                    className={cx(
                      "flex h-full flex-col rounded-xl p-6 lg:p-8",
                      result ? "surface-dark overflow-hidden shadow-lg" : "card-fancy",
                    )}
                  >
                    {result && (
                      <>
                        <div
                          aria-hidden="true"
                          className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10"
                          style={vars({ grid: "28px" })}
                        />
                        <span aria-hidden="true" className="orb orb-blue -top-32 -left-20 size-[320px]" />
                        <span aria-hidden="true" className="orb orb-cyan -right-24 -bottom-36 size-[300px]" style={vars({ i: 1 })} />
                      </>
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <IconTile
                        name={STORY_ICONS[title] ?? "check-circle"}
                        tone={result ? "gradient" : "soft"}
                        className="size-12 rounded-[14px] lg:size-14"
                        iconSize={24}
                      />
                      <span
                        aria-hidden="true"
                        className={cx("text-3xl leading-none font-bold", result ? "text-white/20" : "text-line-strong")}
                      >
                        {stepNo(i)}
                      </span>
                    </div>
                    <h3 className="t-h3 mt-5 lg:mt-6">{title}</h3>
                    <p className={cx("mt-2 text-base leading-[1.9] whitespace-pre-line", result ? "text-inverse-muted" : "text-ink-2")}>
                      {body}
                    </p>
                  </div>
                  {i < story.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 -left-[30px] z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-brand shadow-sm lg:flex"
                    >
                      <Icon name="arrow-left" size={16} />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
