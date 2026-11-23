import { useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  Info,
  Nfc,
  RefreshCw,
  UserPlus,
  X,
} from 'lucide-react';
import { ISONIL_CONTACT } from './constants';
import { evaluateNfcReadiness } from './nfc';
import { buildPermanentQrMatrix } from './QrCodePanel';
import type { CardTranslation } from './translations';
import { useModalSheet } from './useModalSheet';

interface NfcSettingsModalProps {
  isOpen: boolean;
  t: CardTranslation;
  urlCopied: boolean;
  onClose: () => void;
  onCopyNfcUrl: () => void;
  onDownloadVCard: () => void;
  onNotify: (message: string) => void;
}

export function NfcSettingsModal({
  isOpen,
  t,
  urlCopied,
  onClose,
  onCopyNfcUrl,
  onDownloadVCard,
  onNotify,
}: NfcSettingsModalProps) {
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const readiness = useMemo(() => evaluateNfcReadiness(), []);
  const qrMatrix = useMemo(() => buildPermanentQrMatrix(), []);

  const { sheetTouchHandlers } = useModalSheet({
    isOpen,
    onClose,
    dialogRef,
    initialFocusRef: closeButtonRef,
  });

  if (!isOpen) return null;

  const handleDownloadQrPng = async () => {
    if (isDownloadingQr) return;
    setIsDownloadingQr(true);
    try {
      const dataUrl = await QRCode.toDataURL(ISONIL_CONTACT.cardCanonicalUrl, {
        width: 1024,
        margin: 4,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#0E151B',
          light: '#FFFFFF',
        },
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'ISONIL-NFC-Card-QR.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onNotify(t.toasts.qrDownloaded);
    } catch {
      onNotify(t.toasts.qrDownloadError);
    } finally {
      setIsDownloadingQr(false);
    }
  };

  const checklistItems = [
    { key: 'url', ok: readiness.checks.permanentHttpsUrl, label: t.nfc.checkPermanentUrl },
    { key: 'ntag', ok: readiness.checks.ntagMemoryCompatible, label: t.nfc.checkNtagFit },
    { key: 'qr', ok: readiness.checks.qrLinkSynced, label: t.nfc.checkQrSync },
    { key: 'vcf', ok: readiness.checks.vcardComplete, label: t.nfc.checkVcardReady },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="isonil-nfc-modal-title"
      className="isonil-backdrop-enter fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#060A0D]/86 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        {...sheetTouchHandlers}
        className="isonil-sheet-enter overscroll-contain w-full sm:max-w-xl bg-[#131C24] text-[#F8FAFC] rounded-t-3xl sm:rounded-2xl border border-[#CBD8E6]/13 shadow-2xl p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[92dvh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="sm:hidden w-10 h-1.5 bg-[#C8D4DF]/35 rounded-full mx-auto mb-4"
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              aria-hidden="true"
              className="w-10 h-10 rounded-xl bg-[#17222C] border border-[#45C4DC]/30 text-[#45C4DC] flex items-center justify-center shrink-0 mt-0.5"
            >
              <Nfc className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 id="isonil-nfc-modal-title" className="text-lg font-semibold text-[#F8FAFC] leading-snug">
                {t.nfc.modalTitle}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#C8D4DF] leading-relaxed">
                {t.nfc.modalSubtitle}
              </p>
              <p className="mt-1 text-xs text-[#8B9EAD]">{t.nfc.managementScopeNote}</p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t.actions.close}
            className="isonil-icon-btn min-h-[44px] min-w-[44px] -me-2 -mt-1 rounded-xl text-[#C8D4DF] hover:bg-[#1C2A36] hover:text-white flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Readiness Status Summary (Icon + Text Label — never color-only) */}
        <section className="mt-5 pt-4 border-t border-[#CBD8E6]/10">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-xl bg-[#17222C] border border-[#CBD8E6]/13">
            <div>
              <p className="text-xs text-[#8B9EAD]">{t.nfc.statusLabel}</p>
              <p className="mt-0.5 text-sm sm:text-base font-semibold text-[#F8FAFC] flex items-center gap-2">
                {readiness.isReady ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#45C4DC] shrink-0" />
                    <span>{t.nfc.statusReady}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-[#E50914] shrink-0" />
                    <span>{t.nfc.statusIncomplete}</span>
                  </>
                )}
              </p>
            </div>

            <div className="text-xs font-mono tabular-nums text-[#7ADAE9]">
              {readiness.metrics.totalTlvBytes} {t.nfc.bytesUnit}
            </div>
          </div>

          {/* 4-point technical verification checklist */}
          <ul className="mt-3 space-y-2" aria-label={t.nfc.checklistTitle}>
            {checklistItems.map((item) => (
              <li key={item.key} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#E2EBF4]">
                {item.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-[#45C4DC] mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#E50914] mt-0.5 shrink-0" />
                )}
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Fixed Permanent NFC URL + Copy Button */}
        <section className="mt-5 pt-5 border-t border-[#CBD8E6]/10">
          <h4 className="text-xs font-semibold text-[#8B9EAD]">{t.nfc.permanentUrlTitle}</h4>
          <p className="mt-1 text-xs sm:text-sm text-[#C8D4DF] leading-relaxed">
            {t.nfc.permanentUrlHint}
          </p>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#17222C] border border-[#CBD8E6]/13">
            <span
              dir="ltr"
              className="ltr-isolate font-mono text-xs sm:text-sm font-semibold text-[#66D1E6] break-all"
            >
              {ISONIL_CONTACT.cardCanonicalUrl}
            </span>
            <button
              type="button"
              onClick={onCopyNfcUrl}
              className="isonil-btn-primary min-h-[44px] px-4 py-2 rounded-xl border border-white/55 bg-gradient-to-b from-[#F8FAFC] via-[#EEF3F7] to-[#DCE4EC] hover:from-white hover:to-[#E4ECF2] text-[#0D141A] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
            >
              {urlCopied ? (
                <>
                  <Check className="isonil-check-pop w-4 h-4 text-[#0D141A] shrink-0" />
                  <span>{t.actions.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="isonil-btn-icon w-4 h-4 text-[#0D141A] shrink-0" />
                  <span>{t.nfc.copyNfcLink}</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* NTAG213 / NTAG215 Technical Compatibility */}
        <section className="mt-5 pt-5 border-t border-[#CBD8E6]/10">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#45C4DC] shrink-0" />
            <h4 className="text-xs font-semibold text-[#8B9EAD]">{t.nfc.chipCompatibilityTitle}</h4>
          </div>

          <dl className="mt-3 divide-y divide-[#CBD8E6]/10 text-xs sm:text-sm">
            <div className="py-2.5 flex items-center justify-between gap-3">
              <dt className="text-[#C8D4DF]">{t.nfc.recordTypeLabel}</dt>
              <dd className="font-medium text-[#F8FAFC] text-end">{t.nfc.recordTypeValue}</dd>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-3">
              <dt className="text-[#C8D4DF]">{t.nfc.payloadSizeLabel}</dt>
              <dd className="font-mono tabular-nums text-[#7ADAE9] font-medium">
                {readiness.metrics.totalTlvBytes} {t.nfc.bytesUnit}
              </dd>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-3">
              <dt className="text-[#C8D4DF]">{t.nfc.ntag213Label}</dt>
              <dd className="font-medium text-[#F8FAFC] inline-flex items-center gap-1.5">
                {readiness.metrics.fitsNtag213 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#45C4DC]" />
                    <span>{t.nfc.compatibleLabel}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#E50914]" />
                    <span>{t.nfc.exceedsLabel}</span>
                  </>
                )}
              </dd>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-3">
              <dt className="text-[#C8D4DF]">{t.nfc.ntag215Label}</dt>
              <dd className="font-medium text-[#F8FAFC] inline-flex items-center gap-1.5">
                {readiness.metrics.fitsNtag215 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#45C4DC]" />
                    <span>{t.nfc.compatibleLabel}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#E50914]" />
                    <span>{t.nfc.exceedsLabel}</span>
                  </>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* Synced QR Code & vCard Contact Export */}
        <section className="mt-5 pt-5 border-t border-[#CBD8E6]/10">
          <h4 className="text-xs font-semibold text-[#8B9EAD]">{t.nfc.qrAndVcardTitle}</h4>
          <p className="mt-1 text-xs sm:text-sm text-[#C8D4DF] leading-relaxed">
            {t.nfc.qrAndVcardSubtitle}
          </p>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-28 h-28 bg-[#F8FAFC] rounded-xl p-2 shrink-0 ring-1 ring-white/25 shadow-sm">
              <div className="qr-svg-container w-full h-full">
                <svg
                  role="img"
                  aria-label={t.aria.qrCodeImage}
                  viewBox={`0 0 ${qrMatrix.viewBoxSize} ${qrMatrix.viewBoxSize}`}
                  xmlns="http://www.w3.org/2000/svg"
                  shapeRendering="crispEdges"
                >
                  <rect width={qrMatrix.viewBoxSize} height={qrMatrix.viewBoxSize} fill="#FFFFFF" />
                  <path d={qrMatrix.pathData} fill="#0E151B" />
                </svg>
              </div>
            </div>

            <div className="w-full flex-1 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onDownloadVCard}
                className="isonil-btn group w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[#CBD8E6]/13 hover:border-[#45C4DC]/45 bg-[#17222C] hover:bg-[#1C2A36] text-[#F1F5F9] hover:text-white text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
              >
                <UserPlus className="isonil-btn-icon w-4 h-4 text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
                <span>{t.nfc.downloadVcard}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQrPng}
                disabled={isDownloadingQr}
                className="isonil-btn group w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[#CBD8E6]/13 hover:border-[#45C4DC]/45 bg-[#17222C] hover:bg-[#1C2A36] text-[#F1F5F9] hover:text-white text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
              >
                <Download className="isonil-btn-icon w-4 h-4 text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
                <span>{t.actions.downloadQr}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Updates + No External Service + Honest Hardware Writer Disclosure */}
        <section className="mt-5 pt-5 border-t border-[#CBD8E6]/10 space-y-4">
          <div className="flex items-start gap-2.5">
            <RefreshCw className="w-4 h-4 text-[#45C4DC] mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-[#F8FAFC]">{t.nfc.dynamicUpdateTitle}</h4>
              <p className="mt-1 text-xs sm:text-sm text-[#C8D4DF] leading-relaxed">
                {t.nfc.dynamicUpdateText}
              </p>
              <p className="mt-1.5 text-xs text-[#7ADAE9] leading-relaxed">
                {t.nfc.noDependencyNote}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0F161C]/90 border border-[#CBD8E6]/13 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#E50914] mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">
                {t.nfc.hardwareNoticeTitle}
              </h4>
              <p className="mt-1 text-xs text-[#C8D4DF] leading-relaxed">
                {t.nfc.hardwareNoticeText}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#8B9EAD]">{t.nfc.stepsTitle}</h4>
            <ol className="mt-2 space-y-1.5 text-xs sm:text-sm text-[#E2EBF4] list-decimal list-inside">
              <li>{t.nfc.step1}</li>
              <li>{t.nfc.step2}</li>
              <li>{t.nfc.step3}</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
