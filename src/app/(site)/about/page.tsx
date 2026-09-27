import { JsonLd } from "@/components/atoms";
import {
  AboutCtaSection,
  AboutHeroSection,
  AboutMethodSection,
  AboutPhilosophySection,
  AboutPrinciplesSection,
  AboutTeamSection,
} from "@/components/organisms/sections/about";
import { plainText } from "@/lib/utils";
import { breadcrumbJsonLd, getSiteUrl, pageMetadata } from "@/modules/seo/metadata";
import { getPageText } from "@/modules/settings/queries";
import { getTeam } from "@/modules/team/queries";

export function generateMetadata() {
  return pageMetadata("about", "/about");
}

export default async function AboutPage() {
  const [text, team, base] = await Promise.all([getPageText("about"), getTeam(), getSiteUrl()]);

  return (
    <>
      {/* 01 · hero */}
      <AboutHeroSection text={text} />

      {/* 02 · philosophy */}
      <AboutPhilosophySection />

      {/* 03 · principles */}
      <AboutPrinciplesSection />

      {/* 04 · method */}
      <AboutMethodSection />

      {/* 05 · team */}
      <AboutTeamSection team={team} />

      {/* 06 · cta */}
      <AboutCtaSection text={text} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: plainText(text.title),
          url: `${base}/about`,
          about: { "@id": `${base}/#organization` },
        }}
      />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "درباره ما", path: "/about" },
        ])}
      />
    </>
  );
}
