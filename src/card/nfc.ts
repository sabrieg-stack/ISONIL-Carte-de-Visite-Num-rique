import { ISONIL_CONTACT } from './constants';
import { buildIsonilVCard } from './vcard';

export interface NdefUriMetrics {
  url: string;
  uriPrefixCode: number;
  uriPrefixLabel: string;
  ndefRecordBytes: number;
  totalTlvBytes: number;
  ntag213UsableBytes: number;
  ntag213NdefCapacityBytes: number;
  ntag215UsableBytes: number;
  ntag215NdefCapacityBytes: number;
  fitsNtag213: boolean;
  fitsNtag215: boolean;
}

export interface NfcReadinessReport {
  isReady: boolean;
  checks: {
    permanentHttpsUrl: boolean;
    ntagMemoryCompatible: boolean;
    qrLinkSynced: boolean;
    vcardComplete: boolean;
  };
  metrics: NdefUriMetrics;
}

/**
 * Calculates the real NFC Forum Well-Known URI Record (RTD "U") byte size
 * including NDEF header and Type 2 Tag TLV framing (0x03 <len> ... 0xFE)
 * for NTAG213 (144 bytes user memory / 137 bytes NDEF) and NTAG215 (504 bytes / 492 bytes NDEF).
 */
export function calculateNdefUriMetrics(url: string): NdefUriMetrics {
  let uriPrefixCode = 0x00;
  let uriPrefixLabel = 'none';
  let remainder = url;

  if (url.startsWith('https://www.')) {
    uriPrefixCode = 0x02;
    uriPrefixLabel = '0x02 (https://www.)';
    remainder = url.slice('https://www.'.length);
  } else if (url.startsWith('https://')) {
    uriPrefixCode = 0x04;
    uriPrefixLabel = '0x04 (https://)';
    remainder = url.slice('https://'.length);
  } else if (url.startsWith('http://www.')) {
    uriPrefixCode = 0x01;
    uriPrefixLabel = '0x01 (http://www.)';
    remainder = url.slice('http://www.'.length);
  } else if (url.startsWith('http://')) {
    uriPrefixCode = 0x03;
    uriPrefixLabel = '0x03 (http://)';
    remainder = url.slice('http://'.length);
  }

  const encoder = new TextEncoder();
  const payloadBytes = 1 + encoder.encode(remainder).length; // 1 byte prefix code + URI suffix
  // Short NDEF Record (payload < 256): 1 byte flags + 1 byte type len + 1 byte payload len + 1 byte type ('U')
  const headerBytes = payloadBytes < 256 ? 4 : 7;
  const ndefRecordBytes = headerBytes + payloadBytes;
  // Type 2 Tag TLV wrapper: 0x03 + length (1 byte if <255 else 3 bytes) + NDEF message + 0xFE terminator
  const tlvOverheadBytes = ndefRecordBytes < 255 ? 3 : 5;
  const totalTlvBytes = ndefRecordBytes + tlvOverheadBytes;

  const ntag213UsableBytes = 144;
  const ntag213NdefCapacityBytes = 137;
  const ntag215UsableBytes = 504;
  const ntag215NdefCapacityBytes = 492;

  return {
    url,
    uriPrefixCode,
    uriPrefixLabel,
    ndefRecordBytes,
    totalTlvBytes,
    ntag213UsableBytes,
    ntag213NdefCapacityBytes,
    ntag215UsableBytes,
    ntag215NdefCapacityBytes,
    fitsNtag213: totalTlvBytes <= ntag213NdefCapacityBytes,
    fitsNtag215: totalTlvBytes <= ntag215NdefCapacityBytes,
  };
}

/**
 * Evaluates actual NFC programming readiness for the ISONIL Digital Business Card.
 */
export function evaluateNfcReadiness(): NfcReadinessReport {
  const canonicalUrl = ISONIL_CONTACT.cardCanonicalUrl;
  const metrics = calculateNdefUriMetrics(canonicalUrl);

  let permanentHttpsUrl = false;
  try {
    const parsed = new URL(canonicalUrl);
    permanentHttpsUrl =
      parsed.protocol === 'https:' &&
      parsed.hostname.length > 0 &&
      !parsed.hostname.includes('localhost') &&
      !parsed.hostname.startsWith('127.');
  } catch {
    permanentHttpsUrl = false;
  }

  const ntagMemoryCompatible = metrics.fitsNtag213 && metrics.fitsNtag215;

  // QR code in QrCodePanel and NfcSettingsModal both encode ISONIL_CONTACT.cardCanonicalUrl directly
  const qrLinkSynced = permanentHttpsUrl && canonicalUrl === 'https://carte.isonil.com/';

  const vcard = buildIsonilVCard();
  const vcardComplete =
    vcard.includes('BEGIN:VCARD') &&
    vcard.includes('VERSION:3.0') &&
    vcard.includes(`ORG;CHARSET=UTF-8:${ISONIL_CONTACT.company}`) &&
    vcard.includes('FN;CHARSET=UTF-8:ISONIL Management') &&
    vcard.includes('TEL;TYPE=WORK,VOICE:+212710738409') &&
    vcard.includes(`EMAIL;TYPE=INTERNET,WORK:${ISONIL_CONTACT.email}`) &&
    vcard.includes(`URL:${ISONIL_CONTACT.websiteUrl}`) &&
    vcard.includes('ADR;TYPE=WORK;CHARSET=UTF-8:') &&
    vcard.includes('END:VCARD');

  const isReady =
    permanentHttpsUrl && ntagMemoryCompatible && qrLinkSynced && vcardComplete;

  return {
    isReady,
    checks: {
      permanentHttpsUrl,
      ntagMemoryCompatible,
      qrLinkSynced,
      vcardComplete,
    },
    metrics,
  };
}
