import { useEffect, useState } from 'react';
import {
  ChevronRight,
  Download,
  MoreVertical,
  PlusSquare,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { STORAGE_HOME_SCREEN_HINT_DISMISSED_KEY } from './constants';
import type { CardTranslation } from './translations';

type MobilePlatform = 'ios' | 'android';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface HomeScreenPromptBoxProps {
  t: CardTranslation;
  langAnimClass?: string;
  onTriggerFeedback?: () => void;
}

function getMobileEnvironment(): {
  isMobileBrowser: boolean;
  platform: MobilePlatform;
  isStandalone: boolean;
} {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isMobileBrowser: false, platform: 'android', isStandalone: false };
  }

  const ua = navigator.userAgent || '';
  const isAppleTouchDevice =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobileUa =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    isAppleTouchDevice;
  const isCoarseMobileViewport =
    Boolean(window.matchMedia?.('(pointer: coarse)').matches) &&
    window.innerWidth < 1024;

  const isStandalone =
    Boolean(window.matchMedia?.('(display-mode: standalone)').matches) ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return {
    isMobileBrowser: isMobileUa || isCoarseMobileViewport,
    platform: isAppleTouchDevice ? 'ios' : 'android',
    isStandalone,
  };
}

function getInitialDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_HOME_SCREEN_HINT_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function HomeScreenPromptBox({
  t,
  langAnimClass = '',
  onTriggerFeedback,
}: HomeScreenPromptBoxProps) {
  const [env, setEnv] = useState(getMobileEnvironment);
  const [manifestDetected, setManifestDetected] = useState(false);
  const [isDismissed, setIsDismissed] = useState(getInitialDismissed);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const syncEnv = () => {
      setEnv(getMobileEnvironment());
    };
    syncEnv();

    const standaloneQuery = window.matchMedia?.('(display-mode: standalone)');
    standaloneQuery?.addEventListener?.('change', syncEnv);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setManifestDetected(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setEnv((prev) => ({ ...prev, isStandalone: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Detect and validate the declared PWA Web App Manifest link
    const manifestEl = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const manifestHref = manifestEl?.getAttribute('href');
    const abortController = new AbortController();

    if (manifestEl && manifestHref && env.isMobileBrowser && !env.isStandalone && !isDismissed) {
      fetch(manifestEl.href, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'force-cache',
        signal: abortController.signal,
      })
        .then(async (response) => {
          if (!response.ok) return;
          const manifestData = (await response.json()) as {
            name?: unknown;
            short_name?: unknown;
            icons?: unknown;
          };
          const hasValidIdentity =
            typeof manifestData?.name === 'string' ||
            typeof manifestData?.short_name === 'string';
          const hasIcons =
            Array.isArray(manifestData?.icons) && manifestData.icons.length > 0;
          if (hasValidIdentity && hasIcons) {
            setManifestDetected(true);
          }
        })
        .catch(() => {
          // Ignore aborted fetches or restricted environments gracefully
        });
    }

    return () => {
      abortController.abort();
      standaloneQuery?.removeEventListener?.('change', syncEnv);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [env.isMobileBrowser, env.isStandalone, isDismissed]);

  if (isDismissed || env.isStandalone || !env.isMobileBrowser || !manifestDetected) {
    return null;
  }

  const handleDismiss = () => {
    onTriggerFeedback?.();
    setIsDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_HOME_SCREEN_HINT_DISMISSED_KEY, 'true');
    } catch {
      // Ignore restricted storage errors gracefully
    }
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    onTriggerFeedback?.();
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setEnv((prev) => ({ ...prev, isStandalone: true }));
      }
    } catch {
      // Keep visual instructions visible if prompt cannot be shown
    }
  };

  const isIos = env.platform === 'ios';
  const step1Text = isIos ? t.homeScreenHint.iosStep1 : t.homeScreenHint.androidStep1;
  const step2Text = isIos ? t.homeScreenHint.iosStep2 : t.homeScreenHint.androidStep2;

  return (
    <section
      aria-label={t.homeScreenHint.regionAria}
      className={`isonil-enter isonil-delay-11 isonil-glass-shell mt-4 sm:mt-5 rounded-2xl border ring-1 ring-white/[0.03] p-4 min-[390px]:p-4.5 no-print ${langAnimClass}`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-3 min-w-0">
          <div
            aria-hidden="true"
            className="isonil-glass-tile w-9 h-9 rounded-xl border border-[#45C4DC]/30 text-[#45C4DC] flex items-center justify-center shrink-0 mt-0.5"
          >
            <Smartphone className="w-[18px] h-[18px]" strokeWidth={1.65} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-[13px] font-semibold text-[#F8FAFC] leading-snug">
              {t.homeScreenHint.title}
            </h2>
            <p className="mt-0.5 text-[11.5px] sm:text-xs text-[#9DB0BF] leading-relaxed">
              {t.homeScreenHint.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t.homeScreenHint.dismissAria}
          className="isonil-icon-btn min-h-[44px] min-w-[44px] -me-2 -mt-1.5 rounded-xl text-[#8B9EAD] hover:text-white hover:bg-white/[0.08] flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
        >
          <X className="w-4 h-4" strokeWidth={1.7} />
        </button>
      </div>

      {/* Visual Step Cues inside a Recessed Glass Well */}
      <div className="isonil-glass-well mt-3 rounded-xl border px-3 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
          {/* Step 1 Visual Keycap Cue */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              aria-hidden="true"
              className="isonil-glass-tile w-8 h-8 rounded-lg border border-[#45C4DC]/28 text-[#7ADAE9] flex items-center justify-center shrink-0"
            >
              {isIos ? (
                <Share className="w-4 h-4" strokeWidth={1.7} />
              ) : (
                <MoreVertical className="w-4 h-4" strokeWidth={1.7} />
              )}
            </span>
            <span className="text-[11.5px] sm:text-xs font-medium text-[#E2EBF4] leading-snug">
              <span className="text-[#66D1E6] font-mono me-1.5">1.</span>
              {step1Text}
            </span>
          </div>

          <ChevronRight
            aria-hidden="true"
            strokeWidth={1.65}
            className="hidden sm:block w-3.5 h-3.5 text-[#667B8C] rtl:rotate-180 shrink-0"
          />

          {/* Step 2 Visual Keycap Cue */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              aria-hidden="true"
              className="isonil-glass-tile w-8 h-8 rounded-lg border border-[#45C4DC]/28 text-[#7ADAE9] flex items-center justify-center shrink-0"
            >
              <PlusSquare className="w-4 h-4" strokeWidth={1.7} />
            </span>
            <span className="text-[11.5px] sm:text-xs font-medium text-[#E2EBF4] leading-snug">
              <span className="text-[#66D1E6] font-mono me-1.5">2.</span>
              {step2Text}
            </span>
          </div>
        </div>

        {/* Native One-Tap Install Action when supported by Android / Chromium */}
        {deferredPrompt && (
          <div className="mt-2.5 pt-2.5 border-t border-[#DCE8F2]/10">
            <button
              type="button"
              onClick={handleNativeInstall}
              className="isonil-btn isonil-glass-tile group w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#7ADAE9]/32 text-[#F8FAFC] text-xs font-semibold inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
            >
              <Download
                strokeWidth={1.75}
                className="isonil-btn-icon w-4 h-4 text-[#7ADAE9] shrink-0"
              />
              <span>{t.homeScreenHint.installAction}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
