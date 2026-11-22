import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, Maximize2, Share2, X } from 'lucide-react';
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
        className="flex flex-col justify-between bg-[#111920] rounded-2xl border border-[#CBD5E1]/16 shadow-[0_20px_50px_-16px_rgba(3,7,11,0.75),inset_0_1px_0_rgba(226,234,240,0.08)] p-4 min-[390px]:p-5 sm:p-7 h-full min-w-0"
      >
        <div>
          <div className={`min-w-0 ${langAnimClass}`}>
            <h2
              id="isonil-qr-heading"
              className="text-base sm:text-lg font-semibold text-white tracking-tight"
            >
              {t.sections.qrTitle}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#D5DEE5] leading-relaxed">
              {t.sections.qrSubtitle}
            </p>
          </div>

          {/* Clean single-frame scannable QR container */}
          <div className="mt-5 sm:mt-6 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              aria-label={`${t.actions.enlargeQr} — ${t.aria.qrCodeImage}`}
              className="isonil-qr-frame group relative w-full max-w-[208px] min-[390px]:max-w-[224px] sm:max-w-[244px] rounded-xl bg-white p-3 sm:p-3.5 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer"
            >
              <div className="w-full aspect-square">
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
            <div className={`mt-5 w-full pt-4 border-t border-[#CBD5E1]/12 ${langAnimClass}`}>
              <p className="text-xs font-medium text-[#96A7B4]">{t.sections.permanentLinkLabel}</p>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={ISONIL_CONTACT.cardCanonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="ltr-isolate font-mono text-xs sm:text-[13px] font-medium text-[#5AD4EA] hover:text-white transition-colors break-all"
                >
                  {ISONIL_CONTACT.cardCanonicalUrl}
                </a>
                <button
                  type="button"
                  onClick={onCopyUrl}
                  aria-label={t.aria.copyCardUrl}
                  className="isonil-icon-btn min-h-[44px] min-w-[44px] px-2.5 rounded-lg text-xs font-medium text-[#5AD4EA] hover:bg-[#162630] hover:text-white inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer"
                >
                  {urlCopied ? (
                    <>
                      <Check className="isonil-check-pop w-4 h-4 text-[#6AD8EB]" />
                      <span className="text-[#6AD8EB]">{t.actions.copied}</span>
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
        <div className={`mt-5 pt-4 border-t border-[#CBD5E1]/12 grid grid-cols-2 gap-2.5 sm:gap-3 no-print ${langAnimClass}`}>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            aria-label={t.actions.enlargeQr}
            className="isonil-btn min-w-0 min-h-[48px] px-2.5 sm:px-3 py-2.5 rounded-xl border border-[#CBD5E1]/14 hover:border-[#3DC4DC]/50 bg-[#0D141A] hover:bg-[#14222B] text-white/95 text-[11px] min-[370px]:text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer"
          >
            <Maximize2 className="isonil-btn-icon w-4 h-4 text-[#3DC4DC] shrink-0" />
            <span className="truncate">{t.actions.enlargeQr}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isDownloading}
            aria-label={t.actions.downloadQr}
            className="isonil-btn min-w-0 min-h-[48px] px-2.5 sm:px-3 py-2.5 rounded-xl border border-[#CBD5E1]/14 hover:border-[#3DC4DC]/50 bg-[#0D141A] hover:bg-[#14222B] text-white/95 text-[11px] min-[370px]:text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer"
          >
            <Download className="isonil-btn-icon w-4 h-4 text-[#3DC4DC] shrink-0" />
            <span className="truncate">{t.actions.downloadQr}</span>
          </button>

          {onShareCard && (
            <button
              type="button"
              onClick={onShareCard}
              aria-label={t.aria.shareCardAction}
              className="lg:hidden col-span-2 isonil-btn w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#3DC4DC]/42 hover:border-[#6AD8EB]/70 active:border-[#6AD8EB] bg-[#142630] hover:bg-[#182E3A] active:bg-[#1B3442] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer"
            >
              <Share2 className="isonil-btn-icon w-4 h-4 text-[#6AD8EB] shrink-0" />
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
            className="isonil-dialog-enter w-full max-w-sm max-h-[92dvh] overflow-y-auto bg-[#111920] rounded-2xl border border-[#CBD5E1]/16 shadow-2xl p-5 sm:p-6 text-center text-white"
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

            <div className="mt-4 sm:mt-5 mx-auto w-full max-w-[268px] sm:max-w-[292px] rounded-xl bg-white p-3 sm:p-3.5 shadow-sm">
              <div className="w-full aspect-square">
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
                className="isonil-btn-primary min-h-[46px] px-3 py-2 rounded-xl border border-white/45 bg-gradient-to-b from-white via-[#F3F7FA] to-[#DFE7ED] hover:from-white hover:to-[#E9EFF4] text-[#0E1419] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Download className="isonil-btn-icon w-4 h-4 shrink-0" />
                <span>{t.actions.downloadQr}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="isonil-btn min-h-[46px] px-3 py-2 rounded-xl border border-[#CBD5E1]/14 hover:border-[#3DC4DC]/50 bg-[#0D141A] hover:bg-[#14222B] text-white text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer"
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
