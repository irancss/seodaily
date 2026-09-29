import type { PricingService } from "./types";

export const pricingHref = (service: PricingService) => `/pricing/${service}`;
export const pricingPageKey = (service: PricingService): `pricing-${PricingService}` => `pricing-${service}`;
