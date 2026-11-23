import { useCallback, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, Maximize2, Share2, X } from 'lucide-react';
import { ISONIL_CONTACT } from './constants';
import type { CardTranslation } from './translations';
import { useModalSheet } from './useModalSheet';

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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Permanent QR code matrix — never mutates when language changes
  const qrMatrix = useMemo(() => buildPermanentQrMatrix(), []);

  const handleCloseExpanded = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const { sheetTouchHandlers } = useModalSheet({
    isOpen: isExpanded,
    onClose: handleCloseExpanded,
    dialogRef,
    initialFocusRef: closeButtonRef,
  });

  const handleDownloadPng = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await QRCode.toDataURL(ISONIL_CONTACT.cardCanonicalUrl, {
        width: 1024,
        margin: 4,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#45C4DC',
          light: '#00000000',
        },
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'ISONIL-Card-QR.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onNotify(t.toasts.qrDownloaded);
    } catch {
      onNotify(t.toasts.qrDownloadError);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <section
        aria-labelledby="isonil-qr-heading"
        className="flex flex-col justify-between bg-[#131C24] rounded-2xl border border-[#CBD8E6]/12 ring-1 ring-white/[0.025] shadow-[0_24px_56px_-18px_rgba(2,6,10,0.9),inset_0_1px_0_rgba(248,250,252,0.09)] p-4 min-[390px]:p-5 sm:p-6.5 h-full min-w-0"
      >
        <div>
          <div className={`min-w-0 text-center lg:text-start ${langAnimClass}`}>
            <h2
              id="isonil-qr-heading"
              className="text-base sm:text-lg font-semibold text-[#F8FAFC] tracking-tight"
            >
              {t.sections.qrTitle}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#AEBECC] leading-relaxed">
              {t.sections.qrSubtitle}
            </p>
          </div>

          {/* Transparent-background QR emblem in exact icon cyan (#45C4DC, 8.35:1 contrast on #131C24) */}
          <div className="mt-5 sm:mt-6 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              aria-haspopup="dialog"
              aria-label={`${t.actions.enlargeQr} — ${t.aria.qrCodeImage}`}
              className="isonil-qr-frame group relative w-full max-w-[208px] min-[390px]:max-w-[224px] sm:max-w-[244px] rounded-2xl bg-transparent border border-[#45C4DC]/45 hover:border-[#7ADAE9]/80 p-3.5 sm:p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
            >
              <div className="w-full aspect-square">
                <div className="qr-svg-container w-full h-full">
                  <svg
                    aria-hidden="true"
                    viewBox={`0 0 ${qrMatrix.viewBoxSize} ${qrMatrix.viewBoxSize}`}
                    xmlns="http://www.w3.org/2000/svg"
                    shapeRendering="crispEdges"
                  >
                    <path d={qrMatrix.pathData} className="fill-[#45C4DC] group-hover:fill-[#7ADAE9] transition-colors duration-200" />
                  </svg>
                </div>
              </div>
              <span className="sr-only">{t.actions.enlargeQr}</span>
            </button>

            <p
              dir="ltr"
              className="mt-3 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.22em] text-[#96AAB9] select-none"
            >
              SCAN TO CONNECT
            </p>

            {/* Structured permanent canonical link bar */}
            <div className={`mt-4 w-full rounded-xl bg-[#0F161C]/75 border border-[#CBD8E6]/8 px-3 sm:px-3.5 py-2.5 ${langAnimClass}`}>
              <p className="text-[11px] font-medium text-[#8B9EAD]">{t.sections.permanentLinkLabel}</p>
              <div className="mt-0.5 flex flex-wrap min-[360px]:flex-nowrap items-center justify-between gap-2">
                <a
                  href={ISONIL_CONTACT.cardCanonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="ltr-isolate font-mono text-[11px] min-[390px]:text-xs sm:text-[13px] font-medium text-[#66D1E6] hover:text-[#7ADAE9] transition-colors truncate min-w-0"
                >
                  {ISONIL_CONTACT.cardCanonicalUrl}
                </a>
                <button
                  type="button"
                  onClick={onCopyUrl}
                  aria-label={t.aria.copyCardUrl}
                  className="isonil-icon-btn min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] -me-1 px-2.5 rounded-lg text-[11.5px] sm:text-xs font-medium text-[#66D1E6] hover:bg-[#1C2A36] hover:text-[#7ADAE9] inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
                >
                  {urlCopied ? (
                    <>
                      <Check strokeWidth={1.75} className="isonil-check-pop w-4 h-4 text-[#7ADAE9]" />
                      <span className="text-[#7ADAE9]">{t.actions.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy strokeWidth={1.65} className="w-4 h-4" />
                      <span>{t.actions.copyLink}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Utility actions for scanning, download & mobile share */}
        <div className={`mt-5 pt-4 border-t border-[#CBD8E6]/8 grid grid-cols-2 gap-2.5 sm:gap-3 no-print ${langAnimClass}`}>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            aria-haspopup="dialog"
            aria-label={t.actions.enlargeQr}
            className="isonil-btn group min-w-0 min-h-[48px] px-2.5 sm:px-3 py-2.5 rounded-[14px] border border-[#CBD8E6]/10 hover:border-[#45C4DC]/42 bg-gradient-to-b from-[#18232E] to-[#141E27] hover:from-[#1D2A36] hover:to-[#17232D] active:from-[#202E3C] active:to-[#192632] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)] text-[#EBF1F6] hover:text-white text-[11px] min-[370px]:text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
          >
            <Maximize2 strokeWidth={1.65} className="isonil-btn-icon w-4 h-4 text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
            <span className="truncate">{t.actions.enlargeQr}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isDownloading}
            aria-label={t.actions.downloadQr}
            className="isonil-btn group min-w-0 min-h-[48px] px-2.5 sm:px-3 py-2.5 rounded-[14px] border border-[#CBD8E6]/10 hover:border-[#45C4DC]/42 bg-gradient-to-b from-[#18232E] to-[#141E27] hover:from-[#1D2A36] hover:to-[#17232D] active:from-[#202E3C] active:to-[#192632] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)] text-[#EBF1F6] hover:text-white text-[11px] min-[370px]:text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
          >
            <Download strokeWidth={1.65} className="isonil-btn-icon w-4 h-4 text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
            <span className="truncate">{t.actions.downloadQr}</span>
          </button>

          {onShareCard && (
            <button
              type="button"
              onClick={onShareCard}
              aria-label={t.aria.shareCardAction}
              className="lg:hidden col-span-2 isonil-btn group w-full min-h-[48px] px-4 py-2.5 rounded-[14px] border border-[#CBD8E6]/12 hover:border-[#45C4DC]/45 active:border-[#45C4DC]/65 bg-gradient-to-b from-[#18232E] to-[#141E27] hover:from-[#1D2A36] hover:to-[#17232D] active:from-[#202E3C] active:to-[#192632] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)] text-[#F8FAFC] text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
            >
              <Share2 strokeWidth={1.65} className="isonil-btn-icon w-4 h-4 text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
              <span className="truncate">{t.actions.shareCard}</span>
            </button>
          )}
        </div>
      </section>

      {/* Fullscreen High-Contrast Scan Modal (Accessible bottom sheet on mobile, dialog on desktop) */}
      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="isonil-qr-modal-title"
          className="isonil-backdrop-enter fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#060A0D]/82 backdrop-blur-md p-0 sm:p-4"
          onClick={handleCloseExpanded}
        >
          <div
            ref={dialogRef}
            {...sheetTouchHandlers}
            className="isonil-sheet-enter overscroll-contain w-full sm:max-w-sm max-h-[92dvh] overflow-y-auto bg-[#131C24] rounded-t-3xl sm:rounded-2xl border border-[#CBD8E6]/14 ring-1 ring-white/[0.03] shadow-2xl p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-[#F8FAFC]"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="sm:hidden w-10 h-1.5 bg-[#C8D4DF]/35 rounded-full mx-auto mb-4"
              aria-hidden="true"
            />

            <div className="flex items-center justify-between gap-3">
              <h3
                id="isonil-qr-modal-title"
                className="text-base font-semibold text-[#F8FAFC] text-start"
              >
                {t.qrModal.title}
              </h3>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleCloseExpanded}
                aria-label={t.actions.close}
                className="isonil-icon-btn min-h-[44px] min-w-[44px] -me-2 rounded-xl text-[#C8D4DF] hover:bg-[#1C2A36] hover:text-white flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
              >
                <X strokeWidth={1.75} className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-1 text-sm text-[#B9C7D4] text-start">{t.qrModal.subtitle}</p>

            <div className="mt-4 sm:mt-5 mx-auto w-full max-w-[268px] sm:max-w-[292px] rounded-2xl bg-transparent border border-[#45C4DC]/45 p-3.5 sm:p-4">
              <div className="w-full aspect-square">
                <div className="qr-svg-container w-full h-full">
                  <svg
                    role="img"
                    aria-label={t.aria.qrCodeImage}
                    viewBox={`0 0 ${qrMatrix.viewBoxSize} ${qrMatrix.viewBoxSize}`}
                    xmlns="http://www.w3.org/2000/svg"
                    shapeRendering="crispEdges"
                  >
                    <path d={qrMatrix.pathData} fill="#45C4DC" />
                  </svg>
                </div>
              </div>
            </div>

            <p
              dir="ltr"
              className="mt-3 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.22em] text-[#96AAB9] select-none"
            >
              SCAN TO CONNECT
            </p>

            <div className="mt-3">
              <p dir="ltr" className="ltr-isolate font-mono text-xs font-medium text-[#66D1E6] break-all">
                {ISONIL_CONTACT.cardCanonicalUrl}
              </p>
              <p className="mt-1.5 text-xs text-[#8B9EAD]">{t.qrModal.scanHint}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isDownloading}
                className="isonil-btn-primary min-h-[46px] px-3 py-2 rounded-xl border border-[#7ADAE9]/35 hover:border-[#7ADAE9]/60 bg-gradient-to-b from-[#45C4DC]/[0.20] via-white/[0.08] to-[#45C4DC]/[0.06] hover:from-[#45C4DC]/[0.28] hover:via-white/[0.12] hover:to-[#45C4DC]/[0.10] backdrop-blur-md text-[#F8FAFC] text-xs sm:text-sm font-semibold shadow-[0_8px_22px_-10px_rgba(69,196,220,0.4),inset_0_1px_0_rgba(255,255,255,0.26)] inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
              >
                <Download strokeWidth={1.75} className="isonil-btn-icon w-4 h-4 text-[#7ADAE9] shrink-0" />
                <span>{t.actions.downloadQr}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="isonil-btn min-h-[46px] px-3 py-2 rounded-xl border border-[#CBD8E6]/14 hover:border-[#45C4DC]/50 bg-gradient-to-b from-[#1A2631] to-[#15202A] hover:from-[#1F2D3A] hover:to-[#182530] text-[#F1F5F9] text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer"
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
