import {
  HomeCtaSection,
  HomeFaqSection,
  HomeHeroSection,
  HomeIndustriesSection,
  HomeMarqueeSection,
  HomePortfolioSection,
  HomeProcessSection,
  HomeServicesIntroSection,
  HomeWhyUsSection,
} from "@/components/organisms/sections/home";
import { getFaqs } from "@/modules/faqs/queries";
import { getPublishedProjects } from "@/modules/projects/queries";
import { faqJsonLd, pageMetadata } from "@/modules/seo/metadata";
import { COLLAB_PROCESS } from "@/modules/services/content";
import { getCategories, getServicesByCategory } from "@/modules/services/queries";
import { getContact, getGeneral, getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("home", "/");
}

export default async function HomePage() {
  const [text, general, contact, categories, webServices, seoServices, projects, faqs] = await Promise.all([
    getPageText("home"),
    getGeneral(),
    getContact(),
    getCategories(),
    getServicesByCategory("web-design"),
    getServicesByCategory("seo"),
    getPublishedProjects(),
    getFaqs("home"),
  ]);
  const services = {
    "web-design": webServices.slice(0, 5),
    seo: seoServices.slice(0, 5),
  };
  const featured = projects.slice(0, 3);
  const heroImage = projects.find((p) => p.imageUrl)?.imageUrl;
  const allServices = [...webServices, ...seoServices];
  // Only numbers that follow from the site's own content.
  const stats = [
    { value: allServices.length, label: "خدمت تخصصی طراحی سایت و سئو" },
    { value: general.industries.length, label: "حوزه کسب‌وکاری که پوشش می‌دهیم" },
    { value: COLLAB_PROCESS.length, label: "مرحله شفاف در مسیر همکاری" },
    { value: 100, suffix: "٪", label: "طراحی ریسپانسیو برای موبایل" },
  ].filter((s) => s.value > 0);

  return (
    <>
      <HomeHeroSection
        text={text}
        heroImage={heroImage}
        audiences={general.industries.map((i) => i.title)}
        phone={contact.phone}
      />
      <HomeMarqueeSection items={allServices.map((s) => s.title)} />
      <HomeServicesIntroSection categories={categories} services={services} />
      <HomeWhyUsSection stats={stats} />
      {featured.length > 0 && <HomePortfolioSection projects={featured} />}
      <HomeProcessSection />
      {general.industries.length > 0 && <HomeIndustriesSection industries={general.industries} />}
      {faqs.length > 0 && <HomeFaqSection faqs={faqs} jsonLd={faqJsonLd(faqs)} phone={contact.phone} />}
      <HomeCtaSection text={text} />
    </>
  );
}
