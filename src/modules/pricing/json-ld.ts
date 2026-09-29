import { PRICING_SERVICE_LABELS, PRICING_SERVICES, type PricingConfig, type PricingService } from "./types";
import { pricingHref } from "./routes";

/**
 * schema.org Service entries with an OfferCatalog of their priced plans
 * (prices converted to rials, the ISO currency). Plans without a price and
 * services without priced plans are left out; null when nothing is priced.
 */
export function pricingJsonLd(pricing: PricingConfig, base: string, visibleServices: readonly PricingService[] = PRICING_SERVICES) {
  const services = visibleServices.flatMap((service) => {
    const label = PRICING_SERVICE_LABELS[service];
    const offers = pricing[service].plans
      .filter((plan) => plan.price > 0)
      .map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        ...(plan.description ? { description: plan.description } : {}),
        price: plan.price * 10,
        priceCurrency: "IRR",
        ...(plan.period
          ? { priceSpecification: { "@type": "UnitPriceSpecification", price: plan.price * 10, priceCurrency: "IRR", unitText: plan.period } }
          : {}),
      }));
    if (offers.length === 0) return [];
    return [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: label,
        url: `${base}${pricingHref(service)}`,
        provider: { "@id": `${base}/#organization` },
        hasOfferCatalog: { "@type": "OfferCatalog", name: `تعرفه ${label}`, itemListElement: offers },
      },
    ];
  });
  return services.length > 0 ? services : null;
}
