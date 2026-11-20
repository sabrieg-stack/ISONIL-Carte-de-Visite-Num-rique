export type CardLanguage = 'fr' | 'en' | 'ar';

export const DEFAULT_LANGUAGE: CardLanguage = 'fr';
export const STORAGE_LANG_KEY = 'isonil_card_lang';
export const STORAGE_FAVORITE_KEY = 'isonil_card_favorite';

export const ISONIL_CONTACT = {
  company: 'ISONIL',
  officialActivityFr: "Solutions d'Isolation Thermique et Industrielle",
  phoneDisplay: '+212 710 738 409',
  phoneHref: 'tel:+212710738409',
  whatsappHref: 'https://wa.me/212710738409',
  email: 'contact@isonil.com',
  emailHref: 'mailto:contact@isonil.com',
  websiteUrl: 'https://www.isonil.com',
  websiteDisplay: 'www.isonil.com',
  cardCanonicalUrl: 'https://carte.isonil.com/',
  address: "3ème étage, Bureau N° 24, Centre Andalousie (Près D'Acidal), El Jadida 24000, Maroc",
  addressStreet: "3ème étage, Bureau N° 24, Centre Andalousie (Près D'Acidal)",
  addressCity: 'El Jadida',
  addressPostalCode: '24000',
  addressCountry: 'Maroc',
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=3%C3%A8me%20%C3%A9tage%2C%20Bureau%20N%C2%B0%2024%2C%20Centre%20Andalousie%20(Pr%C3%A8s%20D'Acidal)%2C%20El%20Jadida%2024000%2C%20Maroc",
  logoSrc: '/assets/isonil-logo-transparent.png',
  logoWebpSrc: '/assets/isonil-logo-transparent.webp',
  vcardFilename: 'ISONIL-Management.vcf',
} as const;
