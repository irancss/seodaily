import { JsonLd } from "@/components/atoms";
import { ContactFormSection, ContactHeroSection } from "@/components/organisms/sections/contact";
import { SERVICE_CHOICES } from "@/db/schema";
import { plainText } from "@/lib/utils";
import { breadcrumbJsonLd, getSiteUrl, pageMetadata } from "@/modules/seo/metadata";
import { getContact, getGeneral, getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("contact", "/contact");
}

type Props = { searchParams: Promise<{ service?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const [{ service }, text, general, contact, base] = await Promise.all([
    searchParams,
    getPageText("contact"),
    getGeneral(),
    getContact(),
    getSiteUrl(),
  ]);
  const defaultService = SERVICE_CHOICES.find((s) => s === service);

  return (
    <>
      {/* 01 · hero */}
      <ContactHeroSection text={text} phone={contact.phone} />

      {/* 02 · form + side column (direct contact, next steps) */}
      <ContactFormSection budgets={general.budgets} defaultService={defaultService} text={text} contact={contact} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: plainText(text.title),
          url: `${base}/contact`,
          about: { "@id": `${base}/#organization` },
        }}
      />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "تماس با ما", path: "/contact" },
        ])}
      />
    </>
  );
}
