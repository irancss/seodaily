// Navigation menus, editable in the admin panel. Safe to import anywhere.

export type MenuItem = {
  id: string;
  label: string;
  /** Empty for a label that only groups children. */
  url: string;
  newTab?: boolean;
  children: MenuItem[];
};

export const MENU_LOCATIONS = ["desktop", "mobile"] as const;
export type MenuLocation = (typeof MENU_LOCATIONS)[number];
export type Menus = Record<MenuLocation, MenuItem[]>;

export const MENU_LOCATION_LABELS: Record<MenuLocation, string> = {
  desktop: "منوی دسکتاپ",
  mobile: "منوی موبایل",
};

/** Top level + two nested levels. */
export const MENU_MAX_DEPTH = 3;
export const MENU_MAX_ITEMS = 80;
export const MENU_LABEL_MAX = 60;
