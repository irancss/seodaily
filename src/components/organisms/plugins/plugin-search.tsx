import { Icon } from "@/components/atoms";
import { cx } from "@/lib/utils";

/** Plain GET form: works without JavaScript and gives shareable result URLs. */
export function PluginSearch({ defaultValue = "", dark = false, className }: { defaultValue?: string; dark?: boolean; className?: string }) {
  return (
    <form action="/plugins" method="get" role="search" className={cx("flex w-full max-w-[640px] gap-2", className)}>
      <label htmlFor="plugin-search" className="sr-only">
        جست‌وجوی افزونه
      </label>
      <input
        id="plugin-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        maxLength={80}
        placeholder="نام افزونه را بنویسید…"
        className={cx("field h-12 min-w-0 flex-1", dark && "border-white/20 bg-white text-ink")}
      />
      <button type="submit" className="btn btn-primary h-12 shrink-0 gap-2 px-5">
        <Icon name="search" size={18} />
        جست‌وجو
      </button>
    </form>
  );
}
