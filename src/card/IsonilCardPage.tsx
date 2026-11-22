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
  const [showMobileStickyBar, setShowMobileStickyBar] = useState(false);

  const toastTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const vcardTimerRef = useRef<number | null>(null);
  const primaryCtaRef = useRef<HTMLDivElement | null>(null);
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

  // Reveal compact mobile thumb-zone bar only after primary Save Contact CTA scrolls above viewport
  useEffect(() => {
    const target = primaryCtaRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMobileStickyBar(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
      },
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

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

  // Compact 2-column tile classes: smaller footprint, balanced height, clean visual rhythm
  const uniformStandardBtnClass =
    'isonil-btn group w-full min-h-[64px] sm:min-h-[68px] px-2.5 py-2.5 rounded-xl border border-[#D0D7DE]/16 hover:border-[#4CC3DB]/55 active:border-[#4CC3DB]/65 bg-[#0C1217]/84 hover:bg-[#17222B] active:bg-[#17222B] text-white text-xs sm:text-[13px] font-semibold flex flex-col items-center justify-center gap-1.5 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer';

  const companyProfileHighlightClass =
    'isonil-btn group w-full min-h-[64px] sm:min-h-[68px] px-2.5 py-2.5 rounded-xl border border-[#4CC3DB]/60 hover:border-[#76D4E6] active:border-[#76D4E6] bg-[#16242E] hover:bg-[#1D2F3C] active:bg-[#1D2F3C] text-white text-xs sm:text-[13px] font-semibold flex flex-col items-center justify-center gap-1.5 text-center shadow-[0_10px_24px_-16px_rgba(76,195,219,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer';

  const utilityActionBtnClass =
    'isonil-btn w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#D0D7DE]/18 hover:border-[#4CC3DB]/55 active:border-[#4CC3DB]/65 bg-[#0C1217]/82 hover:bg-[#17222B] active:bg-[#17222B] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer';

  return (
    <div
      dir={t.dir}
      lang={lang}
      className={`min-h-[100dvh] w-full max-w-full relative overflow-x-clip bg-[#0C1217] text-white ${
        isRtl ? 'font-[var(--font-arabic)]' : 'font-[var(--font-sans)]'
      }`}
    >
      {/* Architectural corner facets & subtle diagonal cyan light streaks inspired by official print card */}
      <div aria-hidden="true" className="isonil-bg-atmosphere pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top-left slate facet & cyan streak */}
        <div
          className="absolute -top-20 -left-24 w-[380px] sm:w-[540px] h-[240px] sm:h-[320px] -rotate-[28deg] bg-gradient-to-br from-[#16232E]/80 via-[#101A22]/55 to-transparent border-b border-[#4CC3DB]/25"
        />
        <div
          className="absolute -top-12 -left-16 w-[300px] sm:w-[440px] h-[150px] sm:h-[210px] -rotate-[28deg] border-b border-[#76D4E6]/40 shadow-[0_1px_18px_rgba(76,195,219,0.28)]"
        />
        {/* Bottom-right slate facet & cyan streak */}
        <div
          className="absolute -bottom-24 -right-24 w-[400px] sm:w-[580px] h-[240px] sm:h-[340px] -rotate-[28deg] bg-gradient-to-tl from-[#16232E]/85 via-[#101A22]/55 to-transparent border-t border-[#4CC3DB]/28"
        />
        <div
          className="absolute -bottom-12 -right-14 w-[310px] sm:w-[450px] h-[145px] sm:h-[205px] -rotate-[28deg] border-t border-[#76D4E6]/42 shadow-[0_-1px_18px_rgba(76,195,219,0.28)]"
        />
        {/* Gentle ambient cyan sheen */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(76,195,219,0.10),transparent_42%),radial-gradient(circle_at_88%_90%,rgba(76,195,219,0.10),transparent_44%)]" />
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
            className="inline-flex items-center p-1 rounded-xl bg-[#11181F]/95 backdrop-blur-md border border-[#4CC3DB]/22 shadow-xs shrink-0"
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
                  className={`isonil-tab-btn min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer ${
                    active
                      ? 'bg-white text-[#0C1217] shadow-xs'
                      : 'text-[#D0D7DE] hover:text-white hover:bg-[#17222B]'
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
          {/* Primary Official Card: Logo & Info -> Call -> WhatsApp -> Email -> Website -> Company Profile -> Map -> Save Contact (/contact.vcf) -> Follow Us & Socials */}
          <article className="isonil-enter isonil-delay-1 lg:col-span-7 bg-[#11181F]/95 backdrop-blur-md rounded-2xl border border-[#4CC3DB]/22 shadow-[0_24px_60px_-28px_rgba(3,6,9,0.88)] overflow-hidden flex flex-col min-w-0">
            {/* Official obsidian slate header band with compact mobile proportions */}
            <div className="relative bg-gradient-to-br from-[#0B1116] via-[#10181F] to-[#16222C] text-white px-4 min-[390px]:px-5 sm:px-8 pt-5 pb-4 sm:pt-7 sm:pb-6 border-b border-[#4CC3DB]/20 overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-12 -right-12 w-56 h-32 -rotate-[26deg] bg-gradient-to-b from-[#4CC3DB]/10 to-transparent border-b border-[#4CC3DB]/25"
              />
              <div
                aria-hidden="true"
                className="isonil-accent-line absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#E50914] via-[#4CC3DB] to-[#76D4E6]"
              />

              <div className="relative flex flex-col items-center text-center min-[520px]:flex-row min-[520px]:items-center min-[520px]:text-start gap-2.5 min-[390px]:gap-3 sm:gap-5">
                {/* Original Transparent ISONIL Logo directly over card background — zero white box */}
                <div className="isonil-logo-reveal w-[72px] h-[72px] min-[390px]:w-20 min-[390px]:h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center bg-transparent">
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
                  <h1 className="text-[22px] min-[390px]:text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                    {ISONIL_CONTACT.company}
                  </h1>
                  <p className="mt-0.5 text-[15px] min-[390px]:text-base sm:text-lg font-semibold text-[#5EC6DA] leading-snug">
                    {t.displayName}
                  </p>

                  {/* Signature cyan hairline bar inspired by print card */}
                  <div
                    aria-hidden="true"
                    className="mt-2 mb-2 h-[2px] w-12 rounded-full bg-[#4CC3DB] mx-auto min-[520px]:mx-0"
                  />

                  <p className="text-[13px] min-[390px]:text-sm sm:text-[15px] text-white/90 leading-snug text-balance max-w-[34ch] mx-auto min-[520px]:mx-0 min-[520px]:max-w-none">
                    {t.businessActivity}
                  </p>

                  <p className="mt-1 text-xs text-[#9AA9B5]">{t.cityCountry}</p>
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
                      className="text-xs font-semibold text-[#9AA9B5] truncate"
                    >
                      {t.sections.quickActions}
                    </h2>

                    <div className="no-print flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleJumpToQr}
                        aria-label={t.aria.jumpToQrAction}
                        className="isonil-icon-btn lg:hidden min-h-[40px] px-2.5 rounded-lg bg-[#0C1217]/70 border border-[#D0D7DE]/14 text-xs font-medium text-[#D0D7DE] hover:text-[#76D4E6] hover:border-[#4CC3DB]/40 active:bg-[#17222B] inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#4CC3DB] shrink-0" />
                        <span>{t.actions.jumpToQr}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNfcHelpOpen((prev) => !prev)}
                        aria-expanded={nfcHelpOpen}
                        aria-controls="isonil-nfc-tap-guide"
                        aria-label={t.nfcTapHelp.triggerAria}
                        className={`isonil-icon-btn min-h-[40px] px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer ${
                          nfcHelpOpen
                            ? 'text-[#76D4E6] bg-[#17222B] border-[#4CC3DB]/45'
                            : 'bg-[#0C1217]/70 border-[#D0D7DE]/14 text-[#D0D7DE] hover:text-[#76D4E6] hover:border-[#4CC3DB]/40 active:bg-[#17222B]'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[#4CC3DB] shrink-0" />
                        <span>{t.nfcTapHelp.triggerLabel}</span>
                      </button>
                    </div>
                  </div>

                  {nfcHelpOpen && (
                    <div
                      id="isonil-nfc-tap-guide"
                      role="region"
                      aria-label={t.nfcTapHelp.title}
                      className="isonil-popover-enter no-print mb-3 p-3.5 rounded-xl bg-[#0C1217]/92 border border-[#4CC3DB]/32 text-xs text-[#D0D7DE] leading-relaxed"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <Smartphone className="w-4 h-4 text-[#4CC3DB] shrink-0" />
                          <span>{t.nfcTapHelp.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNfcHelpOpen(false)}
                          aria-label={t.actions.close}
                          className="isonil-icon-btn min-h-[36px] min-w-[36px] -me-1.5 -mt-1.5 rounded-lg text-[#9AA9B5] hover:text-white hover:bg-[#17222B] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="mt-1.5 text-[#D0D7DE]">{t.nfcTapHelp.summary}</p>
                      <ul className="mt-2 space-y-1 text-[#9AA9B5]">
                        <li>{t.nfcTapHelp.iphoneTip}</li>
                        <li>{t.nfcTapHelp.androidTip}</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Compact 2-Column Side-by-Side Tile Grid: (Call | WhatsApp) -> (Email | Website) -> (Company Profile | Map) -> Save Contact */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {/* 1. Call */}
                  <a
                    href={ISONIL_CONTACT.phoneHref}
                    aria-label={t.aria.callAction}
                    className={`isonil-enter isonil-delay-3 ${uniformStandardBtnClass}`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#17222B] border border-[#4CC3DB]/22 flex items-center justify-center shrink-0">
                      <Phone className="isonil-btn-icon w-4 h-4 text-[#4CC3DB]" />
                    </span>
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
                    <span className="w-8 h-8 rounded-lg bg-[#17222B] border border-[#4CC3DB]/22 flex items-center justify-center shrink-0">
                      <MessageCircle className="isonil-btn-icon w-4 h-4 text-[#76D4E6]" />
                    </span>
                    <span className="leading-tight text-balance">{t.actions.whatsapp}</span>
                  </a>

                  {/* 3. Email */}
                  <a
                    href={emailDirectHref}
                    aria-label={t.aria.emailAction}
                    className={`isonil-enter isonil-delay-5 ${uniformStandardBtnClass}`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#17222B] border border-[#4CC3DB]/22 flex items-center justify-center shrink-0">
                      <Mail className="isonil-btn-icon w-4 h-4 text-[#4CC3DB]" />
                    </span>
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
                    <span className="w-8 h-8 rounded-lg bg-[#17222B] border border-[#4CC3DB]/22 flex items-center justify-center shrink-0">
                      <Globe className="isonil-btn-icon w-4 h-4 text-[#4CC3DB]" />
                    </span>
                    <span className="leading-tight text-balance">{t.actions.website}</span>
                  </a>

                  {/* 5. Company Profile (Directly after Website — Highlighted tile) */}
                  <a
                    href={ISONIL_CONTACT.companyProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.companyProfileAction}
                    className={`isonil-enter isonil-delay-7 ${companyProfileHighlightClass}`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#0C1217]/80 border border-[#4CC3DB]/45 flex items-center justify-center shrink-0">
                      <FileText className="isonil-btn-icon w-4 h-4 text-[#76D4E6]" />
                    </span>
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
                    <span className="w-8 h-8 rounded-lg bg-[#17222B] border border-[#4CC3DB]/22 flex items-center justify-center shrink-0">
                      <MapPin className="isonil-btn-icon w-4 h-4 text-[#4CC3DB]" />
                    </span>
                    <span className="leading-tight text-balance">{t.actions.location}</span>
                  </a>

                  {/* 7. Save Contact (Downloads /contact.vcf — Full-width primary CTA spanning 2 columns) */}
                  <div ref={primaryCtaRef} className="col-span-2 no-print mt-0.5">
                    <a
                      href={ISONIL_CONTACT.vcardPublicPath}
                      download={ISONIL_CONTACT.vcardFilename}
                      onClick={triggerSaveContactFeedback}
                      aria-label={t.aria.saveContactAction}
                      className={`isonil-enter isonil-delay-9 isonil-btn-primary w-full min-h-[48px] sm:min-h-[50px] px-4 py-2.5 rounded-xl border border-[#4CC3DB]/75 text-[#0C1217] text-sm font-bold flex items-center justify-center gap-2.5 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer ${
                        contactSavedFeedback
                          ? 'bg-[#D7F4FA] hover:bg-[#D7F4FA]'
                          : 'bg-white hover:bg-[#ECF8FA] active:bg-[#D7F4FA]'
                      }`}
                    >
                      {contactSavedFeedback ? (
                        <>
                          <Check className="isonil-check-pop w-5 h-5 text-[#0C1217] shrink-0" />
                          <span className="whitespace-nowrap">{t.actions.contactReady}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="isonil-btn-icon w-5 h-5 text-[#0C1217] shrink-0" />
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
                className={`isonil-enter isonil-delay-10 mt-5 pt-4 border-t border-[#D0D7DE]/14 text-center no-print ${langAnimClass}`}
              >
                <h2
                  id="isonil-follow-us-heading"
                  className="text-xs font-semibold text-[#9AA9B5] mb-3"
                >
                  {t.sections.followUs}
                </h2>

                <div className="flex items-center justify-center gap-4">
                  <a
                    href={ISONIL_CONTACT.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.linkedinAction}
                    className="isonil-icon-btn w-11 h-11 rounded-full bg-[#0C1217]/88 hover:bg-[#17222B] active:bg-[#17222B] border border-[#4CC3DB]/32 hover:border-[#4CC3DB]/75 text-[#D0D7DE] hover:text-[#76D4E6] flex items-center justify-center shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB]"
                  >
                    <FaLinkedinIn className="w-[18px] h-[18px]" aria-hidden="true" />
                  </a>

                  <a
                    href={ISONIL_CONTACT.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.facebookAction}
                    className="isonil-icon-btn w-11 h-11 rounded-full bg-[#0C1217]/88 hover:bg-[#17222B] active:bg-[#17222B] border border-[#4CC3DB]/32 hover:border-[#4CC3DB]/75 text-[#D0D7DE] hover:text-[#76D4E6] flex items-center justify-center shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB]"
                  >
                    <FaFacebookF className="w-[17px] h-[17px]" aria-hidden="true" />
                  </a>

                  <a
                    href={ISONIL_CONTACT.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.instagramAction}
                    className="isonil-icon-btn w-11 h-11 rounded-full bg-[#0C1217]/88 hover:bg-[#17222B] active:bg-[#17222B] border border-[#4CC3DB]/32 hover:border-[#4CC3DB]/75 text-[#D0D7DE] hover:text-[#76D4E6] flex items-center justify-center shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB]"
                  >
                    <FaInstagram className="w-[18px] h-[18px]" aria-hidden="true" />
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
              className={`hidden lg:block isonil-enter isonil-delay-11 bg-[#11181F]/95 backdrop-blur-md rounded-2xl border border-[#4CC3DB]/22 shadow-[0_24px_60px_-28px_rgba(3,6,9,0.88)] p-4 min-[390px]:p-5 sm:p-6 ${langAnimClass}`}
            >
              <h2
                id="isonil-contact-details-heading"
                className="text-xs font-semibold text-[#9AA9B5] mb-2"
              >
                {t.sections.contactDetails}
              </h2>

              <dl className="divide-y divide-[#D0D7DE]/12">
                {/* Phone & WhatsApp */}
                <div className="py-1.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-[#17222B]/40 active:bg-[#17222B]/55 flex items-center justify-between gap-2.5">
                  <div className="relative min-w-0 flex-1 min-h-[50px] py-1.5 flex items-center gap-3 group">
                    <span
                      aria-hidden="true"
                      className="w-8 h-8 rounded-lg bg-[#0C1217]/80 border border-[#4CC3DB]/18 flex items-center justify-center shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#4CC3DB]" />
                    </span>
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
                <div className="py-1.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-[#17222B]/40 active:bg-[#17222B]/55 flex items-center justify-between gap-2.5">
                  <div className="relative min-w-0 flex-1 min-h-[50px] py-1.5 flex items-center gap-3 group">
                    <span
                      aria-hidden="true"
                      className="w-8 h-8 rounded-lg bg-[#0C1217]/80 border border-[#4CC3DB]/18 flex items-center justify-center shrink-0"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#4CC3DB]" />
                    </span>
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
                <div className="py-1.5 -mx-2 px-2 rounded-xl transition-colors hover:bg-[#17222B]/40 active:bg-[#17222B]/55 flex items-center justify-between gap-2.5">
                  <div className="relative min-w-0 flex-1 min-h-[50px] py-1.5 flex items-center gap-3 group">
                    <span
                      aria-hidden="true"
                      className="w-8 h-8 rounded-lg bg-[#0C1217]/80 border border-[#4CC3DB]/18 flex items-center justify-center shrink-0"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#4CC3DB]" />
                    </span>
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
                <div className="pt-3 pb-1 -mx-2 px-2 rounded-xl transition-colors hover:bg-[#17222B]/40 flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1 flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="w-8 h-8 mt-0.5 rounded-lg bg-[#0C1217]/80 border border-[#4CC3DB]/18 flex items-center justify-center shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#4CC3DB]" />
                    </span>
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
              <div className="mt-4 pt-4 border-t border-[#D0D7DE]/14 grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5 no-print">
                <button
                  type="button"
                  onClick={handleShareCard}
                  aria-label={t.aria.shareCardAction}
                  className={utilityActionBtnClass}
                >
                  <Share2 className="isonil-btn-icon w-4 h-4 text-[#4CC3DB] shrink-0" />
                  <span className="truncate">{t.actions.shareCard}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenFavorites}
                  aria-label={t.aria.favoritesAction}
                  aria-pressed={isFavorite}
                  className={`isonil-btn w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer ${
                    isFavorite
                      ? 'border-[#E50914]/55 bg-[#E50914]/12 text-white hover:bg-[#E50914]/20 active:bg-[#E50914]/24'
                      : 'border-[#D0D7DE]/18 hover:border-[#4CC3DB]/55 active:border-[#4CC3DB]/65 bg-[#0C1217]/82 hover:bg-[#17222B] active:bg-[#17222B] text-white'
                  }`}
                >
                  <Bookmark
                    className={`isonil-btn-icon w-4 h-4 shrink-0 ${
                      isFavorite ? 'fill-[#E50914] text-[#E50914]' : 'text-[#4CC3DB]'
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

        {/* Quiet Footer with discreet card-management NFC Settings entry */}
        <footer className={`isonil-enter isonil-delay-12 mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9AA9B5] px-1 text-center sm:text-start ${langAnimClass}`}>
          <p>{t.footer.officialNotice}</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href={ISONIL_CONTACT.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.aria.websiteAction}
              dir="ltr"
              className="ltr-isolate font-medium text-[#D0D7DE] hover:text-[#76D4E6] transition-colors"
            >
              {ISONIL_CONTACT.websiteDisplay}
            </a>
            <span aria-hidden="true" className="text-[#D0D7DE]/35 no-print">
              ·
            </span>
            <button
              type="button"
              onClick={() => setNfcModalOpen(true)}
              aria-label={t.nfc.triggerAria}
              className="isonil-icon-btn no-print min-h-[44px] inline-flex items-center gap-1.5 font-medium text-[#9AA9B5] hover:text-[#76D4E6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] rounded-lg px-2 cursor-pointer"
            >
              <Nfc className="w-3.5 h-3.5 text-[#4CC3DB] shrink-0" />
              <span className="whitespace-nowrap">{t.nfc.triggerLabel}</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Scroll-triggered Mobile/Tablet Thumb-Zone Action Bar */}
      {showMobileStickyBar && !favoritesModalOpen && !nfcModalOpen && (
        <nav
          aria-label={t.stickyBarAria}
          className="isonil-mobile-sticky-bar isonil-sticky-enter lg:hidden no-print fixed bottom-0 inset-x-0 z-40 bg-[#0C1217]/92 backdrop-blur-md border-t border-[#4CC3DB]/25 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_-12px_rgba(3,6,9,0.9)]"
        >
          <div className="max-w-lg mx-auto flex items-center gap-2">
            <a
              href={ISONIL_CONTACT.phoneHref}
              aria-label={t.aria.callAction}
              className="isonil-btn min-h-[44px] px-3 rounded-xl bg-[#17222B] hover:bg-[#1E2C38] border border-[#4CC3DB]/32 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB]"
            >
              <Phone className="w-4 h-4 text-[#4CC3DB] shrink-0" />
              <span className="hidden min-[380px]:inline">{t.actions.call}</span>
            </a>

            <a
              href={whatsappDirectHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.aria.whatsappAction}
              className="isonil-btn min-h-[44px] px-3 rounded-xl bg-[#17222B] hover:bg-[#1E2C38] border border-[#4CC3DB]/32 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB]"
            >
              <MessageCircle className="w-4 h-4 text-[#76D4E6] shrink-0" />
              <span className="hidden min-[380px]:inline">{t.actions.whatsapp}</span>
            </a>

            <a
              href={ISONIL_CONTACT.vcardPublicPath}
              download={ISONIL_CONTACT.vcardFilename}
              onClick={triggerSaveContactFeedback}
              aria-label={t.aria.saveContactAction}
              className={`isonil-btn-primary flex-1 min-w-0 min-h-[44px] px-3.5 rounded-xl text-[#0C1217] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4CC3DB] cursor-pointer ${
                contactSavedFeedback
                  ? 'bg-[#D7F4FA] hover:bg-[#D7F4FA]'
                  : 'bg-white hover:bg-[#ECF8FA]'
              }`}
            >
              {contactSavedFeedback ? (
                <>
                  <Check className="isonil-check-pop w-4 h-4 text-[#0C1217] shrink-0" />
                  <span className="truncate">{t.actions.contactReady}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-[#0C1217] shrink-0" />
                  <span className="truncate">{t.actions.saveContact}</span>
                </>
              )}
            </a>
          </div>
        </nav>
      )}

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

      {/* Accessible Non-Intrusive Feedback Toast (shifts cleanly above mobile sticky bar when visible) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`pointer-events-none fixed inset-x-4 z-50 flex justify-center no-print transition-transform duration-200 ${
          showMobileStickyBar && !favoritesModalOpen && !nfcModalOpen
            ? 'bottom-[max(4.75rem,calc(4.25rem+env(safe-area-inset-bottom)))] lg:bottom-5'
            : 'bottom-[max(1.25rem,env(safe-area-inset-bottom))]'
        }`}
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
