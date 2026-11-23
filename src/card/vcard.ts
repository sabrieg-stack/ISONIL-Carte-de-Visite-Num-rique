import { ISONIL_CONTACT } from './constants';

/**
 * Escapes characters required by RFC 2426 / vCard 3.0 text values.
 */
function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n|\r/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/**
 * Generates an iOS (iPhone) and Android compatible UTF-8 vCard 3.0 payload
 * containing the official ISONIL contact details.
 */
export function buildIsonilVCard(): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N;CHARSET=UTF-8:Management;ISONIL;;;',
    'FN;CHARSET=UTF-8:ISONIL Management',
    `ORG;CHARSET=UTF-8:${escapeVCardText(ISONIL_CONTACT.company)}`,
    `TITLE;CHARSET=UTF-8:${escapeVCardText(ISONIL_CONTACT.officialActivityFr)}`,
    'TEL;TYPE=WORK,VOICE:+212710738409',
    'TEL;TYPE=CELL,VOICE:+212710738409',
    `EMAIL;TYPE=INTERNET,WORK:${ISONIL_CONTACT.email}`,
    `URL:${ISONIL_CONTACT.websiteUrl}`,
    `URL;TYPE=WORK:${ISONIL_CONTACT.companyProfileUrl}`,
    `URL;TYPE=WORK:${ISONIL_CONTACT.clientPortalUrl}`,
    `URL;TYPE=HOME:${ISONIL_CONTACT.cardCanonicalUrl}`,
    `X-SOCIALPROFILE;TYPE=linkedin:${ISONIL_CONTACT.socialLinks.linkedin}`,
    `ADR;TYPE=WORK;CHARSET=UTF-8:;;${escapeVCardText(ISONIL_CONTACT.addressStreet)};${escapeVCardText(ISONIL_CONTACT.addressCity)};;${escapeVCardText(ISONIL_CONTACT.addressPostalCode)};${escapeVCardText(ISONIL_CONTACT.addressCountry)}`,
    `NOTE;CHARSET=UTF-8:${escapeVCardText(`${ISONIL_CONTACT.company} - ${ISONIL_CONTACT.officialActivityFr} | Profil: ${ISONIL_CONTACT.companyProfileUrl} | Portail Clients: ${ISONIL_CONTACT.clientPortalUrl} | Carte: ${ISONIL_CONTACT.cardCanonicalUrl}`)}`,
    'END:VCARD',
    '',
  ];

  return lines.join('\r\n');
}

/**
 * Triggers a clean download of /contact.vcf compatible with Android and iPhone.
 */
export function downloadIsonilVCard(): void {
  const link = document.createElement('a');
  link.href = ISONIL_CONTACT.vcardPublicPath;
  link.download = ISONIL_CONTACT.vcardFilename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
