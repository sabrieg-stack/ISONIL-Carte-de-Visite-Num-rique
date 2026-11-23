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
  websiteUrl: 'https://isonil.com/',
  websiteDisplay: 'isonil.com',
  cardCanonicalUrl: 'https://carte.isonil.com/',
  address: "3ème étage, Bureau N° 24, Centre Andalousie (Près D'Acidal), El Jadida 24000, Maroc",
  addressStreet: "3ème étage, Bureau N° 24, Centre Andalousie (Près D'Acidal)",
  addressCity: 'El Jadida',
  addressPostalCode: '24000',
  addressCountry: 'Maroc',
  mapsHref: 'https://www.google.com/maps/search/?api=1&query=33.2374681%2C-8.5084362',
  logoSrc: '/assets/isonil-logo-transparent.png',
  logoWebpSrc: '/assets/isonil-logo-transparent.webp',
  vcardFilename: 'ISONIL-Management.vcf',
  vcardPublicPath: '/contact.vcf',
  companyProfileUrl: 'https://profile.isonil.com/',
  clientPortalUrl: 'https://portal.isonil.com/',
  clientPortalDisplay: 'portal.isonil.com',
  // Replace with exact company social page URLs
  socialLinks: {
    linkedin: 'https://www.linkedin.com/company/isonil',
    facebook: 'https://www.facebook.com/isonil',
    instagram: 'https://www.instagram.com/isonil',
  },
} as const;
