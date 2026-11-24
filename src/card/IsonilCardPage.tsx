import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  Briefcase,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageCircle,
  Nfc,
  Phone,
  Share2,
  UserPlus,
  X,
} from 'lucide-react';
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
import { FacebookIcon, InstagramIcon, LinkedInIcon } from './SocialIcons';

const FavoritesModal = lazy(() =>
  import('./FavoritesModal').then((mod) => ({ default: mod.FavoritesModal }))
);
const NfcSettingsModal = lazy(() =>
  import('./NfcSettingsModal').then((mod) => ({ default: mod.NfcSettingsModal }))
);
const NfcTapHelpModal = lazy(() =>
  import('./NfcTapHelpModal').then((mod) => ({ default: mod.NfcTapHelpModal }))
);
const QuickInquiryModal = lazy(() =>
  import('./QuickInquiryModal').then((mod) => ({ default: mod.QuickInquiryModal }))
);

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
  const [initialIntroDir] = useState<'ltr' | 'rtl'>(() => CARD_TRANSLATIONS[lang].dir);
  const [introSettled, setIntroSettled] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(getSavedFavorite);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [nfcTapHelpOpen, setNfcTapHelpOpen] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [nfcModalOpen, setNfcModalOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return window.location.hash === '#nfc-settings' || params.get('admin') === 'nfc';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<
    'url' | 'phone' | 'email' | 'address' | 'all' | 'inquiry' | null
  >(null);
  const [contactSavedFeedback, setContactSavedFeedback] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [langAnimPhase, setLangAnimPhase] = useState<'idle' | 'a' | 'b'>('idle');

  const toastTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const vcardTimerRef = useRef<number | null>(null);

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

  // Persist card-only language preference without altering any main-site language state or replaying the opening intro
  const handleSelectLanguage = (nextLang: CardLanguage) => {
    if (nextLang === lang) return;
    triggerSubtleHaptic();
    setIntroSettled(true);
    setLang(nextLang);
    setLangAnimPhase((prev) => (prev === 'a' ? 'b' : 'a'));
    try {
      window.localStorage.setItem(STORAGE_LANG_KEY, nextLang);
    } catch {
      // Ignore restricted storage errors gracefully
    }
  };

  // Sync page metadata, OpenGraph/Twitter tags, html lang, and html dir for screen readers & native browser ergonomics
  useEffect(() => {
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;
    const previousDir = document.documentElement.dir;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
    const ogDescMeta = document.querySelector('meta[property="og:description"]');
    const twitterTitleMeta = document.querySelector('meta[name="twitter:title"]');
    const twitterDescMeta = document.querySelector('meta[name="twitter:description"]');

    const previousDescription = descriptionMeta?.getAttribute('content') ?? null;
    const previousOgTitle = ogTitleMeta?.getAttribute('content') ?? null;
    const previousOgDesc = ogDescMeta?.getAttribute('content') ?? null;
    const previousTwitterTitle = twitterTitleMeta?.getAttribute('content') ?? null;
    const previousTwitterDesc = twitterDescMeta?.getAttribute('content') ?? null;

    document.title = t.metaTitle;
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
    descriptionMeta?.setAttribute('content', t.metaDescription);
    ogTitleMeta?.setAttribute('content', t.metaTitle);
    ogDescMeta?.setAttribute('content', t.metaDescription);
    twitterTitleMeta?.setAttribute('content', t.share.title);
    twitterDescMeta?.setAttribute('content', t.share.text);

    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousLang;
      document.documentElement.dir = previousDir;
      if (descriptionMeta && previousDescription !== null) {
        descriptionMeta.setAttribute('content', previousDescription);
      }
      if (ogTitleMeta && previousOgTitle !== null) {
        ogTitleMeta.setAttribute('content', previousOgTitle);
      }
      if (ogDescMeta && previousOgDesc !== null) {
        ogDescMeta.setAttribute('content', previousOgDesc);
      }
      if (twitterTitleMeta && previousTwitterTitle !== null) {
        twitterTitleMeta.setAttribute('content', previousTwitterTitle);
      }
      if (twitterDescMeta && previousTwitterDesc !== null) {
        twitterDescMeta.setAttribute('content', previousTwitterDesc);
      }
    };
  }, [lang, t.dir, t.metaTitle, t.metaDescription, t.share.title, t.share.text]);

  useEffect(() => {
    const introDoneTimer = window.setTimeout(() => {
      setIntroSettled(true);
    }, 3750);

    const handleHashChange = () => {
      const params = new URLSearchParams(window.location.search);
      setNfcModalOpen(
        window.location.hash === '#nfc-settings' || params.get('admin') === 'nfc'
      );
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.clearTimeout(introDoneTimer);
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
    async (
      field: 'url' | 'phone' | 'email' | 'address' | 'all' | 'inquiry',
      value: string,
      successText: string
    ) => {
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

  const handleCopyAllDetails = useCallback(() => {
    const summaryBlock = [
      `${ISONIL_CONTACT.company} — ${t.displayName}`,
      t.businessActivity.replace('\n', ' '),
      `${t.fields.phoneAndWhatsapp}: ${ISONIL_CONTACT.phoneDisplay}`,
      `${t.fields.email}: ${ISONIL_CONTACT.email}`,
      `${t.fields.website}: ${ISONIL_CONTACT.websiteUrl}`,
      `${t.fields.clientPortal}: ${ISONIL_CONTACT.clientPortalUrl}`,
      `${t.fields.address}: ${ISONIL_CONTACT.address}`,
      `${t.sections.permanentLinkLabel}: ${ISONIL_CONTACT.cardCanonicalUrl}`,
    ].join('\n');
    void handleCopyValue('all', summaryBlock, t.toasts.allDetailsCopied);
  }, [handleCopyValue, t]);

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
    triggerSubtleHaptic();
    setFavoritesModalOpen(true);
  };

  // Refined Architectural Smoked-Obsidian & Satin-Crystal Glass system (graduated translucency)
  const uniformStandardBtnClass =
    'isonil-btn isonil-glass-tile group w-full min-w-0 min-h-[62px] min-[390px]:min-h-[66px] sm:min-h-[72px] px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-[13px] sm:rounded-[14px] border text-[#EBF1F6] hover:text-white text-xs sm:text-[13px] font-medium flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer';

  const utilityActionBtnClass =
    'isonil-btn isonil-glass-tile group w-full min-h-[48px] px-3.5 py-2.5 rounded-[14px] border text-[#EBF1F6] hover:text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer';

  return (
    <div
      dir={t.dir}
      lang={lang}
      className={`min-h-[100dvh] w-full max-w-full relative overflow-x-clip bg-[#10171D] text-white ${
        isRtl ? 'font-[var(--font-arabic)]' : 'font-[var(--font-sans)]'
      }`}
    >
      {/* Paper-card inspired ambient backdrop: soft corner cyan arcs + subtle refractive light washes behind glass */}
      <div
        aria-hidden="true"
        className="isonil-bg-atmosphere pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 start-1/4 w-[420px] h-[320px] sm:w-[640px] sm:h-[420px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(69,196,220,0.12),rgba(22,40,49,0.06)_52%,transparent_76%)] blur-3xl" />
        <div className="absolute bottom-[-8%] end-[8%] w-[360px] h-[300px] sm:w-[560px] sm:h-[420px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(122,218,233,0.09),rgba(22,40,49,0.05)_50%,transparent_75%)] blur-3xl" />
        <div className="absolute top-[42%] -start-24 w-[280px] h-[280px] sm:w-[440px] sm:h-[440px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(200,212,223,0.055),transparent_70%)] blur-3xl" />

        <svg
          className="absolute top-0 left-0 w-72 h-72 sm:w-[440px] sm:h-[440px] opacity-65"
          viewBox="0 0 420 420"
          fill="none"
        >
          <defs>
            <linearGradient id="isonil-bg-cyan-tl" x1="0" y1="360" x2="340" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#45C4DC" stopOpacity="0" />
              <stop offset="48%" stopColor="#45C4DC" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#7ADAE9" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 0H360C230 95 110 220 0 380V0Z" fill="#162831" fillOpacity="0.68" />
          <path d="M-8 345C88 195 190 92 318 8" stroke="url(#isonil-bg-cyan-tl)" strokeWidth="2" strokeLinecap="round" />
          <path d="M-6 305C74 185 160 100 260 28" stroke="url(#isonil-bg-cyan-tl)" strokeWidth="1.15" strokeOpacity="0.50" strokeLinecap="round" />
        </svg>

        <svg
          className="absolute bottom-0 right-0 w-72 h-72 sm:w-[440px] sm:h-[440px] opacity-65"
          viewBox="0 0 420 420"
          fill="none"
        >
          <defs>
            <linearGradient id="isonil-bg-cyan-br" x1="80" y1="420" x2="420" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#45C4DC" stopOpacity="0" />
              <stop offset="52%" stopColor="#45C4DC" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#7ADAE9" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M420 420H60C190 325 310 200 420 40V420Z" fill="#162831" fillOpacity="0.68" />
          <path d="M428 75C332 225 230 328 102 412" stroke="url(#isonil-bg-cyan-br)" strokeWidth="2" strokeLinecap="round" />
          <path d="M426 115C346 235 260 320 160 392" stroke="url(#isonil-bg-cyan-br)" strokeWidth="1.15" strokeOpacity="0.50" strokeLinecap="round" />
        </svg>
      </div>

      <a
        href="#isonil-card-main"
        aria-label={t.skipToContent}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-[#F8FAFC] focus:text-[#0D141A] focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-[#45C4DC]"
      >
        {t.skipToContent}
      </a>

      <main id="isonil-card-main" className="relative z-10 w-full max-w-5xl mx-auto safe-area-main">
        {/* Clean Mobile-First Top Bar: Uncapped official label + sleek centered pill switcher on mobile */}
        <header className="isonil-fade flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 mb-4 sm:mb-7 no-print">
          <p
            className={`inline-flex items-center justify-center sm:justify-start gap-2.5 text-[11.5px] min-[390px]:text-xs sm:text-[13px] font-medium text-[#A4B6C4] sm:text-[#AEBECC] leading-snug text-center sm:text-start ${
              isRtl ? '' : 'tracking-[0.02em]'
            } ${langAnimClass}`}
          >
            <span
              aria-hidden="true"
              className="hidden sm:inline-block w-4 h-px bg-gradient-to-r from-[#45C4DC]/80 to-[#7ADAE9]/30 shrink-0"
            />
            <span>{t.cardKicker}</span>
          </p>

          <div
            role="group"
            aria-label={t.languageSelectorAria}
            className="isonil-glass-switcher inline-flex items-center p-1 rounded-xl border max-w-full shrink-0"
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
                  className={`isonil-tab-btn min-h-[44px] min-w-[68px] sm:min-w-[44px] px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer ${
                    active
                      ? 'bg-gradient-to-b from-[#45C4DC]/24 via-white/[0.11] to-white/[0.04] backdrop-blur-md border border-[#7ADAE9]/38 text-[#F8FAFC] shadow-[0_6px_16px_-8px_rgba(69,196,220,0.38),inset_0_1px_0_rgba(255,255,255,0.26)]'
                      : 'border border-transparent text-[#96AAB9] hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Responsive Executive Two-Column Grid (Desktop) / Organized Single-Column Mobile Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-7 items-start">
          {/* Primary Official Card: Translucent Smoked-Obsidian Glass Shell with Crystal Header */}
          <article className="isonil-enter isonil-delay-1 isonil-glass-shell lg:col-span-7 rounded-2xl border ring-1 ring-white/[0.035] overflow-hidden flex flex-col min-w-0">
            {/* Paper-card inspired smoked-glass header band with proportional corner cyan light-arcs */}
            <div className="isonil-glass-header relative overflow-hidden text-[#F8FAFC] px-4 min-[390px]:px-5 sm:px-6.5 pt-5 pb-4.5 sm:pt-7 sm:pb-6.5 border-b border-[#DCE8F2]/10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-[radial-gradient(ellipse_at_top,rgba(69,196,220,0.08),transparent_70%)]"
              />
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 w-28 h-28 sm:w-52 sm:h-52 opacity-60 sm:opacity-75"
                viewBox="0 0 200 200"
                fill="none"
              >
                <defs>
                  <linearGradient id="isonil-hdr-tl" x1="0" y1="160" x2="170" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#45C4DC" stopOpacity="0" />
                    <stop offset="50%" stopColor="#45C4DC" stopOpacity="0.58" />
                    <stop offset="100%" stopColor="#7ADAE9" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 0H175C112 46 56 104 0 175V0Z" fill="#162831" fillOpacity="0.68" />
                <path d="M-4 152C44 92 94 42 156 4" stroke="url(#isonil-hdr-tl)" strokeWidth="1.75" strokeLinecap="round" />
                <path d="M-2 128C38 78 80 38 128 10" stroke="url(#isonil-hdr-tl)" strokeWidth="1" strokeOpacity="0.48" strokeLinecap="round" />
              </svg>

              <svg
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 right-0 w-28 h-28 sm:w-52 sm:h-52 opacity-60 sm:opacity-75"
                viewBox="0 0 200 200"
                fill="none"
              >
                <defs>
                  <linearGradient id="isonil-hdr-br" x1="30" y1="200" x2="200" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#45C4DC" stopOpacity="0" />
                    <stop offset="50%" stopColor="#45C4DC" stopOpacity="0.58" />
                    <stop offset="100%" stopColor="#7ADAE9" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M200 200H25C88 154 144 96 200 25V200Z" fill="#162831" fillOpacity="0.68" />
                <path d="M204 48C156 108 106 158 44 196" stroke="url(#isonil-hdr-br)" strokeWidth="1.75" strokeLinecap="round" />
                <path d="M202 72C162 122 120 162 72 190" stroke="url(#isonil-hdr-br)" strokeWidth="1" strokeOpacity="0.48" strokeLinecap="round" />
              </svg>

              <div
                data-intro-dir={initialIntroDir}
                className={`relative z-10 ${introSettled ? 'isonil-intro-settled' : ''}`}
              >
                {/* Unified Header Unit: Silver-Framed Box -> Red 'i' Entry -> Fixed Latin ISONIL -> Localized Two-Line Slogan */}
                <div className="flex items-center gap-2.5 min-[360px]:gap-3 min-[390px]:gap-3.5 sm:gap-5">
                  <div className="isonil-intro-frame isonil-glass-logo w-[72px] h-[72px] min-[390px]:w-[78px] min-[390px]:h-[78px] sm:w-[94px] sm:h-[94px] shrink-0 rounded-[12px] border border-[#E2ECF5]/30 flex items-center justify-center">
                    {!logoFailed ? (
                      <picture className="isonil-intro-mark w-full h-full flex items-center justify-center">
                        <source srcSet={ISONIL_CONTACT.logoWebpSrc} type="image/webp" />
                        <img
                          src={ISONIL_CONTACT.logoSrc}
                          alt={t.aria.logoAlt}
                          width={94}
                          height={94}
                          decoding="sync"
                          fetchPriority="high"
                          referrerPolicy="no-referrer"
                          onError={() => setLogoFailed(true)}
                          className="w-full h-full object-contain scale-[1.13] [clip-path:inset(5.5%)] bg-transparent"
                        />
                      </picture>
                    ) : (
                      <span className="isonil-intro-mark text-3xl font-bold text-[#E50914] tracking-tight">i</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 text-start">
                    <h1 className="isonil-intro-brand text-[21px] min-[390px]:text-[24px] sm:text-[28px] font-bold tracking-[0.08em] text-[#F8FAFC] leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                      <span dir="ltr" className="ltr-isolate">
                        {ISONIL_CONTACT.company}
                      </span>
                    </h1>
                    <p
                      dir={t.dir}
                      className="isonil-intro-slogan mt-1.5 text-[9.75px] min-[350px]:text-[10.5px] min-[360px]:text-[11.5px] min-[390px]:text-[12.5px] min-[430px]:text-[13.5px] sm:text-[15px] font-normal text-[#C8D4DF] leading-[1.45]"
                    >
                      <span className={`block ${langAnimClass}`.trim()}>
                        {t.businessActivity.split('\n').map((line) => (
                          <span key={line} className="block whitespace-nowrap">
                            {line}
                          </span>
                        ))}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Editorial faded hairline + Secondary Informative Designation centered beneath */}
                <div
                  aria-hidden="true"
                  className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[#CBD8E6]/14 to-transparent"
                />
                <div className="isonil-intro-role pt-3 flex items-center justify-center gap-2.5 text-center">
                  <span
                    aria-hidden="true"
                    className="isonil-accent-line h-[1.5px] w-6 rounded-full bg-gradient-to-r from-transparent via-[#7ADAE9]/85 to-[#45C4DC]/45 shadow-[0_0_10px_rgba(122,218,233,0.25)] shrink-0"
                  />
                  <p className={`text-xs sm:text-[13px] font-medium text-[#6ECFE2] ${isRtl ? '' : 'tracking-[0.02em]'} ${langAnimClass}`}>
                    {t.displayName}
                  </p>
                  <span
                    aria-hidden="true"
                    className="isonil-accent-line h-[1.5px] w-6 rounded-full bg-gradient-to-l from-transparent via-[#7ADAE9]/85 to-[#45C4DC]/45 shadow-[0_0_10px_rgba(122,218,233,0.25)] shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Card Body: Structured mobile-first action tiles + Social footer */}
            <div className="p-4 min-[390px]:p-5 sm:p-6.5 flex-1 flex flex-col">
              <section
                aria-label={t.sections.quickActions}
                className={langAnimClass || undefined}
              >
                {/* Calm 2-Column Action Tiles: (Call | WhatsApp) -> (Email | Website) -> (Company Profile | Map) -> Client Portal -> Save Contact */}
                <div className="grid grid-cols-2 gap-2.5 min-[390px]:gap-3 sm:gap-3.5">
                  {/* 1. Call */}
                  <a
                    href={ISONIL_CONTACT.phoneHref}
                    aria-label={t.aria.callAction}
                    className={`isonil-enter isonil-delay-2 ${uniformStandardBtnClass}`}
                  >
                    <Phone strokeWidth={1.65} className="isonil-btn-icon w-[18px] h-[18px] text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.call}</span>
                  </a>

                  {/* 2. WhatsApp */}
                  <a
                    href={whatsappDirectHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.whatsappAction}
                    className={`isonil-enter isonil-delay-3 ${uniformStandardBtnClass}`}
                  >
                    <MessageCircle strokeWidth={1.65} className="isonil-btn-icon w-[18px] h-[18px] text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.whatsapp}</span>
                  </a>

                  {/* 3. Email */}
                  <a
                    href={emailDirectHref}
                    aria-label={t.aria.emailAction}
                    className={`isonil-enter isonil-delay-4 ${uniformStandardBtnClass}`}
                  >
                    <Mail strokeWidth={1.65} className="isonil-btn-icon w-[18px] h-[18px] text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.email}</span>
                  </a>

                  {/* 4. Website */}
                  <a
                    href={ISONIL_CONTACT.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.websiteAction}
                    className={`isonil-enter isonil-delay-5 ${uniformStandardBtnClass}`}
                  >
                    <Globe strokeWidth={1.65} className="isonil-btn-icon w-[18px] h-[18px] text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.website}</span>
                  </a>

                  {/* 5. Company Profile (Directly after Website — Unified tile lighting & shape) */}
                  <a
                    href={ISONIL_CONTACT.companyProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.companyProfileAction}
                    className={`isonil-enter isonil-delay-6 ${uniformStandardBtnClass}`}
                  >
                    <FileText strokeWidth={1.65} className="isonil-btn-icon w-[18px] h-[18px] text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.companyProfile}</span>
                  </a>

                  {/* 6. Location on Map */}
                  <a
                    href={ISONIL_CONTACT.mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.locationAction}
                    className={`isonil-enter isonil-delay-7 ${uniformStandardBtnClass}`}
                  >
                    <MapPin strokeWidth={1.65} className="isonil-btn-icon w-[18px] h-[18px] text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
                    <span className="leading-tight text-balance">{t.actions.location}</span>
                  </a>

                  {/* 7. Client Portal (Full-width size preserved, unified tile lighting & shape) */}
                  <div className="col-span-2">
                    <a
                      href={ISONIL_CONTACT.clientPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.aria.clientPortalAction}
                      className={`isonil-enter isonil-delay-8 ${uniformStandardBtnClass}`}
                    >
                      <LayoutDashboard strokeWidth={1.65} className="isonil-btn-icon w-[18px] h-[18px] text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
                      <span className="leading-tight text-balance">{t.actions.clientPortal}</span>
                    </a>
                  </div>

                  {/* 8. Save Contact (Downloads /contact.vcf — Restful smoked-cyan glassmorphic primary CTA) */}
                  <div className="col-span-2 no-print mt-1.5">
                    <a
                      href={ISONIL_CONTACT.vcardPublicPath}
                      download={ISONIL_CONTACT.vcardFilename}
                      onClick={triggerSaveContactFeedback}
                      aria-label={t.aria.saveContactAction}
                      className={`isonil-enter isonil-delay-9 isonil-btn-primary w-full min-h-[52px] px-4 py-2.5 rounded-[14px] backdrop-blur-xl text-[#F8FAFC] text-sm font-semibold ${
                        isRtl ? '' : 'tracking-[0.015em]'
                      } flex items-center justify-center gap-2.5 shadow-[0_14px_30px_-14px_rgba(69,196,220,0.36),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(69,196,220,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer ${
                        contactSavedFeedback
                          ? 'border border-[#7ADAE9]/65 bg-gradient-to-b from-[#45C4DC]/[0.32] via-[#7ADAE9]/[0.15] to-[#45C4DC]/[0.11]'
                          : 'border border-[#7ADAE9]/38 hover:border-[#7ADAE9]/60 active:border-[#7ADAE9]/75 bg-gradient-to-b from-[#45C4DC]/[0.20] via-white/[0.09] to-[#45C4DC]/[0.07] hover:from-[#45C4DC]/[0.28] hover:via-white/[0.13] hover:to-[#45C4DC]/[0.10]'
                      }`}
                    >
                      {contactSavedFeedback ? (
                        <>
                          <Check strokeWidth={1.9} className="isonil-check-pop w-5 h-5 text-[#7ADAE9] shrink-0" />
                          <span className="whitespace-nowrap">{t.actions.contactReady}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus strokeWidth={1.75} className="isonil-btn-icon w-5 h-5 text-[#7ADAE9] shrink-0" />
                          <span className="whitespace-nowrap">{t.actions.saveContact}</span>
                        </>
                      )}
                    </a>
                  </div>

                  {/* 9. Structured B2B Project Inquiry / Quote Composer (Sheer veil glass below dominant Save Contact CTA) */}
                  <div className="col-span-2 no-print">
                    <button
                      type="button"
                      onClick={() => {
                        triggerSubtleHaptic();
                        setInquiryModalOpen(true);
                      }}
                      aria-haspopup="dialog"
                      aria-label={t.aria.requestQuoteAction}
                      className="isonil-enter isonil-delay-10 isonil-btn isonil-glass-veil group w-full min-h-[46px] px-4 py-2.5 rounded-[13px] border text-[#C8D4DF] hover:text-white text-xs sm:text-[13px] font-medium flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
                    >
                      <Briefcase strokeWidth={1.65} className="isonil-btn-icon w-4 h-4 text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
                      <span className="truncate">{t.actions.requestQuote}</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Social Media Row at the very end of the primary card ("تابعنا" + jewel-cut glass medallions) */}
              <div
                aria-hidden="true"
                className="mt-5 sm:mt-6 h-px w-full bg-gradient-to-r from-transparent via-[#DCE8F2]/16 to-transparent no-print"
              />
              <section
                aria-labelledby="isonil-follow-us-heading"
                className={`isonil-enter isonil-delay-10 pt-4 sm:pt-5 text-center no-print ${langAnimClass}`}
              >
                <h2
                  id="isonil-follow-us-heading"
                  className={`text-[#8699A8] mb-3.5 font-medium ${
                    isRtl ? 'text-xs' : 'text-[11px] uppercase tracking-[0.14em]'
                  }`}
                >
                  {t.sections.followUs}
                </h2>

                <div className="flex items-center justify-center gap-4">
                  <a
                    href={ISONIL_CONTACT.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.linkedinAction}
                    className="isonil-icon-btn isonil-glass-medallion w-11 h-11 rounded-full border text-[#B9C7D4] hover:text-[#7ADAE9] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC]"
                  >
                    <LinkedInIcon className="w-[18px] h-[18px]" />
                  </a>

                  <a
                    href={ISONIL_CONTACT.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.facebookAction}
                    className="isonil-icon-btn isonil-glass-medallion w-11 h-11 rounded-full border text-[#B9C7D4] hover:text-[#7ADAE9] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC]"
                  >
                    <FacebookIcon className="w-[17px] h-[17px]" />
                  </a>

                  <a
                    href={ISONIL_CONTACT.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.instagramAction}
                    className="isonil-icon-btn isonil-glass-medallion w-11 h-11 rounded-full border text-[#B9C7D4] hover:text-[#7ADAE9] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC]"
                  >
                    <InstagramIcon className="w-[17px] h-[17px]" />
                  </a>
                </div>
              </section>
            </div>
          </article>

          {/* Secondary Column: Permanent Scannable QR Code + Compact Organized Contact Directory */}
          <aside className="lg:col-span-5 min-w-0 flex flex-col gap-5 sm:gap-6">
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

            {/* Official Contact Details & Share / Bookmark Controls: Translucent smoked-glass shell */}
            <section
              aria-labelledby="isonil-contact-details-heading"
              className={`isonil-enter isonil-delay-11 isonil-glass-shell rounded-2xl border ring-1 ring-white/[0.03] p-4 min-[390px]:p-5 sm:p-6.5 ${langAnimClass}`}
            >
              {/* Mobile/Tablet sleek disclosure toggle */}
              <button
                type="button"
                onClick={() => {
                  triggerSubtleHaptic();
                  setMobileDetailsOpen((prev) => !prev);
                }}
                aria-expanded={mobileDetailsOpen}
                aria-controls="isonil-contact-details-body"
                className="lg:hidden w-full min-h-[44px] flex items-center justify-between gap-3 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] rounded-lg cursor-pointer no-print"
              >
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-[#F8FAFC]">
                    {t.sections.contactDetails}
                  </span>
                  <span className="block text-xs text-[#8B9EAD] mt-0.5 truncate">
                    {t.sections.contactDetailsHint}
                  </span>
                </div>
                <ChevronDown
                  strokeWidth={1.75}
                  className={`w-4 h-4 text-[#45C4DC] shrink-0 transition-transform duration-200 ${
                    mobileDetailsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Desktop permanent heading + Copy All action */}
              <div className="hidden lg:flex print:flex items-center justify-between gap-2 mb-2.5">
                <h2
                  id="isonil-contact-details-heading"
                  className={`text-[#8B9EAD] font-semibold ${
                    isRtl ? 'text-xs' : 'text-[11px] uppercase tracking-[0.12em]'
                  }`}
                >
                  {t.sections.contactDetails}
                </h2>
                <button
                  type="button"
                  onClick={handleCopyAllDetails}
                  aria-label={t.aria.copyAllDetails}
                  className="isonil-icon-btn no-print min-h-[36px] px-2.5 rounded-lg text-xs font-medium text-[#66D1E6] hover:text-[#7ADAE9] hover:bg-[#1C2A36] inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check strokeWidth={1.75} className="isonil-check-pop w-3.5 h-3.5 text-[#7ADAE9]" />
                      <span className="text-[#7ADAE9]">{t.actions.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy strokeWidth={1.65} className="w-3.5 h-3.5" />
                      <span>{t.actions.copyAllDetails}</span>
                    </>
                  )}
                </button>
              </div>

              <div
                id="isonil-contact-details-body"
                className={`${mobileDetailsOpen ? 'block mt-3 pt-3 border-t border-[#CBD8E6]/10' : 'hidden'} lg:block lg:mt-0 lg:pt-0 lg:border-t-0 print:block print:mt-0 print:pt-0 print:border-t-0`}
              >
                <div className="flex lg:hidden justify-end mb-1.5 no-print">
                  <button
                    type="button"
                    onClick={handleCopyAllDetails}
                    aria-label={t.aria.copyAllDetails}
                    className="isonil-icon-btn min-h-[40px] px-2.5 rounded-lg text-xs font-medium text-[#66D1E6] hover:text-[#7ADAE9] hover:bg-[#1C2A36] inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
                  >
                    {copiedField === 'all' ? (
                      <>
                        <Check strokeWidth={1.75} className="isonil-check-pop w-3.5 h-3.5 text-[#7ADAE9]" />
                        <span className="text-[#7ADAE9]">{t.actions.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy strokeWidth={1.65} className="w-3.5 h-3.5" />
                        <span>{t.actions.copyAllDetails}</span>
                      </>
                    )}
                  </button>
                </div>

                <dl className="divide-y divide-[#DCE8F2]/10">
                {/* Phone & WhatsApp */}
                <div className="py-1.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-white/[0.045] flex items-center justify-between gap-2.5">
                  <div className="relative min-w-0 flex-1 min-h-[50px] py-1.5 flex items-center gap-3 group">
                    <Phone aria-hidden="true" strokeWidth={1.65} className="w-4 h-4 text-[#45C4DC]/85 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-[11px] text-[#8B9EAD]">{t.fields.phoneAndWhatsapp}</dt>
                      <dd className="mt-0.5">
                        <a
                          href={ISONIL_CONTACT.phoneHref}
                          aria-label={t.aria.callAction}
                          dir="ltr"
                          className="ltr-isolate font-mono tabular-nums text-sm sm:text-[15px] font-semibold text-[#F8FAFC] group-hover:text-[#7ADAE9] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] rounded after:content-[''] after:absolute after:inset-0"
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
                    className={`relative z-10 isonil-icon-btn min-h-[44px] min-w-[44px] px-2.5 rounded-xl flex items-center justify-center gap-1.5 shrink-0 no-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer ${
                      copiedField === 'phone'
                        ? 'bg-[#45C4DC]/18 text-[#7ADAE9]'
                        : 'text-[#8B9EAD] hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12]'
                    }`}
                  >
                    {copiedField === 'phone' ? (
                      <>
                        <Check strokeWidth={1.75} className="isonil-check-pop w-4 h-4 text-[#7ADAE9] shrink-0" />
                        <span className="text-xs font-medium text-[#7ADAE9] whitespace-nowrap">
                          {t.actions.copied}
                        </span>
                      </>
                    ) : (
                      <Copy strokeWidth={1.65} className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Official Email */}
                <div className="py-1.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-white/[0.045] flex items-center justify-between gap-2.5">
                  <div className="relative min-w-0 flex-1 min-h-[50px] py-1.5 flex items-center gap-3 group">
                    <Mail aria-hidden="true" strokeWidth={1.65} className="w-4 h-4 text-[#45C4DC]/85 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-[11px] text-[#8B9EAD]">{t.fields.email}</dt>
                      <dd className="mt-0.5">
                        <a
                          href={emailDirectHref}
                          aria-label={t.aria.emailAction}
                          dir="ltr"
                          className="ltr-isolate text-sm sm:text-[15px] font-medium text-[#F8FAFC] group-hover:text-[#7ADAE9] transition-colors break-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] rounded after:content-[''] after:absolute after:inset-0"
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
                    className={`relative z-10 isonil-icon-btn min-h-[44px] min-w-[44px] px-2.5 rounded-xl flex items-center justify-center gap-1.5 shrink-0 no-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer ${
                      copiedField === 'email'
                        ? 'bg-[#45C4DC]/18 text-[#7ADAE9]'
                        : 'text-[#8B9EAD] hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12]'
                    }`}
                  >
                    {copiedField === 'email' ? (
                      <>
                        <Check strokeWidth={1.75} className="isonil-check-pop w-4 h-4 text-[#7ADAE9] shrink-0" />
                        <span className="text-xs font-medium text-[#7ADAE9] whitespace-nowrap">
                          {t.actions.copied}
                        </span>
                      </>
                    ) : (
                      <Copy strokeWidth={1.65} className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Official Website */}
                <div className="py-1.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-white/[0.045] flex items-center justify-between gap-2.5">
                  <div className="relative min-w-0 flex-1 min-h-[50px] py-1.5 flex items-center gap-3 group">
                    <Globe aria-hidden="true" strokeWidth={1.65} className="w-4 h-4 text-[#45C4DC]/85 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-[11px] text-[#8B9EAD]">{t.fields.website}</dt>
                      <dd className="mt-0.5">
                        <a
                          href={ISONIL_CONTACT.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t.aria.websiteAction}
                          dir="ltr"
                          className="ltr-isolate text-sm sm:text-[15px] font-medium text-[#66D1E6] group-hover:text-[#7ADAE9] transition-colors break-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] rounded after:content-[''] after:absolute after:inset-0"
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
                    className="relative z-10 isonil-icon-btn min-h-[44px] min-w-[44px] rounded-xl text-[#8B9EAD] hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] flex items-center justify-center shrink-0 no-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC]"
                  >
                    <ExternalLink strokeWidth={1.65} className="w-4 h-4" />
                  </a>
                </div>

                {/* Official Client Portal */}
                <div className="py-1.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-white/[0.045] flex items-center justify-between gap-2.5">
                  <div className="relative min-w-0 flex-1 min-h-[50px] py-1.5 flex items-center gap-3 group">
                    <LayoutDashboard aria-hidden="true" strokeWidth={1.65} className="w-4 h-4 text-[#45C4DC]/85 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-[11px] text-[#8B9EAD]">{t.fields.clientPortal}</dt>
                      <dd className="mt-0.5">
                        <a
                          href={ISONIL_CONTACT.clientPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t.aria.clientPortalAction}
                          dir="ltr"
                          className="ltr-isolate text-sm sm:text-[15px] font-medium text-[#66D1E6] group-hover:text-[#7ADAE9] transition-colors break-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] rounded after:content-[''] after:absolute after:inset-0"
                        >
                          {ISONIL_CONTACT.clientPortalUrl}
                        </a>
                      </dd>
                    </div>
                  </div>
                  <a
                    href={ISONIL_CONTACT.clientPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.clientPortalAction}
                    className="relative z-10 isonil-icon-btn min-h-[44px] min-w-[44px] rounded-xl text-[#8B9EAD] hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] flex items-center justify-center shrink-0 no-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC]"
                  >
                    <ExternalLink strokeWidth={1.65} className="w-4 h-4" />
                  </a>
                </div>

                {/* Official Address */}
                <div className="pt-3 pb-1 -mx-2 px-2 rounded-xl transition-colors hover:bg-white/[0.045] flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1 flex items-start gap-3">
                    <MapPin aria-hidden="true" strokeWidth={1.65} className="w-4 h-4 mt-1 text-[#45C4DC]/85 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-[11px] text-[#8B9EAD]">{t.fields.address}</dt>
                      <dd className="mt-0.5 text-[13px] sm:text-sm font-medium text-[#F1F5F9] leading-relaxed">
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
                          className="inline-flex items-center gap-1.5 min-h-[44px] -ms-2 px-2 rounded-lg text-xs font-semibold text-[#66D1E6] hover:text-[#7ADAE9] hover:bg-white/[0.06] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC]"
                        >
                          <span>{t.actions.openMap}</span>
                          <ArrowUpRight strokeWidth={1.75} className="w-3.5 h-3.5 text-[#45C4DC] rtl:-scale-x-100 shrink-0" />
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
                    className={`isonil-icon-btn min-h-[44px] min-w-[44px] px-2.5 rounded-xl flex items-center justify-center gap-1.5 shrink-0 no-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer ${
                      copiedField === 'address'
                        ? 'bg-[#45C4DC]/18 text-[#7ADAE9]'
                        : 'text-[#8B9EAD] hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12]'
                    }`}
                  >
                    {copiedField === 'address' ? (
                      <>
                        <Check strokeWidth={1.75} className="isonil-check-pop w-4 h-4 text-[#7ADAE9] shrink-0" />
                        <span className="text-xs font-medium text-[#7ADAE9] whitespace-nowrap">
                          {t.actions.copied}
                        </span>
                      </>
                    ) : (
                      <Copy strokeWidth={1.65} className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </dl>

              {/* Compact 2-column Share & Favorites Utility Row */}
              <div className="mt-4 pt-4 border-t border-[#DCE8F2]/10 grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5 no-print">
                <button
                  type="button"
                  onClick={handleShareCard}
                  aria-label={t.aria.shareCardAction}
                  className={utilityActionBtnClass}
                >
                  <Share2 strokeWidth={1.65} className="isonil-btn-icon w-4 h-4 text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" />
                  <span className="truncate">{t.actions.shareCard}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenFavorites}
                  aria-haspopup="dialog"
                  aria-label={t.aria.favoritesAction}
                  className={`isonil-btn group w-full min-h-[48px] px-3.5 py-2.5 rounded-[14px] border text-xs sm:text-sm font-medium flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer ${
                    isFavorite
                      ? 'border-[#E50914]/45 bg-[#E50914]/14 backdrop-blur-md text-[#F8FAFC] hover:bg-[#E50914]/20 active:bg-[#E50914]/24 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                      : 'isonil-glass-tile text-[#EBF1F6] hover:text-white'
                  }`}
                >
                  <Bookmark
                    strokeWidth={1.65}
                    className={`isonil-btn-icon w-4 h-4 shrink-0 ${
                      isFavorite ? 'fill-[#E50914] text-[#E50914]' : 'text-[#45C4DC] group-hover:text-[#7ADAE9]'
                    }`}
                  />
                  <span className="truncate">
                    {isFavorite ? t.actions.savedInFavorites : t.actions.addToFavorites}
                  </span>
                </button>
              </div>
              </div>
            </section>
          </aside>
        </div>

        {/* Bottom Footer Information: City & Country + Visitor NFC Guide & Favorites */}
        <footer className={`isonil-enter isonil-delay-12 mt-6 sm:mt-10 pt-4 sm:pt-5 border-t border-[#CBD8E6]/8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-[11px] sm:text-xs text-[#8396A6] px-1 text-center lg:text-start ${langAnimClass}`}>
          <a
            href={ISONIL_CONTACT.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.aria.locationAction}
            className="min-h-[44px] px-2.5 py-1 inline-flex items-center justify-center lg:justify-start gap-1.5 text-[#AEBECC] hover:text-[#7ADAE9] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] rounded-lg"
          >
            <MapPin aria-hidden="true" strokeWidth={1.65} className="w-3.5 h-3.5 text-[#45C4DC] shrink-0" />
            <span>{t.cityCountry}</span>
          </a>

          <div className="flex items-center justify-center gap-1 sm:gap-2 shrink-0 no-print">
            <button
              type="button"
              onClick={handleOpenFavorites}
              aria-haspopup="dialog"
              aria-label={t.aria.favoritesAction}
              className={`lg:hidden isonil-icon-btn min-h-[44px] inline-flex items-center gap-1.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] rounded-lg px-2.5 cursor-pointer ${
                isFavorite ? 'text-[#F1F5F9] hover:text-white' : 'text-[#96AAB9] hover:text-[#7ADAE9]'
              }`}
            >
              <Bookmark
                strokeWidth={1.65}
                className={`w-3.5 h-3.5 shrink-0 ${
                  isFavorite ? 'fill-[#E50914] text-[#E50914]' : 'text-[#45C4DC]'
                }`}
              />
              <span className="whitespace-nowrap">
                {isFavorite ? t.actions.savedInFavorites : t.actions.addToFavorites}
              </span>
            </button>

            <span aria-hidden="true" className="lg:hidden text-[#CBD8E6]/25 select-none">
              ·
            </span>

            <button
              type="button"
              onClick={() => {
                triggerSubtleHaptic();
                setNfcTapHelpOpen(true);
              }}
              aria-haspopup="dialog"
              aria-label={t.nfcTapHelp.triggerAria}
              className="isonil-icon-btn min-h-[44px] inline-flex items-center gap-1.5 font-medium text-[#8B9EAD] hover:text-[#7ADAE9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] rounded-lg px-2.5 cursor-pointer"
            >
              <Nfc strokeWidth={1.65} className="w-3.5 h-3.5 text-[#45C4DC] shrink-0" />
              <span className="whitespace-nowrap">{t.nfcTapHelp.triggerLabel}</span>
            </button>

            <span aria-hidden="true" className="hidden lg:inline text-[#CBD8E6]/25 select-none">
              ·
            </span>

            <button
              type="button"
              onClick={() => setNfcModalOpen(true)}
              aria-haspopup="dialog"
              aria-label={t.nfc.triggerAria}
              className="hidden lg:inline-flex isonil-icon-btn min-h-[44px] items-center gap-1.5 font-medium text-[#8B9EAD] hover:text-[#7ADAE9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] rounded-lg px-2 cursor-pointer"
            >
              <span className="whitespace-nowrap">{t.nfc.triggerLabel}</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Structured B2B Project & Quote Inquiry Modal */}
      {inquiryModalOpen && (
        <Suspense fallback={null}>
          <QuickInquiryModal
            isOpen={inquiryModalOpen}
            t={t}
            messageCopied={copiedField === 'inquiry'}
            onClose={() => setInquiryModalOpen(false)}
            onCopyMessage={(msg) =>
              handleCopyValue('inquiry', msg, t.toasts.inquiryCopied)
            }
          />
        </Suspense>
      )}

      {/* Visitor NFC Tap Guide Modal */}
      {nfcTapHelpOpen && (
        <Suspense fallback={null}>
          <NfcTapHelpModal
            isOpen={nfcTapHelpOpen}
            t={t}
            onClose={() => setNfcTapHelpOpen(false)}
            onOpenAdminSettings={() => {
              setNfcTapHelpOpen(false);
              setNfcModalOpen(true);
            }}
          />
        </Suspense>
      )}

      {/* Favorites & Browser Bookmarking Modal */}
      {favoritesModalOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* NFC Setup & Preparation Management Modal */}
      {nfcModalOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* Accessible Non-Intrusive Feedback Toast */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] lg:bottom-5 z-[60] flex justify-center no-print transition-transform duration-200"
      >
        {toastMessage && (
          <div
            key={toastMessage}
            className="isonil-toast-enter isonil-glass-toast pointer-events-auto max-w-md text-[#F8FAFC] text-xs sm:text-sm font-medium ps-3.5 pe-1.5 py-2 rounded-xl border border-[#7ADAE9]/38 inline-flex items-center gap-2.5"
          >
            <Check aria-hidden="true" strokeWidth={2} className="w-4 h-4 text-[#7ADAE9] shrink-0" />
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              aria-label={t.dismissToast}
              className="min-h-[40px] min-w-[40px] rounded-lg text-[#9DB0BF] hover:text-white hover:bg-white/10 flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#45C4DC] cursor-pointer"
            >
              <X strokeWidth={1.65} className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
