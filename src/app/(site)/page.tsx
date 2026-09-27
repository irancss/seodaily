import {
  HomeCtaSection,
  HomeFaqSection,
  HomeHeroSection,
  HomeIndustriesSection,
  HomePortfolioSection,
  HomeProcessSection,
  HomeServicesIntroSection,
  HomeWhyUsSection,
} from "@/components/organisms/sections/home";
import { getFaqs } from "@/modules/faqs/queries";
import { getPublishedProjects } from "@/modules/projects/queries";
import { faqJsonLd, pageMetadata } from "@/modules/seo/metadata";
import { getCategories, getServicesByCategory } from "@/modules/services/queries";
import { getGeneral, getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("home", "/");
}

export default async function HomePage() {
  const [text, general, categories, webServices, seoServices, projects, faqs] = await Promise.all([
    getPageText("home"),
    getGeneral(),
    getCategories(),
    getServicesByCategory("web-design"),
    getServicesByCategory("seo"),
    getPublishedProjects(),
    getFaqs("home"),
  ]);
  const tags: Record<string, string[]> = {
    "web-design": webServices.slice(0, 4).map((s) => s.title),
    seo: seoServices.slice(0, 4).map((s) => s.title),
  };
  const featured = projects.slice(0, 3);
  const heroImage = projects.find((p) => p.imageUrl)?.imageUrl;

  return (
    <>
      <HomeHeroSection text={text} heroImage={heroImage} />
      <HomeServicesIntroSection categories={categories} tags={tags} />
      <HomeWhyUsSection />
      {featured.length > 0 && <HomePortfolioSection projects={featured} />}
      <HomeProcessSection />
      {general.industries.length > 0 && <HomeIndustriesSection industries={general.industries} />}
      {faqs.length > 0 && <HomeFaqSection faqs={faqs} jsonLd={faqJsonLd(faqs)} />}
      <HomeCtaSection text={text} />
    </>
  );
}
