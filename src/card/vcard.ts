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
    `X-SOCIALPROFILE;TYPE=facebook:${ISONIL_CONTACT.socialLinks.facebook}`,
    `X-SOCIALPROFILE;TYPE=instagram:${ISONIL_CONTACT.socialLinks.instagram}`,
    'X-ABShowAs:COMPANY',
    `ADR;TYPE=WORK;CHARSET=UTF-8:;;${escapeVCardText(ISONIL_CONTACT.addressStreet)};${escapeVCardText(ISONIL_CONTACT.addressCity)};;${escapeVCardText(ISONIL_CONTACT.addressPostalCode)};${escapeVCardText(ISONIL_CONTACT.addressCountry)}`,
    `NOTE;CHARSET=UTF-8:${escapeVCardText(`${ISONIL_CONTACT.company} - ${ISONIL_CONTACT.officialActivityFr} | Profil: ${ISONIL_CONTACT.companyProfileUrl} | Portail Clients: ${ISONIL_CONTACT.clientPortalUrl} | Carte: ${ISONIL_CONTACT.cardCanonicalUrl}`)}`,
    'END:VCARD',
    '',
  ];

  return lines.join('\r\n');
}

/**
 * Triggers a clean, 100% client-side vCard (.vcf) download compatible with
 * iPhone (iOS Safari), Android, and desktop browsers without making a
 * cookie-sensitive HTTP request to the server.
 */
export function downloadIsonilVCard(): void {
  const vcardContent = buildIsonilVCard();
  const filename = ISONIL_CONTACT.vcardFilename;

  if (
    typeof Blob !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  ) {
    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    if ('download' in link) {
      link.href = objectUrl;
      link.download = filename;
      link.rel = 'noopener noreferrer';
      link.className = 'hidden';
      try {
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 60_000);
        return;
      } catch {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }
    }

    URL.revokeObjectURL(objectUrl);
  }

  // Fallback for legacy iOS/Safari WebViews without anchor `download` support
  const dataUrl = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcardContent)}`;
  window.location.assign(dataUrl);
}
