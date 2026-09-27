import { Icon } from "@/components/atoms";
import type { TeamMember } from "@/db/schema";

type Props = {
  team: TeamMember[];
};

export function AboutTeamSection({ team }: Props) {
  return (
    <section className="section">
      <div className="container-site grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-24">
        <div className="flex flex-col gap-2 lg:gap-3">
          <h2 className="t-h2">تیم سئو دیلی</h2>
          <p className="text-sm leading-[1.8] text-muted lg:text-base lg:leading-[1.9]">افرادی که پروژه‌ها را طراحی، اجرا و پیگیری می‌کنند.</p>
        </div>
        {team.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <li key={m.id} className="flex flex-col rounded-xl border border-line bg-white p-6">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt={m.name} loading="lazy" className="size-20 rounded-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="flex size-20 items-center justify-center rounded-full bg-soft text-brand">
                    <Icon name="team" size={32} />
                  </span>
                )}
                <h3 className="t-h3 mt-4">{m.name}</h3>
                {m.role && <p className="text-sm leading-[1.7] font-medium text-brand-hover">{m.role}</p>}
                {m.bio && <p className="mt-2 text-sm leading-[1.8] text-ink-2">{m.bio}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-line-strong bg-white px-6 py-8 text-center lg:min-h-60 lg:p-10">
            <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-soft text-brand lg:size-16">
              <Icon name="team" size={28} />
            </span>
            <p className="text-base leading-[1.9] text-ink-2">اطلاعات تیم پس از تأیید اضافه می‌شود.</p>
          </div>
        )}
      </div>
    </section>
  );
}
