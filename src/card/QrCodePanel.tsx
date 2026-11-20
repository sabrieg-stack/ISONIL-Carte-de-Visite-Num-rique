import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, Maximize2, QrCode, X } from 'lucide-react';
import { ISONIL_CONTACT } from './constants';
import type { CardTranslation } from './translations';

interface QrCodePanelProps {
  t: CardTranslation;
  langAnimClass?: string;
  onNotify: (message: string) => void;
  onCopyUrl: () => void;
  urlCopied: boolean;
}

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

export function QrCodePanel({
  t,
  langAnimClass = '',
  onNotify,
  onCopyUrl,
  urlCopied,
}: QrCodePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Permanent QR code matrix — never mutates when language changes
  const qrMatrix = useMemo(() => buildPermanentQrMatrix(), []);

  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleDownloadPng = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await QRCode.toDataURL(ISONIL_CONTACT.cardCanonicalUrl, {
        width: 1024,
        margin: 4,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#0B192C',
          light: '#FFFFFF',
        },
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'ISONIL-Card-QR.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onNotify(t.toasts.qrDownloaded);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <section
        aria-labelledby="isonil-qr-heading"
        className="flex flex-col justify-between bg-[#0D1C31]/92 backdrop-blur-md rounded-2xl border border-[#79C8E8]/28 shadow-[0_24px_60px_-28px_rgba(2,8,18,0.82)] p-4 min-[390px]:p-5 sm:p-7 h-full min-w-0"
      >
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className={`min-w-0 ${langAnimClass}`}>
              <h2
                id="isonil-qr-heading"
                className="text-base sm:text-lg font-semibold text-white tracking-tight"
              >
                {t.sections.qrTitle}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#C5D0DC] leading-relaxed">
                {t.sections.qrSubtitle}
              </p>
            </div>
            <div
              aria-hidden="true"
              className="w-9 h-9 rounded-lg bg-[#163052] border border-[#79C8E8]/25 text-[#79C8E8] flex items-center justify-center shrink-0"
            >
              <QrCode className="w-5 h-5" />
            </div>
          </div>

          {/* Crisp scannable QR frame on pure white for maximum camera legibility */}
          <div className="mt-5 sm:mt-6 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              aria-label={`${t.actions.enlargeQr} — ${t.aria.qrCodeImage}`}
              className="isonil-qr-frame group relative w-full max-w-[204px] min-[390px]:max-w-[224px] sm:max-w-[248px] aspect-square bg-white rounded-xl border border-[#A9DDF1]/40 p-2.5 sm:p-3 shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8] cursor-pointer"
            >
              <div className="qr-svg-container w-full h-full">
                <svg
                  role="img"
                  aria-label={t.aria.qrCodeImage}
                  viewBox={`0 0 ${qrMatrix.viewBoxSize} ${qrMatrix.viewBoxSize}`}
                  xmlns="http://www.w3.org/2000/svg"
                  shapeRendering="crispEdges"
                >
                  <rect width={qrMatrix.viewBoxSize} height={qrMatrix.viewBoxSize} fill="#FFFFFF" />
                  <path d={qrMatrix.pathData} fill="#0B192C" />
                </svg>
              </div>
              <span className="sr-only">{t.actions.enlargeQr}</span>
            </button>

            {/* Permanent canonical link bar */}
            <div className={`mt-5 w-full pt-4 border-t border-[#C5D0DC]/15 ${langAnimClass}`}>
              <p className="text-xs font-medium text-[#9FB3C8]">{t.sections.permanentLinkLabel}</p>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={ISONIL_CONTACT.cardCanonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="ltr-isolate font-mono text-xs sm:text-[13px] font-medium text-[#A9DDF1] hover:text-white transition-colors break-all"
                >
                  {ISONIL_CONTACT.cardCanonicalUrl}
                </a>
                <button
                  type="button"
                  onClick={onCopyUrl}
                  aria-label={t.aria.copyCardUrl}
                  className="isonil-icon-btn min-h-[44px] min-w-[44px] px-2.5 rounded-lg text-xs font-medium text-[#79C8E8] hover:bg-[#163052] hover:text-white inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8] cursor-pointer"
                >
                  {urlCopied ? (
                    <>
                      <Check className="isonil-check-pop w-4 h-4 text-[#A9DDF1]" />
                      <span className="text-[#A9DDF1]">{t.actions.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t.actions.copyLink}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Utility actions for scanning & print */}
        <div className={`mt-5 pt-4 border-t border-[#C5D0DC]/15 grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 no-print ${langAnimClass}`}>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="isonil-btn min-h-[48px] px-3 py-2.5 rounded-xl border border-[#79C8E8]/25 hover:border-[#79C8E8]/50 bg-[#081322]/70 hover:bg-[#132946] text-white text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8] cursor-pointer"
          >
            <Maximize2 className="isonil-btn-icon w-4 h-4 text-[#79C8E8] shrink-0" />
            <span>{t.actions.enlargeQr}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isDownloading}
            className="isonil-btn min-h-[48px] px-3 py-2.5 rounded-xl border border-[#79C8E8]/25 hover:border-[#79C8E8]/50 bg-[#081322]/70 hover:bg-[#132946] text-white text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8] cursor-pointer"
          >
            <Download className="isonil-btn-icon w-4 h-4 text-[#79C8E8] shrink-0" />
            <span>{t.actions.downloadQr}</span>
          </button>
        </div>
      </section>

      {/* Fullscreen High-Contrast Scan Modal */}
      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="isonil-qr-modal-title"
          className="isonil-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-[#060E1A]/86 backdrop-blur-sm p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="isonil-dialog-enter w-full max-w-sm max-h-[92dvh] overflow-y-auto bg-[#0D1C31] rounded-2xl border border-[#79C8E8]/30 shadow-2xl p-5 sm:p-6 text-center text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3
                id="isonil-qr-modal-title"
                className="text-base font-semibold text-white text-start"
              >
                {t.qrModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                aria-label={t.actions.close}
                className="isonil-icon-btn min-h-[44px] min-w-[44px] -me-2 rounded-xl text-[#C5D0DC] hover:bg-[#163052] hover:text-white flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-1 text-sm text-[#C5D0DC] text-start">{t.qrModal.subtitle}</p>

            <div className="mt-4 sm:mt-5 mx-auto w-full max-w-[260px] sm:max-w-[280px] aspect-square bg-white rounded-xl border border-[#A9DDF1]/40 p-3 shadow-md">
              <div className="qr-svg-container w-full h-full">
                <svg
                  role="img"
                  aria-label={t.aria.qrCodeImage}
                  viewBox={`0 0 ${qrMatrix.viewBoxSize} ${qrMatrix.viewBoxSize}`}
                  xmlns="http://www.w3.org/2000/svg"
                  shapeRendering="crispEdges"
                >
                  <rect width={qrMatrix.viewBoxSize} height={qrMatrix.viewBoxSize} fill="#FFFFFF" />
                  <path d={qrMatrix.pathData} fill="#0B192C" />
                </svg>
              </div>
            </div>

            <div className="mt-4">
              <p dir="ltr" className="ltr-isolate font-mono text-xs font-medium text-[#A9DDF1] break-all">
                {ISONIL_CONTACT.cardCanonicalUrl}
              </p>
              <p className="mt-1.5 text-xs text-[#9FB3C8]">{t.qrModal.scanHint}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isDownloading}
                className="isonil-btn-primary min-h-[46px] px-3 py-2 rounded-xl bg-white hover:bg-[#EDF7FC] text-[#0B192C] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Download className="isonil-btn-icon w-4 h-4 shrink-0" />
                <span>{t.actions.downloadQr}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="isonil-btn min-h-[46px] px-3 py-2 rounded-xl border border-[#C5D0DC]/25 hover:border-[#79C8E8]/45 bg-[#0B192C]/60 hover:bg-[#163052] text-white text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer"
              >
                {t.actions.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
