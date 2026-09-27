import { Icon, IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import type { TeamMember } from "@/db/schema";
import { vars } from "@/lib/utils";

type Props = {
  team: TeamMember[];
};

export function AboutTeamSection({ team }: Props) {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading eyebrow="تیم" title="تیم *سئو دیلی*" text="افرادی که پروژه‌ها را طراحی، اجرا و پیگیری می‌کنند." />
        {team.length > 0 ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
            {team.map((m, i) => (
              <li key={m.id} className="reveal" style={vars({ i: i % 3 })}>
                <div className="card-fancy flex h-full flex-col items-start rounded-xl p-6 lg:p-8">
                  <span className="rounded-[22px] bg-gradient-to-br from-brand to-brand-decorative p-[3px] shadow-brand">
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt={m.name} loading="lazy" className="size-20 rounded-[19px] border-2 border-white object-cover" />
                    ) : (
                      <span aria-hidden="true" className="flex size-20 items-center justify-center rounded-[19px] border-2 border-white bg-soft text-brand">
                        <Icon name="team" size={32} />
                      </span>
                    )}
                  </span>
                  <h3 className="t-h3 mt-5">{m.name}</h3>
                  {m.role && <p className="mt-1 text-sm leading-[1.7] font-semibold text-brand-hover">{m.role}</p>}
                  {m.bio && <p className="mt-3 text-sm leading-[1.9] text-ink-2">{m.bio}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="reveal mt-8 flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-line-strong bg-page px-6 py-10 text-center lg:mt-14 lg:min-h-60">
            <IconTile name="team" tone="gradient" className="size-14 rounded-2xl lg:size-16" iconSize={28} />
            <p className="text-base leading-[1.9] text-ink-2">اطلاعات تیم پس از تأیید اضافه می‌شود.</p>
          </div>
        )}
      </div>
    </section>
  );
}
