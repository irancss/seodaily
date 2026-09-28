import Image from "next/image";

import { Icon } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import type { TeamMember } from "@/db/schema";
import { vars } from "@/lib/utils";

type Props = {
  team: TeamMember[];
};

/** Team members; the section is left out entirely until real members are added in the admin. */
export function AboutTeamSection({ team }: Props) {
  if (team.length === 0) return null;
  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading eyebrow="تیم" title="تیم *سئو دیلی*" text="افرادی که پروژه‌ها را طراحی، اجرا و پیگیری می‌کنند." />
        {team.length > 0 && (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
            {team.map((m, i) => (
              <li key={m.id} className="reveal" style={vars({ i: i % 3 })}>
                <div className="card-fancy flex h-full flex-col items-start rounded-xl p-6 lg:p-8">
                  <span className="rounded-[22px] bg-gradient-to-br from-brand to-brand-decorative p-[3px] shadow-brand">
                    {m.photoUrl ? (
                      <Image src={m.photoUrl} alt={m.name} width={80} height={80} className="size-20 rounded-[19px] border-2 border-white object-cover" />
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
        )}
      </div>
    </section>
  );
}
