import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Nfc,
  Phone,
  QrCode,
  Share2,
  Smartphone,
  UserPlus,
  X,
} from 'lucide-react';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import {
  DEFAULT_LANGUAGE,
  ISONIL_CONTACT,
  STORAGE_FAVORITE_KEY,
  STORAGE_LANG_KEY,
  type CardLanguage,
} from './constants';
import { CARD_TRANSLATIONS } from './translations';
import { downloadIsonilVCard } from './vcard';
import { QrCodePanel } from './QrCodePanel';
import { FavoritesModal } from './FavoritesModal';
import { NfcSettingsModal } from './NfcSettingsModal';

const LANGUAGE_ORDER: CardLanguage[] = ['fr', 'en', 'ar'];

function getInitialLanguage(): CardLanguage {
  try {
    const queryLang = new URLSearchParams(window.location.search).get('lang')?.toLowerCase();
    if (queryLang === 'fr' || queryLang === 'en' || queryLang === 'ar') {
      return queryLang;
    }
  } catch {
    // Ignore malformed query string
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_LANG_KEY);
    if (stored === 'fr' || stored === 'en' || stored === 'ar') {
      return stored;
    }
  } catch {
    // Proceed to browser language detection
  }

  try {
    const candidates =
      navigator.languages && navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language];
    for (const locale of candidates) {
      const base = locale?.toLowerCase().split('-')[0];
      if (base === 'ar' || base === 'en' || base === 'fr') {
        return base;
      }
    }
  } catch {
    // Fallback safely to French
  }

  return DEFAULT_LANGUAGE;
}

function triggerSubtleHaptic(): void {
  try {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  } catch {
    // Silently ignore unsupported or blocked vibration APIs
  }
}

function getSavedFavorite(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_FAVORITE_KEY) === 'true';
  } catch {
    return false;
  }
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Proceed to fallback textarea copy
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.className = 'fixed -top-[9999px] left-0 opacity-0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export function IsonilCardPage() {
  const [lang, setLang] = useState<CardLanguage>(getInitialLanguage);
  const [isFavorite, setIsFavorite] = useState<boolean>(getSavedFavorite);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [nfcModalOpen, setNfcModalOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return window.location.hash === '#nfc-settings' || params.get('admin') === 'nfc';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'url' | 'phone' | 'email' | 'address' | null>(null);
  const [contactSavedFeedback, setContactSavedFeedback] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [langAnimPhase, setLangAnimPhase] = useState<'idle' | 'a' | 'b'>('idle');
  const [nfcHelpOpen, setNfcHelpOpen] = useState(false);

  const toastTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const vcardTimerRef = useRef<number | null>(null);
  const nfcHelpContainerRef = useRef<HTMLDivElement | null>(null);

  const t = CARD_TRANSLATIONS[lang];
  const isRtl = t.dir === 'rtl';
  const langAnimClass =
    langAnimPhase === 'idle' ? '' : langAnimPhase === 'a' ? 'isonil-lang-a' : 'isonil-lang-b';

  // Polite language-matched prefilled starter intent for zero-friction WhatsApp & Email contact
  const whatsappDirectHref = `${ISONIL_CONTACT.whatsappHref}?text=${encodeURIComponent(
    t.prefill.whatsappMessage
  )}`;
  const emailDirectHref = `${ISONIL_CONTACT.emailHref}?subject=${encodeURIComponent(
    t.prefill.emailSubject
  )}`;

  // Persist card-only language preference without altering any main-site language state
  const handleSelectLanguage = (nextLang: CardLanguage) => {
    if (nextLang === lang) return;
    triggerSubtleHaptic();
    setLang(nextLang);
    setLangAnimPhase((prev) => (prev === 'a' ? 'b' : 'a'));
    try {
      window.localStorage.setItem(STORAGE_LANG_KEY, nextLang);
    } catch {
      // Ignore restricted storage errors gracefully
    }
  };

  // Sync page metadata, html lang, and html dir for screen readers & native browser ergonomics
  useEffect(() => {
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;
    const previousDir = document.documentElement.dir;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionMeta?.getAttribute('content') ?? null;

    document.title = t.metaTitle;
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', t.metaDescription);
    }

    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousLang;
      document.documentElement.dir = previousDir;
      if (descriptionMeta && previousDescription !== null) {
        descriptionMeta.setAttribute('content', previousDescription);
      }
    };
  }, [lang, t.dir, t.metaTitle, t.metaDescription]);

  // Dismiss visitor NFC tap guide on outside click or Escape key
  useEffect(() => {
    if (!nfcHelpOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        nfcHelpContainerRef.current &&
        !nfcHelpContainerRef.current.contains(event.target as Node)
      ) {
        setNfcHelpOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNfcHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nfcHelpOpen]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#nfc-settings') {
        setNfcModalOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      if (vcardTimerRef.current !== null) window.clearTimeout(vcardTimerRef.current);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  const handleCopyValue = useCallback(
    async (field: 'url' | 'phone' | 'email' | 'address', value: string, successText: string) => {
      const ok = await copyTextToClipboard(value);
      if (!ok) {
        showToast(t.toasts.copyError);
        return;
      }
      triggerSubtleHaptic();
      setCopiedField(field);
      showToast(successText);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedField(null);
      }, 2200);
    },
    [showToast, t.toasts.copyError]
  );

  const triggerSaveContactFeedback = useCallback(() => {
    triggerSubtleHaptic();
    setContactSavedFeedback(true);
    showToast(t.toasts.vcfDownloaded);
    if (vcardTimerRef.current !== null) {
      window.clearTimeout(vcardTimerRef.current);
    }
    vcardTimerRef.current = window.setTimeout(() => {
      setContactSavedFeedback(false);
    }, 2400);
  }, [showToast, t.toasts.vcfDownloaded]);

  const handleSaveContactFromModal = useCallback(() => {
    downloadIsonilVCard();
    triggerSaveContactFeedback();
  }, [triggerSaveContactFeedback]);

  const handleShareCard = async () => {
    triggerSubtleHaptic();
    const sharePayload = {
      title: t.share.title,
      text: t.share.text,
      url: ISONIL_CONTACT.cardCanonicalUrl,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(sharePayload);
        showToast(t.toasts.shareCompleted);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        // Fall back to copying canonical URL when native share fails
      }
    }

    await handleCopyValue('url', ISONIL_CONTACT.cardCanonicalUrl, t.toasts.shareFallbackCopied);
  };

  const handleToggleFavorite = () => {
    triggerSubtleHaptic();
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    try {
      window.localStorage.setItem(STORAGE_FAVORITE_KEY, String(nextState));
    } catch {
      // Ignore storage errors
    }
    showToast(nextState ? t.toasts.favoriteSaved : t.toasts.favoriteRemoved);
  };

  const handleOpenFavorites = () => {
    if (!isFavorite) {
      setIsFavorite(true);
      try {
        window.localStorage.setItem(STORAGE_FAVORITE_KEY, 'true');
      } catch {
        // Ignore storage errors
      }
    }
    setFavoritesModalOpen(true);
  };

  const handleJumpToQr = () => {
    triggerSubtleHaptic();
    const qrSection = document.getElementById('isonil-qr-section');
    if (qrSection) {
      qrSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Paper-card inspired matte charcoal, petrol-teal, cyan & metallic silver surfaces
  const uniformStandardBtnClass =
    'isonil-btn group w-full min-h-[62px] sm:min-h-[66px] px-3 py-2.5 rounded-xl border border-[#CBD5E1]/14 hover:border-[#3DC4DC]/50 active:border-[#3DC4DC]/65 bg-[#0D141A] hover:bg-[#14222B] active:bg-[#162732] text-white/95 text-xs sm:text-[13px] font-semibold flex flex-col items-center justify-center gap-1.5 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer';

  const companyProfileHighlightClass =
    'isonil-btn group w-full min-h-[62px] sm:min-h-[66px] px-3 py-2.5 rounded-xl border border-[#3DC4DC]/42 hover:border-[#6AD8EB]/70 active:border-[#6AD8EB] bg-[#142630] hover:bg-[#182E3A] active:bg-[#1B3442] text-white text-xs sm:text-[13px] font-semibold flex flex-col items-center justify-center gap-1.5 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer';

  const utilityActionBtnClass =
    'isonil-btn w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#CBD5E1]/14 hover:border-[#3DC4DC]/50 active:border-[#3DC4DC]/65 bg-[#0D141A] hover:bg-[#14222B] active:bg-[#162732] text-white/95 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer';

  return (
    <div
      dir={t.dir}
      lang={lang}
      className={`min-h-[100dvh] w-full max-w-full relative overflow-x-clip bg-[#10171D] text-white ${
        isRtl ? 'font-[var(--font-arabic)]' : 'font-[var(--font-sans)]'
      }`}
    >
      {/* Paper-card inspired ambient backdrop: matte charcoal with quiet petrol-teal corner arcs & subtle cyan traces */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <svg
          className="w-full h-full opacity-75"
          viewBox="0 0 1200 1200"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="isonil-bg-cyan-tl" x1="0" y1="420" x2="380" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3DC4DC" stopOpacity="0" />
              <stop offset="45%" stopColor="#3DC4DC" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6AD8EB" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="isonil-bg-cyan-br" x1="820" y1="1200" x2="1200" y2="780" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3DC4DC" stopOpacity="0" />
              <stop offset="50%" stopColor="#3DC4DC" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6AD8EB" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Top-left petrol wedge & subtle cyan arc */}
          <path d="M0 0H420C270 115 130 270 0 470V0Z" fill="#162831" fillOpacity="0.72" />
          <path d="M-12 435C100 250 218 115 362 12" stroke="url(#isonil-bg-cyan-tl)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M-8 395C82 248 182 130 296 36" stroke="url(#isonil-bg-cyan-tl)" strokeWidth="1.2" strokeOpacity="0.55" strokeLinecap="round" />
          {/* Bottom-right petrol wedge & subtle cyan arc */}
          <path d="M1200 1200H780C930 1085 1070 930 1200 730V1200Z" fill="#162831" fillOpacity="0.72" />
          <path d="M1212 765C1100 950 982 1085 838 1188" stroke="url(#isonil-bg-cyan-br)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M1208 805C1118 952 1018 1070 904 1164" stroke="url(#isonil-bg-cyan-br)" strokeWidth="1.2" strokeOpacity="0.55" strokeLinecap="round" />
        </svg>
      </div>

      <a
        href="#isonil-card-main"
        aria-label={t.skipToContent}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-white focus:text-[#0C1217] focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-[#4CC3DB]"
      >
        {t.skipToContent}
      </a>

      <main id="isonil-card-main" className="relative z-10 w-full max-w-5xl mx-auto safe-area-main">
        {/* Clean Mobile-First Top Bar: Single-line responsive kicker + tactile language selector */}
        <header className="isonil-fade flex items-center justify-between gap-2.5 sm:gap-4 mb-3 sm:mb-6 no-print">
          <p className={`text-[11px] min-[390px]:text-xs sm:text-sm font-medium text-[#9AA9B5] sm:text-[#D0D7DE] leading-snug truncate min-w-0 ${langAnimClass}`}>
            {t.cardKicker}
          </p>

          <div
            role="group"
            aria-label={t.languageSelectorAria}
            className="inline-flex items-center p-1 rounded-xl bg-[#111920] border border-[#CBD5E1]/16 shrink-0"
          >
            {LANGUAGE_ORDER.map((code) => {
              const active = lang === code;
              const label = CARD_TRANSLATIONS[code].switcherLabel;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelectLanguage(code)}
                  aria-label={`${t.languageSelectorAria}: ${CARD_TRANSLATIONS[code].langName}`}
                  aria-pressed={active}
                  lang={code}
                  className={`isonil-tab-btn min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer ${
                    active
                      ? 'bg-gradient-to-b from-white to-[#E6EDF2] text-[#0E1419] shadow-xs'
                      : 'text-[#D5DEE5] hover:text-white hover:bg-[#17242E]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Responsive Executive Two-Column Grid (Desktop) / Organized Single-Column Mobile Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-start">
          {/* Primary Official Card: Paper-card theme (Matte charcoal, corner cyan curves, metallic silver border, signature cyan bar) */}
          <article className="isonil-enter isonil-delay-1 lg:col-span-7 bg-[#111920] rounded-2xl border border-[#CBD5E1]/16 shadow-[0_20px_50px_-16px_rgba(3,7,11,0.75),inset_0_1px_0_rgba(226,234,240,0.08)] overflow-hidden flex flex-col min-w-0">
            {/* Paper-card inspired header band with corner cyan light-arcs, centered silver-framed logo, crisp white wordmark & cyan rule */}
            <div className="relative overflow-hidden bg-[#10171D] text-white px-4 min-[390px]:px-5 sm:px-8 pt-6 pb-5 sm:pt-7 sm:pb-6 border-b border-[#CBD5E1]/12">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full"
                viewBox="0 0 600 220"
                preserveAspectRatio="none"
                fill="none"
              >
                <defs>
                  <linearGradient id="isonil-hdr-tl" x1="0" y1="150" x2="170" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3DC4DC" stopOpacity="0" />
                    <stop offset="50%" stopColor="#3DC4DC" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#6AD8EB" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="isonil-hdr-br" x1="430" y1="220" x2="600" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3DC4DC" stopOpacity="0" />
                    <stop offset="50%" stopColor="#3DC4DC" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#6AD8EB" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Top-left corner sweep */}
                <path d="M0 0H185C118 46 58 106 0 176V0Z" fill="#162831" fillOpacity="0.72" />
                <path d="M-4 156C44 92 98 40 162 4" stroke="url(#isonil-hdr-tl)" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M-2 134C38 82 82 40 132 10" stroke="url(#isonil-hdr-tl)" strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round" />
                {/* Bottom-right corner sweep */}
                <path d="M600 220H415C482 174 542 114 600 44V220Z" fill="#162831" fillOpacity="0.72" />
                <path d="M604 64C556 128 502 180 438 216" stroke="url(#isonil-hdr-br)" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M602 86C562 138 518 180 468 210" stroke="url(#isonil-hdr-br)" strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round" />
              </svg>

              <div className="relative z-10 flex flex-col items-center text-center min-[520px]:flex-row min-[520px]:items-center min-[520px]:text-start gap-2.5 min-[390px]:gap-3 sm:gap-5">
                {/* Original Transparent ISONIL Logo (Metallic Silver Frame + Red "i") directly on #10171D */}
                <div className="isonil-logo-reveal w-[74px] h-[74px] min-[390px]:w-20 min-[390px]:h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center bg-transparent">
                  {!logoFailed ? (
                    <picture className="w-full h-full flex items-center justify-center">
                      <source srcSet={ISONIL_CONTACT.logoWebpSrc} type="image/webp" />
                      <img
                        src={ISONIL_CONTACT.logoSrc}
                        alt={t.aria.logoAlt}
                        width={96}
                        height={96}
                        decoding="async"
                        fetchPriority="high"
                        referrerPolicy="no-referrer"
                        onError={() => setLogoFailed(true)}
                        className="w-full h-full object-contain bg-transparent"
                      />
                    </picture>
                  ) : (
                    <span className="text-3xl font-bold text-[#E50914] tracking-tight">i</span>
                  )}
                </div>

                <div className={`min-w-0 w-full min-[520px]:flex-1 isonil-enter isonil-delay-2 ${langAnimClass}`}>
                  <h1 className="text-[24px] min-[390px]:text-[26px] sm:text-[32px] font-bold tracking-[0.06em] text-white leading-tight">
                    {ISONIL_CONTACT.company}
                  </h1>
                  <p className="mt-0.5 text-[14px] min-[390px]:text-[15px] sm:text-base font-semibold text-[#5AD4EA] leading-snug">
                    {t.displayName}
                  </p>

                  {/* Signature paper-card short cyan rule */}
                  <div
                    aria-hidden="true"
                    className="isonil-accent-line mt-2.5 mb-2.5 h-[2px] w-14 rounded-full bg-[#3DC4DC] mx-auto min-[520px]:mx-0"
                  />

                  <p className="text-[13px] min-[390px]:text-sm sm:text-[15px] text-[#D5DEE5] leading-snug text-balance max-w-[34ch] mx-auto min-[520px]:mx-0 min-[520px]:max-w-none">
                    {t.businessActivity}
                  </p>

                  <p className="mt-1 text-xs text-[#96A7B4]">{t.cityCountry}</p>
                </div>
              </div>
            </div>

            {/* Card Body: Structured mobile-first list rows + Social footer */}
            <div className="p-4 min-[390px]:p-5 sm:p-7 flex-1 flex flex-col">
              {/* Clean Card Sub-Header: Quick Actions title + aligned QR / NFC utilities */}
              <section
                aria-labelledby="isonil-quick-actions-heading"
                className={langAnimClass || undefined}
              >
                <div ref={nfcHelpContainerRef}>
                  <div className="isonil-enter isonil-delay-2 flex items-center justify-between gap-2 mb-3">
                    <h2
                      id="isonil-quick-actions-heading"
                      className="text-xs font-semibold text-[#96A7B4] truncate"
                    >
                      {t.sections.quickActions}
                    </h2>

                    <div className="no-print flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleJumpToQr}
                        aria-label={t.aria.jumpToQrAction}
                        className="isonil-icon-btn lg:hidden min-h-[40px] px-2.5 rounded-lg text-xs font-medium text-[#96A7B4] hover:text-[#6AD8EB] active:bg-[#162630] inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#3DC4DC] shrink-0" />
                        <span>{t.actions.jumpToQr}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNfcHelpOpen((prev) => !prev)}
                        aria-expanded={nfcHelpOpen}
                        aria-controls="isonil-nfc-tap-guide"
                        aria-label={t.nfcTapHelp.triggerAria}
                        className={`isonil-icon-btn min-h-[40px] px-2.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer ${
                          nfcHelpOpen
                            ? 'text-[#6AD8EB] bg-[#162630]'
                            : 'text-[#96A7B4] hover:text-[#6AD8EB] active:bg-[#162630]'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[#3DC4DC] shrink-0" />
                        <span>{t.nfcTapHelp.triggerLabel}</span>
                      </button>
                    </div>
                  </div>

                  {nfcHelpOpen && (
                    <div
                      id="isonil-nfc-tap-guide"
                      role="region"
                      aria-label={t.nfcTapHelp.title}
                      className="isonil-popover-enter no-print mb-3 p-3.5 rounded-xl bg-[#0D141A] border border-[#CBD5E1]/14 text-xs text-[#D5DEE5] leading-relaxed"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <Smartphone className="w-4 h-4 text-[#3DC4DC] shrink-0" />
                          <span>{t.nfcTapHelp.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNfcHelpOpen(false)}
                          aria-label={t.actions.close}
                          className="isonil-icon-btn min-h-[36px] min-w-[36px] -me-1.5 -mt-1.5 rounded-lg text-[#96A7B4] hover:text-white hover:bg-[#162630] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="mt-1.5 text-[#D5DEE5]">{t.nfcTapHelp.summary}</p>
                      <ul className="mt-2 space-y-1 text-[#96A7B4]">
                        <li>{t.nfcTapHelp.iphoneTip}</li>
                        <li>{t.nfcTapHelp.androidTip}</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Calm 2-Column Action Tiles: (Call | WhatsApp) -> (Email | Website) -> (Company Profile | Map) -> Save Contact */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {/* 1. Call */}
                  <a
                    href={ISONIL_CONTACT.phoneHref}
                    aria-label={t.aria.callAction}
                    className={`isonil-enter isonil-delay-3 ${uniformStandardBtnClass}`}
                  >
                    <Phone className="isonil-btn-icon w-[18px] h-[18px] text-[#4CC3DB] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.call}</span>
                  </a>

                  {/* 2. WhatsApp */}
                  <a
                    href={whatsappDirectHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.whatsappAction}
                    className={`isonil-enter isonil-delay-4 ${uniformStandardBtnClass}`}
                  >
                    <MessageCircle className="isonil-btn-icon w-[18px] h-[18px] text-[#76D4E6] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.whatsapp}</span>
                  </a>

                  {/* 3. Email */}
                  <a
                    href={emailDirectHref}
                    aria-label={t.aria.emailAction}
                    className={`isonil-enter isonil-delay-5 ${uniformStandardBtnClass}`}
                  >
                    <Mail className="isonil-btn-icon w-[18px] h-[18px] text-[#4CC3DB] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.email}</span>
                  </a>

                  {/* 4. Website */}
                  <a
                    href={ISONIL_CONTACT.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.websiteAction}
                    className={`isonil-enter isonil-delay-6 ${uniformStandardBtnClass}`}
                  >
                    <Globe className="isonil-btn-icon w-[18px] h-[18px] text-[#4CC3DB] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.website}</span>
                  </a>

                  {/* 5. Company Profile (Directly after Website — Calm highlighted tile) */}
                  <a
                    href={ISONIL_CONTACT.companyProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.companyProfileAction}
                    className={`isonil-enter isonil-delay-7 ${companyProfileHighlightClass}`}
                  >
                    <FileText className="isonil-btn-icon w-[18px] h-[18px] text-[#76D4E6] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.companyProfile}</span>
                  </a>

                  {/* 6. Location on Map */}
                  <a
                    href={ISONIL_CONTACT.mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.locationAction}
                    className={`isonil-enter isonil-delay-8 ${uniformStandardBtnClass}`}
                  >
                    <MapPin className="isonil-btn-icon w-[18px] h-[18px] text-[#4CC3DB] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.location}</span>
                  </a>

                  {/* 7. Save Contact (Downloads /contact.vcf — Brushed metallic silver-white primary CTA) */}
                  <div className="col-span-2 no-print mt-0.5">
                    <a
                      href={ISONIL_CONTACT.vcardPublicPath}
                      download={ISONIL_CONTACT.vcardFilename}
                      onClick={triggerSaveContactFeedback}
                      aria-label={t.aria.saveContactAction}
                      className={`isonil-enter isonil-delay-9 isonil-btn-primary w-full min-h-[48px] sm:min-h-[50px] px-4 py-2.5 rounded-xl border border-white/50 text-[#0E1419] text-sm font-bold flex items-center justify-center gap-2.5 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer ${
                        contactSavedFeedback
                          ? 'bg-[#D7F4FA] hover:bg-[#D7F4FA]'
                          : 'bg-gradient-to-b from-white via-[#F3F7FA] to-[#DFE7ED] hover:from-white hover:to-[#E9EFF4] active:bg-[#D7F4FA]'
                      }`}
                    >
                      {contactSavedFeedback ? (
                        <>
                          <Check className="isonil-check-pop w-5 h-5 text-[#0E1419] shrink-0" />
                          <span className="whitespace-nowrap">{t.actions.contactReady}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="isonil-btn-icon w-5 h-5 text-[#0E1419] shrink-0" />
                          <span className="whitespace-nowrap">{t.actions.saveContact}</span>
                        </>
                      )}
                    </a>
                  </div>
                </div>
              </section>

              {/* Social Media Row at the very end of the primary card ("تابعنا" + circular react-icons) */}
              <section
                aria-labelledby="isonil-follow-us-heading"
                className={`isonil-enter isonil-delay-10 mt-5 pt-4 border-t border-[#CBD5E1]/12 text-center no-print ${langAnimClass}`}
              >
                <h2
                  id="isonil-follow-us-heading"
                  className="text-xs font-semibold text-[#96A7B4] mb-3"
                >
                  {t.sections.followUs}
                </h2>

                <div className="flex items-center justify-center gap-3.5">
                  <a
                    href={ISONIL_CONTACT.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.linkedinAction}
                    className="isonil-icon-btn w-11 h-11 rounded-full bg-[#0D141A] hover:bg-[#142630] active:bg-[#162B37] border border-[#CBD5E1]/18 hover:border-[#3DC4DC]/55 text-[#D5DEE5] hover:text-white flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC]"
                  >
                    <FaLinkedinIn className="w-[17px] h-[17px]" aria-hidden="true" />
                  </a>

                  <a
                    href={ISONIL_CONTACT.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.facebookAction}
                    className="isonil-icon-btn w-11 h-11 rounded-full bg-[#0D141A] hover:bg-[#142630] active:bg-[#162B37] border border-[#CBD5E1]/18 hover:border-[#3DC4DC]/55 text-[#D5DEE5] hover:text-white flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC]"
                  >
                    <FaFacebookF className="w-[16px] h-[16px]" aria-hidden="true" />
                  </a>

                  <a
                    href={ISONIL_CONTACT.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.instagramAction}
                    className="isonil-icon-btn w-11 h-11 rounded-full bg-[#0D141A] hover:bg-[#142630] active:bg-[#162B37] border border-[#CBD5E1]/18 hover:border-[#3DC4DC]/55 text-[#D5DEE5] hover:text-white flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC]"
                  >
                    <FaInstagram className="w-[17px] h-[17px]" aria-hidden="true" />
                  </a>
                </div>
              </section>
            </div>
          </article>

          {/* Secondary Column: Permanent Scannable QR Code (untouched) + Compact Organized Contact Directory */}
          <aside className="lg:col-span-5 min-w-0 flex flex-col gap-4 sm:gap-5">
            <div id="isonil-qr-section" className="isonil-enter isonil-delay-2 scroll-mt-4">
              <QrCodePanel
                t={t}
                langAnimClass={langAnimClass}
                onNotify={showToast}
                onCopyUrl={() =>
                  handleCopyValue('url', ISONIL_CONTACT.cardCanonicalUrl, t.toasts.linkCopied)
                }
                onShareCard={handleShareCard}
                urlCopied={copiedField === 'url'}
              />
            </div>

            {/* Official Contact Details & Share / Bookmark Controls (Desktop only; hidden on mobile with lossless revert) */}
            <section
              aria-labelledby="isonil-contact-details-heading"
              className={`hidden lg:block isonil-enter isonil-delay-11 bg-[#111920] rounded-2xl border border-[#CBD5E1]/16 shadow-[0_20px_50px_-16px_rgba(3,7,11,0.75),inset_0_1px_0_rgba(226,234,240,0.08)] p-5 sm:p-6 ${langAnimClass}`}
            >
              <h2
                id="isonil-contact-details-heading"
                className="text-xs font-semibold text-[#96A7B4] mb-2"
              >
                {t.sections.contactDetails}
              </h2>

              <dl className="divide-y divide-[#CBD5E1]/10">
                {/* Phone & WhatsApp */}
                <div className="py-1.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-[#141F29] flex items-center justify-between gap-2.5">
                  <div className="relative min-w-0 flex-1 min-h-[50px] py-1.5 flex items-center gap-3 group">
                    <Phone aria-hidden="true" className="w-4 h-4 text-[#4CC3DB]/85 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-[11px] text-[#9AA9B5]">{t.fields.phoneAndWhatsapp}</dt>
                      <dd className="mt-0.5">
                        <a
                          href={ISONIL_CONTACT.phoneHref}
                          aria-label={t.aria.callAction}
                          dir="ltr"
                          className="ltr-isolate font-mono tabular-nums text-sm sm:text-[15px] font-semibold text-white group-hover:text-[#76D4E6] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] rounded after:content-[''] after:absolute after:inset-0"
                        >
                          {ISONIL_CONTACT.phoneDisplay}
                        </a>
                      </dd>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyValue(
                        'phone',
                        ISONIL_CONTACT.phoneDisplay,
                        t.toasts.phoneCopied
                      )
                    }
                    aria-label={t.aria.copyPhone}
                    className={`relative z-10 isonil-icon-btn min-h-[44px] min-w-[44px] px-2.5 rounded-xl flex items-center justify-center gap-1.5 shrink-0 no-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer ${
                      copiedField === 'phone'
                        ? 'bg-[#4CC3DB]/16 text-[#76D4E6]'
                        : 'text-[#9AA9B5] hover:text-white hover:bg-[#17222B] active:bg-[#17222B]'
                    }`}
                  >
                    {copiedField === 'phone' ? (
                      <>
                        <Check className="isonil-check-pop w-4 h-4 text-[#76D4E6] shrink-0" />
                        <span className="text-xs font-medium text-[#76D4E6] whitespace-nowrap">
                          {t.actions.copied}
                        </span>
                      </>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Official Email */}
                <div className="py-1.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-[#141F29] flex items-center justify-between gap-2.5">
                  <div className="relative min-w-0 flex-1 min-h-[50px] py-1.5 flex items-center gap-3 group">
                    <Mail aria-hidden="true" className="w-4 h-4 text-[#4CC3DB]/85 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-[11px] text-[#9AA9B5]">{t.fields.email}</dt>
                      <dd className="mt-0.5">
                        <a
                          href={emailDirectHref}
                          aria-label={t.aria.emailAction}
                          dir="ltr"
                          className="ltr-isolate text-sm sm:text-[15px] font-medium text-white group-hover:text-[#76D4E6] transition-colors break-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] rounded after:content-[''] after:absolute after:inset-0"
                        >
                          {ISONIL_CONTACT.email}
                        </a>
                      </dd>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyValue('email', ISONIL_CONTACT.email, t.toasts.emailCopied)
                    }
                    aria-label={t.aria.copyEmail}
                    className={`relative z-10 isonil-icon-btn min-h-[44px] min-w-[44px] px-2.5 rounded-xl flex items-center justify-center gap-1.5 shrink-0 no-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer ${
                      copiedField === 'email'
                        ? 'bg-[#4CC3DB]/16 text-[#76D4E6]'
                        : 'text-[#9AA9B5] hover:text-white hover:bg-[#17222B] active:bg-[#17222B]'
                    }`}
                  >
                    {copiedField === 'email' ? (
                      <>
                        <Check className="isonil-check-pop w-4 h-4 text-[#76D4E6] shrink-0" />
                        <span className="text-xs font-medium text-[#76D4E6] whitespace-nowrap">
                          {t.actions.copied}
                        </span>
                      </>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Official Website */}
                <div className="py-1.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-[#141F29] flex items-center justify-between gap-2.5">
                  <div className="relative min-w-0 flex-1 min-h-[50px] py-1.5 flex items-center gap-3 group">
                    <Globe aria-hidden="true" className="w-4 h-4 text-[#4CC3DB]/85 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-[11px] text-[#9AA9B5]">{t.fields.website}</dt>
                      <dd className="mt-0.5">
                        <a
                          href={ISONIL_CONTACT.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t.aria.websiteAction}
                          dir="ltr"
                          className="ltr-isolate text-sm sm:text-[15px] font-medium text-[#5EC6DA] group-hover:text-[#76D4E6] transition-colors break-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] rounded after:content-[''] after:absolute after:inset-0"
                        >
                          {ISONIL_CONTACT.websiteUrl}
                        </a>
                      </dd>
                    </div>
                  </div>
                  <a
                    href={ISONIL_CONTACT.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.websiteAction}
                    className="relative z-10 isonil-icon-btn min-h-[44px] min-w-[44px] rounded-xl text-[#9AA9B5] hover:text-white hover:bg-[#17222B] active:bg-[#17222B] flex items-center justify-center shrink-0 no-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB]"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Official Address */}
                <div className="pt-3 pb-1 -mx-2 px-2 rounded-xl transition-colors hover:bg-[#141F29] flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1 flex items-start gap-3">
                    <MapPin aria-hidden="true" className="w-4 h-4 mt-1 text-[#4CC3DB]/85 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-[11px] text-[#9AA9B5]">{t.fields.address}</dt>
                      <dd className="mt-0.5 text-[13px] sm:text-sm font-medium text-white/95 leading-relaxed">
                        <span dir="ltr" className="ltr-isolate text-start break-words max-w-full">
                          {ISONIL_CONTACT.address}
                        </span>
                      </dd>
                      <div className="mt-1 no-print">
                        <a
                          href={ISONIL_CONTACT.mapsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t.aria.locationAction}
                          className="inline-flex items-center gap-1.5 min-h-[40px] -ms-2 px-2 rounded-lg text-xs font-semibold text-[#5EC6DA] hover:text-[#76D4E6] hover:bg-[#17222B]/70 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB]"
                        >
                          <span>{t.actions.openMap}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#4CC3DB] rtl:-scale-x-100 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyValue(
                        'address',
                        ISONIL_CONTACT.address,
                        t.toasts.addressCopied
                      )
                    }
                    aria-label={t.aria.copyAddress}
                    className={`isonil-icon-btn min-h-[44px] min-w-[44px] px-2.5 rounded-xl flex items-center justify-center gap-1.5 shrink-0 no-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer ${
                      copiedField === 'address'
                        ? 'bg-[#4CC3DB]/16 text-[#76D4E6]'
                        : 'text-[#9AA9B5] hover:text-white hover:bg-[#17222B]'
                    }`}
                  >
                    {copiedField === 'address' ? (
                      <>
                        <Check className="isonil-check-pop w-4 h-4 text-[#76D4E6] shrink-0" />
                        <span className="text-xs font-medium text-[#76D4E6] whitespace-nowrap">
                          {t.actions.copied}
                        </span>
                      </>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </dl>

              {/* Compact 2-column Share & Favorites Utility Row */}
              <div className="mt-4 pt-4 border-t border-[#CBD5E1]/12 grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5 no-print">
                <button
                  type="button"
                  onClick={handleShareCard}
                  aria-label={t.aria.shareCardAction}
                  className={utilityActionBtnClass}
                >
                  <Share2 className="isonil-btn-icon w-4 h-4 text-[#3DC4DC] shrink-0" />
                  <span className="truncate">{t.actions.shareCard}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenFavorites}
                  aria-label={t.aria.favoritesAction}
                  aria-pressed={isFavorite}
                  className={`isonil-btn w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] cursor-pointer ${
                    isFavorite
                      ? 'border-[#E50914]/45 bg-[#E50914]/10 text-white hover:bg-[#E50914]/18 active:bg-[#E50914]/22'
                      : 'border-[#CBD5E1]/14 hover:border-[#3DC4DC]/50 active:border-[#3DC4DC]/65 bg-[#0D141A] hover:bg-[#14222B] active:bg-[#162732] text-white'
                  }`}
                >
                  <Bookmark
                    className={`isonil-btn-icon w-4 h-4 shrink-0 ${
                      isFavorite ? 'fill-[#E50914] text-[#E50914]' : 'text-[#3DC4DC]'
                    }`}
                  />
                  <span className="truncate">
                    {isFavorite ? t.actions.savedInFavorites : t.actions.addToFavorites}
                  </span>
                </button>
              </div>
            </section>
          </aside>
        </div>

        {/* Quiet Official Notice Footer (Single active language; desktop utility links stay lg:flex only) */}
        <footer className={`isonil-enter isonil-delay-12 mt-6 sm:mt-8 flex flex-col lg:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-[#96A7B4] px-1 text-center lg:text-start ${langAnimClass}`}>
          <p>{t.footer.officialNotice}</p>
          <div className="hidden lg:flex items-center justify-center gap-4 flex-wrap shrink-0">
            <a
              href={ISONIL_CONTACT.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.aria.websiteAction}
              dir="ltr"
              className="ltr-isolate font-medium text-[#D5DEE5] hover:text-[#6AD8EB] transition-colors"
            >
              {ISONIL_CONTACT.websiteDisplay}
            </a>
            <span aria-hidden="true" className="text-[#CBD5E1]/35 no-print">
              ·
            </span>
            <button
              type="button"
              onClick={() => setNfcModalOpen(true)}
              aria-label={t.nfc.triggerAria}
              className="isonil-icon-btn no-print min-h-[44px] inline-flex items-center gap-1.5 font-medium text-[#96A7B4] hover:text-[#6AD8EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DC4DC] rounded-lg px-2 cursor-pointer"
            >
              <Nfc className="w-3.5 h-3.5 text-[#3DC4DC] shrink-0" />
              <span className="whitespace-nowrap">{t.nfc.triggerLabel}</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Favorites & Browser Bookmarking Modal */}
      <FavoritesModal
        isOpen={favoritesModalOpen}
        isFavorite={isFavorite}
        t={t}
        urlCopied={copiedField === 'url'}
        onClose={() => setFavoritesModalOpen(false)}
        onToggleFavorite={handleToggleFavorite}
        onCopyUrl={() =>
          handleCopyValue('url', ISONIL_CONTACT.cardCanonicalUrl, t.toasts.linkCopied)
        }
      />

      {/* NFC Setup & Preparation Management Modal */}
      <NfcSettingsModal
        isOpen={nfcModalOpen}
        t={t}
        urlCopied={copiedField === 'url'}
        onClose={() => {
          setNfcModalOpen(false);
          if (window.location.hash === '#nfc-settings') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
        onCopyNfcUrl={() =>
          handleCopyValue('url', ISONIL_CONTACT.cardCanonicalUrl, t.nfc.nfcLinkCopiedToast)
        }
        onDownloadVCard={handleSaveContactFromModal}
        onNotify={showToast}
      />

      {/* Accessible Non-Intrusive Feedback Toast */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] lg:bottom-5 z-50 flex justify-center no-print transition-transform duration-200"
      >
        {toastMessage && (
          <div
            key={toastMessage}
            className="isonil-toast-enter pointer-events-auto max-w-md bg-white text-[#0C1217] text-xs sm:text-sm font-semibold ps-4 pe-2 py-2.5 rounded-xl shadow-lg border border-[#4CC3DB]/55 inline-flex items-center gap-2.5"
          >
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              aria-label={t.dismissToast}
              className="min-h-[32px] min-w-[32px] rounded-lg text-[#0C1217]/65 hover:text-[#0C1217] hover:bg-[#0C1217]/10 flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0C1217] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
