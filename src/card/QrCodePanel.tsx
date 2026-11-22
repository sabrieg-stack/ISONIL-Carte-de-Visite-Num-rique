import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, Maximize2, QrCode, Share2, X } from 'lucide-react';
import { ISONIL_CONTACT } from './constants';
import type { CardTranslation } from './translations';

interface QrCodePanelProps {
  t: CardTranslation;
  langAnimClass?: string;
  onNotify: (message: string) => void;
  onCopyUrl: () => void;
  onShareCard?: () => void;
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
  onShareCard,
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
          dark: '#0C1217',
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
        className="flex flex-col justify-between bg-[#11181F]/95 backdrop-blur-md rounded-2xl border border-[#4CC3DB]/22 shadow-[0_24px_60px_-28px_rgba(3,6,9,0.88)] p-4 min-[390px]:p-5 sm:p-7 h-full min-w-0"
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
              <p className="mt-1 text-xs sm:text-sm text-[#D0D7DE] leading-relaxed">
                {t.sections.qrSubtitle}
              </p>
            </div>
            <div
              aria-hidden="true"
              className="w-9 h-9 rounded-lg bg-[#17222B] border border-[#4CC3DB]/28 text-[#4CC3DB] flex items-center justify-center shrink-0"
            >
              <QrCode className="w-5 h-5" />
            </div>
          </div>

          {/* Framed QR housing inspired by official PDF page 2: crisp white QR inside cyan-outlined obsidian frame */}
          <div className="mt-5 sm:mt-6 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              aria-label={`${t.actions.enlargeQr} — ${t.aria.qrCodeImage}`}
              className="isonil-qr-frame group relative w-full max-w-[216px] min-[390px]:max-w-[236px] sm:max-w-[260px] rounded-2xl bg-[#0C1217]/90 border border-[#4CC3DB]/55 p-3 sm:p-3.5 shadow-[0_14px_34px_-16px_rgba(76,195,219,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer"
            >
              <div className="w-full aspect-square bg-white rounded-xl p-2 shadow-xs">
                <div className="qr-svg-container w-full h-full">
                  <svg
                    role="img"
                    aria-label={t.aria.qrCodeImage}
                    viewBox={`0 0 ${qrMatrix.viewBoxSize} ${qrMatrix.viewBoxSize}`}
                    xmlns="http://www.w3.org/2000/svg"
                    shapeRendering="crispEdges"
                  >
                    <rect width={qrMatrix.viewBoxSize} height={qrMatrix.viewBoxSize} fill="#FFFFFF" />
                    <path d={qrMatrix.pathData} fill="#0C1217" />
                  </svg>
                </div>
              </div>
              <span className="sr-only">{t.actions.enlargeQr}</span>
            </button>

            {/* Permanent canonical link bar */}
            <div className={`mt-5 w-full pt-4 border-t border-[#D0D7DE]/14 ${langAnimClass}`}>
              <p className="text-xs font-medium text-[#9AA9B5]">{t.sections.permanentLinkLabel}</p>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={ISONIL_CONTACT.cardCanonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="ltr-isolate font-mono text-xs sm:text-[13px] font-medium text-[#5EC6DA] hover:text-white transition-colors break-all"
                >
                  {ISONIL_CONTACT.cardCanonicalUrl}
                </a>
                <button
                  type="button"
                  onClick={onCopyUrl}
                  aria-label={t.aria.copyCardUrl}
                  className="isonil-icon-btn min-h-[44px] min-w-[44px] px-2.5 rounded-lg text-xs font-medium text-[#4CC3DB] hover:bg-[#17222B] hover:text-white inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer"
                >
                  {urlCopied ? (
                    <>
                      <Check className="isonil-check-pop w-4 h-4 text-[#76D4E6]" />
                      <span className="text-[#76D4E6]">{t.actions.copied}</span>
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

        {/* Utility actions for scanning, download & mobile share */}
        <div className={`mt-5 pt-4 border-t border-[#D0D7DE]/14 grid grid-cols-2 gap-2.5 sm:gap-3 no-print ${langAnimClass}`}>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            aria-label={t.actions.enlargeQr}
            className="isonil-btn min-w-0 min-h-[48px] px-2.5 sm:px-3 py-2.5 rounded-xl border border-[#D0D7DE]/18 hover:border-[#4CC3DB]/48 bg-[#0C1217]/82 hover:bg-[#17222B] text-white text-[11px] min-[370px]:text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer"
          >
            <Maximize2 className="isonil-btn-icon w-4 h-4 text-[#4CC3DB] shrink-0" />
            <span className="truncate">{t.actions.enlargeQr}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isDownloading}
            aria-label={t.actions.downloadQr}
            className="isonil-btn min-w-0 min-h-[48px] px-2.5 sm:px-3 py-2.5 rounded-xl border border-[#D0D7DE]/18 hover:border-[#4CC3DB]/48 bg-[#0C1217]/82 hover:bg-[#17222B] text-white text-[11px] min-[370px]:text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer"
          >
            <Download className="isonil-btn-icon w-4 h-4 text-[#4CC3DB] shrink-0" />
            <span className="truncate">{t.actions.downloadQr}</span>
          </button>

          {onShareCard && (
            <button
              type="button"
              onClick={onShareCard}
              aria-label={t.aria.shareCardAction}
              className="lg:hidden col-span-2 isonil-btn w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#4CC3DB]/40 hover:border-[#4CC3DB]/70 active:border-[#4CC3DB]/75 bg-[#16242E] hover:bg-[#1D2F3C] active:bg-[#1D2F3C] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer"
            >
              <Share2 className="isonil-btn-icon w-4 h-4 text-[#76D4E6] shrink-0" />
              <span className="truncate">{t.actions.shareCard}</span>
            </button>
          )}
        </div>
      </section>

      {/* Fullscreen High-Contrast Scan Modal */}
      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="isonil-qr-modal-title"
          className="isonil-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-[#060A0D]/86 backdrop-blur-sm p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="isonil-dialog-enter w-full max-w-sm max-h-[92dvh] overflow-y-auto bg-[#11181F] rounded-2xl border border-[#4CC3DB]/35 shadow-2xl p-5 sm:p-6 text-center text-white"
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
                className="isonil-icon-btn min-h-[44px] min-w-[44px] -me-2 rounded-xl text-[#D0D7DE] hover:bg-[#17222B] hover:text-white flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-1 text-sm text-[#D0D7DE] text-start">{t.qrModal.subtitle}</p>

            <div className="mt-4 sm:mt-5 mx-auto w-full max-w-[268px] sm:max-w-[292px] rounded-2xl bg-[#0C1217] border border-[#4CC3DB]/55 p-3 shadow-md">
              <div className="w-full aspect-square bg-white rounded-xl p-2.5">
                <div className="qr-svg-container w-full h-full">
                  <svg
                    role="img"
                    aria-label={t.aria.qrCodeImage}
                    viewBox={`0 0 ${qrMatrix.viewBoxSize} ${qrMatrix.viewBoxSize}`}
                    xmlns="http://www.w3.org/2000/svg"
                    shapeRendering="crispEdges"
                  >
                    <rect width={qrMatrix.viewBoxSize} height={qrMatrix.viewBoxSize} fill="#FFFFFF" />
                    <path d={qrMatrix.pathData} fill="#0C1217" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p dir="ltr" className="ltr-isolate font-mono text-xs font-medium text-[#5EC6DA] break-all">
                {ISONIL_CONTACT.cardCanonicalUrl}
              </p>
              <p className="mt-1.5 text-xs text-[#9AA9B5]">{t.qrModal.scanHint}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isDownloading}
                className="isonil-btn-primary min-h-[46px] px-3 py-2 rounded-xl bg-white hover:bg-[#ECF8FA] text-[#0C1217] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Download className="isonil-btn-icon w-4 h-4 shrink-0" />
                <span>{t.actions.downloadQr}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="isonil-btn min-h-[46px] px-3 py-2 rounded-xl border border-[#D0D7DE]/18 hover:border-[#4CC3DB]/48 bg-[#0C1217]/82 hover:bg-[#17222B] text-white text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer"
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
