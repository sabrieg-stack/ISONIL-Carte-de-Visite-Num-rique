import { useMemo, useRef } from 'react';
import { Bookmark, Check, Copy, Monitor, Smartphone, X } from 'lucide-react';
import { ISONIL_CONTACT } from './constants';
import type { CardTranslation } from './translations';
import { useModalSheet } from './useModalSheet';

type DevicePlatform = 'ios' | 'android' | 'desktop';

function detectDevicePlatform(): DevicePlatform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/i.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

function isMacDesktop(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac/i.test(navigator.platform || navigator.userAgent || '');
}

interface FavoritesModalProps {
  isOpen: boolean;
  isFavorite: boolean;
  t: CardTranslation;
  urlCopied: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onCopyUrl: () => void;
}

export function FavoritesModal({
  isOpen,
  isFavorite,
  t,
  urlCopied,
  onClose,
  onToggleFavorite,
  onCopyUrl,
}: FavoritesModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const currentPlatform = useMemo<DevicePlatform>(() => detectDevicePlatform(), []);
  const desktopOnMac = useMemo<boolean>(() => isMacDesktop(), []);

  const { sheetTouchHandlers } = useModalSheet({
    isOpen,
    onClose,
    dialogRef,
    initialFocusRef: closeButtonRef,
  });

  if (!isOpen) return null;

  const desktopGuideSteps =
    currentPlatform === 'desktop'
      ? desktopOnMac
        ? t.favoritesModal.desktopStepsMac
        : t.favoritesModal.desktopStepsWin
      : t.favoritesModal.desktopSteps;

  const rawGuides: Array<{
    id: DevicePlatform;
    title: string;
    steps: string;
    icon: typeof Smartphone;
  }> = [
    {
      id: 'ios',
      title: t.favoritesModal.iosTitle,
      steps: t.favoritesModal.iosSteps,
      icon: Smartphone,
    },
    {
      id: 'android',
      title: t.favoritesModal.androidTitle,
      steps: t.favoritesModal.androidSteps,
      icon: Smartphone,
    },
    {
      id: 'desktop',
      title: t.favoritesModal.desktopTitle,
      steps: desktopGuideSteps,
      icon: Monitor,
    },
  ];
  const platformGuides = [...rawGuides].sort((a, b) =>
    a.id === currentPlatform ? -1 : b.id === currentPlatform ? 1 : 0
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="isonil-favorites-title"
      className="isonil-backdrop-enter fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#060A0D]/86 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        {...sheetTouchHandlers}
        className="isonil-sheet-enter overscroll-contain w-full sm:max-w-md bg-[#11181F] text-white rounded-t-3xl sm:rounded-2xl border border-[#4CC3DB]/28 shadow-2xl p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[90dvh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="sm:hidden w-10 h-1.5 bg-[#D0D7DE]/35 rounded-full mx-auto mb-4"
          aria-hidden="true"
        />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="isonil-favorites-title" className="text-lg font-semibold text-white">
              {t.favoritesModal.title}
            </h3>
            <p className="mt-1 text-sm text-[#D0D7DE]">{t.favoritesModal.subtitle}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t.actions.close}
            className="isonil-icon-btn min-h-[44px] min-w-[44px] -me-2 -mt-1 rounded-xl text-[#D0D7DE] hover:bg-[#17222B] hover:text-white flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Local favorite toggle */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 py-3.5 border-y border-[#D0D7DE]/14">
          <div className="flex items-center gap-2.5 min-w-0">
            <Bookmark
              className={`w-5 h-5 shrink-0 ${
                isFavorite ? 'fill-[#E50914] text-[#E50914]' : 'text-[#9AA9B5]'
              }`}
            />
            <span className="text-sm font-medium text-white truncate">
              {isFavorite ? t.actions.savedInFavorites : t.favoritesModal.savedStatusLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`isonil-btn min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer ${
              isFavorite
                ? 'bg-[#0C1217]/85 hover:bg-[#17222B] border border-[#D0D7DE]/18 text-white'
                : 'bg-white hover:bg-[#ECF8FA] text-[#0C1217]'
            }`}
          >
            {isFavorite ? t.favoritesModal.toggleRemove : t.favoritesModal.toggleSave}
          </button>
        </div>

        {/* Transparent explanation about browser bookmarking */}
        <p className="mt-4 text-xs sm:text-sm text-[#D0D7DE] leading-relaxed">
          {t.favoritesModal.browserNote}
        </p>

        <div className="mt-4 divide-y divide-[#D0D7DE]/14">
          {platformGuides.map((guide) => {
            const Icon = guide.icon;
            const isCurrent = guide.id === currentPlatform;
            return (
              <div key={guide.id} className="py-3 flex items-start gap-3">
                <Icon className="w-4 h-4 text-[#4CC3DB] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white flex flex-wrap items-center gap-x-2">
                    <span>{guide.title}</span>
                    {isCurrent && (
                      <span className="text-xs font-medium text-[#5EC6DA]">
                        · {t.favoritesModal.currentDeviceLabel}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm text-[#D0D7DE] leading-relaxed">
                    {guide.steps}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Copy canonical link for quick saving */}
        <div className="mt-4 pt-4 border-t border-[#D0D7DE]/14 flex flex-wrap items-center justify-between gap-2">
          <span
            dir="ltr"
            className="ltr-isolate font-mono text-xs text-[#5EC6DA] break-all"
          >
            {ISONIL_CONTACT.cardCanonicalUrl}
          </span>
          <button
            type="button"
            onClick={onCopyUrl}
            className="isonil-btn min-h-[44px] px-4 py-2 rounded-xl border border-[#D0D7DE]/18 hover:border-[#4CC3DB]/48 bg-[#0C1217]/82 hover:bg-[#17222B] text-white text-xs sm:text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer"
          >
            {urlCopied ? (
              <>
                <Check className="isonil-check-pop w-4 h-4 text-[#76D4E6]" />
                <span className="text-[#76D4E6]">{t.actions.copied}</span>
              </>
            ) : (
              <>
                <Copy className="isonil-btn-icon w-4 h-4 text-[#4CC3DB]" />
                <span>{t.actions.copyLink}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
