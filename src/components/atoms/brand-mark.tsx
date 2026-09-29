import Link from "next/link";
import Image from "next/image";

import { Icon } from "@/components/atoms/icon";
import { cx } from "@/lib/utils";

/** Uploaded brand image, with the original mark as the default. */
export function BrandMark({ name, logo, inverse = false, className }: { name: string; logo?: string; inverse?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cx(
        "group inline-flex shrink-0 items-center gap-2.5 text-xl leading-[1.6] font-bold no-underline lg:text-[22px]",
        inverse ? "text-white hover:text-white" : "text-ink hover:text-ink",
        className,
      )}
    >
      {logo ? (
        <span className="relative block h-10 w-32 lg:h-12 lg:w-36">
          <Image src={logo} alt={name} fill sizes="(min-width: 1024px) 144px, 128px" className="object-contain object-right" />
        </span>
      ) : (
        <>
          <span aria-hidden="true" className="icon-gradient size-9 rounded-[10px] transition-transform duration-500 group-hover:rotate-[-8deg]">
            <Icon name="search" size={19} strokeWidth={2.4} />
          </span>
          {name}
        </>
      )}
    </Link>
  );
}
