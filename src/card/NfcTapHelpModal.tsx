import { useRef } from 'react';
import { Nfc, Settings2, Smartphone, X } from 'lucide-react';
import type { CardTranslation } from './translations';
import { useModalSheet } from './useModalSheet';

interface NfcTapHelpModalProps {
  isOpen: boolean;
  t: CardTranslation;
  onClose: () => void;
  onOpenAdminSettings: () => void;
}

export function NfcTapHelpModal({
  isOpen,
  t,
  onClose,
  onOpenAdminSettings,
}: NfcTapHelpModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const { sheetTouchHandlers } = useModalSheet({
    isOpen,
    onClose,
    dialogRef,
    initialFocusRef: closeButtonRef,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="isonil-nfc-help-title"
      className="isonil-backdrop-enter fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#05090D]/72 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        {...sheetTouchHandlers}
        className="isonil-sheet-enter isonil-glass-sheet overscroll-contain w-full sm:max-w-md text-[#F8FAFC] rounded-t-3xl sm:rounded-2xl border ring-1 ring-white/[0.04] p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[90dvh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="sm:hidden w-10 h-1.5 bg-[#C8D4DF]/35 rounded-full mx-auto mb-4"
          aria-hidden="true"
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              aria-hidden="true"
              className="isonil-glass-tile w-10 h-10 rounded-xl border border-[#45C4DC]/35 text-[#45C4DC] flex items-center justify-center shrink-0 mt-0.5"
            >
              <Nfc className="w-5 h-5" strokeWidth={1.65} />
            </div>
            <div className="min-w-0">
              <h3 id="isonil-nfc-help-title" className="text-lg font-semibold text-[#F8FAFC] leading-snug">
                {t.nfcTapHelp.title}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#C8D4DF] leading-relaxed">
                {t.nfcTapHelp.summary}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t.actions.close}
            className="isonil-icon-btn min-h-[44px] min-w-[44px] -me-2 -mt-1 rounded-xl text-[#C8D4DF] hover:bg-white/[0.08] hover:text-white flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.65} />
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-[#CBD8E6]/10 divide-y divide-[#CBD8E6]/10">
          <div className="pb-3.5 flex items-start gap-3">
            <Smartphone className="w-4 h-4 text-[#45C4DC] mt-0.5 shrink-0" strokeWidth={1.65} />
            <p className="text-xs sm:text-sm text-[#E2EBF4] leading-relaxed">
              {t.nfcTapHelp.iphoneTip}
            </p>
          </div>
          <div className="pt-3.5 flex items-start gap-3">
            <Smartphone className="w-4 h-4 text-[#45C4DC] mt-0.5 shrink-0" strokeWidth={1.65} />
            <p className="text-xs sm:text-sm text-[#E2EBF4] leading-relaxed">
              {t.nfcTapHelp.androidTip}
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#CBD8E6]/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenAdminSettings}
            className="isonil-icon-btn min-h-[44px] px-3 rounded-xl text-xs font-medium text-[#8B9EAD] hover:text-[#7ADAE9] hover:bg-white/[0.06] inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#45C4DC]" strokeWidth={1.65} />
            <span>{t.nfc.triggerLabel}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="isonil-btn isonil-glass-tile min-h-[44px] px-5 py-2 rounded-xl border text-[#F1F5F9] hover:text-white text-xs sm:text-sm font-medium cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC]"
          >
            {t.actions.close}
          </button>
        </div>
      </div>
    </div>
  );
}
