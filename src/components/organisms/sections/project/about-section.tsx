import { stepNo } from "@/lib/utils";

type Props = {
  description: string;
  story: string[][];
};

export function ProjectAboutSection({ description, story }: Props) {
  return (
    <section className="section bg-white">
      <div className="container-site grid items-start gap-10 lg:grid-cols-[7fr_5fr] lg:gap-16">
        <div className="flex flex-col gap-4">
          <h2 className="t-h2">درباره پروژه</h2>
          {description.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="body-lg whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>
        {story.length > 0 && (
          <ol className="border-t border-line">
            {story.map(([title, body], i) => (
              <li key={title} className="grid grid-cols-[48px_minmax(0,1fr)] border-b border-line py-6">
                <span className="text-xl leading-[1.65] font-bold text-brand">{stepNo(i)}</span>
                <div>
                  <h3 className="t-h3">{title}</h3>
                  <p className="mt-2 text-base leading-[1.9] whitespace-pre-line text-ink-2">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
