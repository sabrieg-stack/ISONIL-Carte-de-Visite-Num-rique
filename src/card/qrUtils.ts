import QRCode from 'qrcode';
import { ISONIL_CONTACT } from './constants';

export interface QrSvgMatrix {
  viewBoxSize: number;
  pathData: string;
}

/**
 * Computes a deterministic, high-error-correction (Level H) SVG vector path
 * encoding the permanent canonical URL: https://carte.isonil.com/.
 * This value is completely independent of UI language or temporary host URLs.
 */
export function buildPermanentQrMatrix(): QrSvgMatrix {
  const qr = QRCode.create(ISONIL_CONTACT.cardCanonicalUrl, {
    errorCorrectionLevel: 'H',
  });
  const quietZone = 4;
  const moduleCount = qr.modules.size;
  const viewBoxSize = moduleCount + quietZone * 2;

  const segments: string[] = [];
  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (qr.modules.get(row, col)) {
        const x = col + quietZone;
        const y = row + quietZone;
        segments.push(`M${x} ${y}h1v1h-1z`);
      }
    }
  }

  return {
    viewBoxSize,
    pathData: segments.join(''),
  };
}

function triggerFileDownload(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  link.className = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Renders the permanent canonical QR code to a transparent 1024x1024 PNG Blob
 * and triggers an in-memory download compatible with desktop & mobile Safari.
 */
export async function downloadPermanentQrPng(filename: string): Promise<void> {
  const qrOptions = {
    width: 1024,
    margin: 4,
    errorCorrectionLevel: 'H' as const,
    color: {
      dark: '#45C4DC',
      light: '#00000000',
    },
  };

  if (
    typeof document !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  ) {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, ISONIL_CONTACT.cardCanonicalUrl, qrOptions);

    const blob = await new Promise<Blob | null>((resolve) => {
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob((result) => resolve(result), 'image/png');
      } else {
        resolve(null);
      }
    });

    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      try {
        triggerFileDownload(objectUrl, filename);
        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 60_000);
        return;
      } catch {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }

  const dataUrl = await QRCode.toDataURL(ISONIL_CONTACT.cardCanonicalUrl, qrOptions);
  triggerFileDownload(dataUrl, filename);
}
