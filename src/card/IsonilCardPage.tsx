import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Nfc,
  Phone,
  Share2,
  UserPlus,
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
import { FavoritesModal } from './FavoritesModal';
import { NfcSettingsModal } from './NfcSettingsModal';

const LANGUAGE_ORDER: CardLanguage[] = ['fr', 'en', 'ar'];

function getSavedLanguage(): CardLanguage {
  try {
    const stored = window.localStorage.getItem(STORAGE_LANG_KEY);
    if (stored === 'fr' || stored === 'en' || stored === 'ar') {
      return stored;
    }
  } catch {
    // Fallback safely to French if storage is unavailable
  }
  return DEFAULT_LANGUAGE;
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
  const [lang, setLang] = useState<CardLanguage>(getSavedLanguage);
  const [isFavorite, setIsFavorite] = useState<boolean>(getSavedFavorite);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [nfcModalOpen, setNfcModalOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return window.location.hash === '#nfc-settings' || params.get('admin') === 'nfc';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'url' | 'phone' | 'email' | 'address' | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const [langAnimPhase, setLangAnimPhase] = useState<'idle' | 'a' | 'b'>('idle');

  const toastTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const t = CARD_TRANSLATIONS[lang];
  const isRtl = t.dir === 'rtl';
  const langAnimClass =
    langAnimPhase === 'idle' ? '' : langAnimPhase === 'a' ? 'isonil-lang-a' : 'isonil-lang-b';

  // Persist card-only language preference without altering any main-site language state
  const handleSelectLanguage = (nextLang: CardLanguage) => {
    if (nextLang === lang) return;
    setLang(nextLang);
    setLangAnimPhase((prev) => (prev === 'a' ? 'b' : 'a'));
    try {
      window.localStorage.setItem(STORAGE_LANG_KEY, nextLang);
    } catch {
      // Ignore restricted storage errors gracefully
    }
  };

  // Sync page metadata (title & description) for the active card language and restore on unmount
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionMeta?.getAttribute('content') ?? null;

    document.title = t.metaTitle;
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', t.metaDescription);
    }

    return () => {
      document.title = previousTitle;
      if (descriptionMeta && previousDescription !== null) {
        descriptionMeta.setAttribute('content', previousDescription);
      }
    };
  }, [t.metaTitle, t.metaDescription]);

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

  const handleSaveContact = () => {
    downloadIsonilVCard();
    showToast(t.toasts.vcfDownloaded);
  };

  const handleShareCard = async () => {
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

  return (
    <div
      dir={t.dir}
      lang={lang}
      className={`min-h-[100dvh] w-full max-w-full relative overflow-x-clip bg-[#0B192C] text-white ${
        isRtl ? 'font-[var(--font-arabic)]' : 'font-[var(--font-sans)]'
      }`}
    >
      {/* Subtle one-shot atmospheric light-blue & sky-blue illumination on official #0B192C canvas */}
      <div
        aria-hidden="true"
        className="isonil-bg-atmosphere pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(121,200,232,0.14),transparent_42%),radial-gradient(circle_at_88%_92%,rgba(169,221,241,0.10),transparent_44%)]"
      />

      <main className="relative z-10 w-full max-w-5xl mx-auto safe-area-main">
        {/* Compact Mobile-First top bar: single row on phones to keep identity & CTAs immediately above the fold */}
        <header className="isonil-fade flex items-center justify-between gap-2.5 sm:gap-4 mb-3.5 sm:mb-6 no-print">
          <p className={`hidden sm:block text-sm font-medium text-[#C5D0DC] leading-snug ${langAnimClass}`}>
            {t.cardKicker}
          </p>
          <p className={`sm:hidden text-[11px] font-medium text-[#9FB3C8] leading-tight truncate min-w-0 ${langAnimClass}`}>
            {t.cardKicker}
          </p>

          <div
            role="group"
            aria-label={t.languageSelectorAria}
            className="inline-flex items-center p-1 rounded-xl bg-[#11243E]/90 backdrop-blur-md border border-[#79C8E8]/20 shadow-xs shrink-0"
          >
            {LANGUAGE_ORDER.map((code) => {
              const active = lang === code;
              const label = CARD_TRANSLATIONS[code].switcherLabel;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelectLanguage(code)}
                  aria-pressed={active}
                  lang={code}
                  className={`isonil-tab-btn min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8] cursor-pointer ${
                    active
                      ? 'bg-white text-[#0B192C] shadow-xs'
                      : 'text-[#C5D0DC] hover:text-white hover:bg-[#163052]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Responsive Executive Two-Column Grid (Desktop) / Single-Column Mobile-First Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-stretch">
          {/* Primary Identity & Contact Card */}
          <article className="isonil-enter isonil-delay-1 lg:col-span-7 bg-[#11243E]/92 backdrop-blur-md rounded-2xl border border-[#79C8E8]/20 shadow-[0_24px_60px_-28px_rgba(4,12,24,0.72)] overflow-hidden flex flex-col min-w-0">
            {/* Official #0B192C Brand Header Band: poised centered vertical hero on phones, executive horizontal on tablet/desktop */}
            <div className="relative bg-gradient-to-br from-[#0B192C] via-[#0F213A] to-[#142D4E] text-white px-5 sm:px-8 pt-6 pb-5 sm:pt-7 sm:pb-6 border-b border-[#79C8E8]/15">
              <div
                aria-hidden="true"
                className="isonil-accent-line absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#E50914] via-[#79C8E8] to-[#A9DDF1]"
              />

              <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-start gap-3.5 sm:gap-5">
                {/* Original Transparent ISONIL Logo directly over card background — gentle reveal, zero distortion or white box */}
                <div className="isonil-logo-reveal w-[76px] h-[76px] min-[390px]:w-20 min-[390px]:h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center bg-transparent">
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

                <div className={`min-w-0 w-full sm:flex-1 isonil-enter isonil-delay-2 ${langAnimClass}`}>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                    {ISONIL_CONTACT.company}
                  </h1>

                  <p className="mt-1 sm:mt-0.5 text-base sm:text-lg font-semibold text-[#A9DDF1] leading-snug">
                    {t.displayName}
                  </p>

                  <p className="mt-1.5 text-[13px] min-[390px]:text-sm sm:text-[15px] text-white/90 leading-relaxed sm:leading-snug text-balance max-w-[34ch] mx-auto sm:mx-0 sm:max-w-none">
                    {t.businessActivity}
                  </p>

                  <p className="mt-1.5 text-xs text-[#C5D0DC]">{t.cityCountry}</p>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 min-[390px]:p-5 sm:p-8 flex-1 flex flex-col">
              {/* Primary Action Controls */}
              <section
                aria-labelledby="isonil-quick-actions-heading"
                className={`isonil-enter isonil-delay-2 ${langAnimClass}`}
              >
                <h2
                  id="isonil-quick-actions-heading"
                  className="text-xs font-semibold text-[#9FB3C8] mb-3"
                >
                  {t.sections.quickActions}
                </h2>

                {/* Mobile-first touch grid: 2 generous horizontal tactile buttons (Call & WhatsApp) + 3 spacious tiles below; 5-up row on sm+ */}
                <div className="grid grid-cols-6 sm:grid-cols-5 gap-3 sm:gap-3">
                  <a
                    href={ISONIL_CONTACT.phoneHref}
                    aria-label={t.aria.callAction}
                    className="isonil-btn col-span-3 sm:col-span-1 min-h-[54px] sm:min-h-[64px] px-3 sm:px-2 py-3 rounded-xl bg-[#163052] hover:bg-[#1C3B64] hover:border-[#79C8E8]/55 border border-[#79C8E8]/30 text-white flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8]"
                  >
                    <Phone className="isonil-btn-icon w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#79C8E8] shrink-0" />
                    <span className="text-[13px] sm:text-xs font-semibold whitespace-nowrap">
                      {t.actions.call}
                    </span>
                  </a>

                  <a
                    href={ISONIL_CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.whatsappAction}
                    className="isonil-btn col-span-3 sm:col-span-1 min-h-[54px] sm:min-h-[64px] px-3 sm:px-2 py-3 rounded-xl bg-[#163052] hover:bg-[#1C3B64] hover:border-[#79C8E8]/55 border border-[#79C8E8]/30 text-white flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8]"
                  >
                    <MessageCircle className="isonil-btn-icon w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#A9DDF1] shrink-0" />
                    <span className="text-[13px] sm:text-xs font-semibold whitespace-nowrap">
                      {t.actions.whatsapp}
                    </span>
                  </a>

                  <a
                    href={ISONIL_CONTACT.emailHref}
                    aria-label={t.aria.emailAction}
                    className="isonil-btn col-span-2 sm:col-span-1 min-h-[62px] px-1.5 py-3 rounded-xl border border-[#C5D0DC]/20 hover:border-[#79C8E8]/45 bg-[#0B192C]/65 hover:bg-[#163052] text-white flex flex-col items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8]"
                  >
                    <Mail className="isonil-btn-icon w-5 h-5 text-[#79C8E8] shrink-0" />
                    <span className="text-[11px] min-[375px]:text-xs font-semibold whitespace-nowrap">
                      {t.actions.email}
                    </span>
                  </a>

                  <a
                    href={ISONIL_CONTACT.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.websiteAction}
                    className="isonil-btn col-span-2 sm:col-span-1 min-h-[62px] px-1.5 py-3 rounded-xl border border-[#C5D0DC]/20 hover:border-[#79C8E8]/45 bg-[#0B192C]/65 hover:bg-[#163052] text-white flex flex-col items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8]"
                  >
                    <Globe className="isonil-btn-icon w-5 h-5 text-[#79C8E8] shrink-0" />
                    <span className="text-[11px] min-[375px]:text-xs font-semibold whitespace-nowrap">
                      {t.actions.website}
                    </span>
                  </a>

                  <a
                    href={ISONIL_CONTACT.mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.aria.locationAction}
                    className="isonil-btn col-span-2 sm:col-span-1 min-h-[62px] px-1.5 py-3 rounded-xl border border-[#C5D0DC]/20 hover:border-[#79C8E8]/45 bg-[#0B192C]/65 hover:bg-[#163052] text-white flex flex-col items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8]"
                  >
                    <MapPin className="isonil-btn-icon w-5 h-5 text-[#E50914] shrink-0" />
                    <span className="text-[11px] min-[375px]:text-xs font-semibold whitespace-nowrap">
                      {t.actions.location}
                    </span>
                  </a>
                </div>
              </section>

              {/* Dominant Primary CTA (Save Contact VCF) + Share & Favorites */}
              <div className={`mt-5 space-y-3 no-print isonil-enter isonil-delay-3 ${langAnimClass}`}>
                <button
                  type="button"
                  onClick={handleSaveContact}
                  aria-label={t.aria.saveContactAction}
                  className="isonil-btn-primary w-full min-h-[52px] px-5 py-3 rounded-xl bg-white hover:bg-[#EDF7FC] text-[#0B192C] text-sm sm:text-[15px] font-semibold inline-flex items-center justify-center gap-2.5 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8] cursor-pointer"
                >
                  <UserPlus className="isonil-btn-icon w-5 h-5 text-[#0B192C] shrink-0" />
                  <span className="whitespace-nowrap">{t.actions.saveContact}</span>
                </button>

                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleShareCard}
                    aria-label={t.aria.shareCardAction}
                    className="isonil-btn min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#C5D0DC]/25 hover:border-[#79C8E8]/45 bg-[#0B192C]/55 hover:bg-[#163052] text-white text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8] cursor-pointer"
                  >
                    <Share2 className="isonil-btn-icon w-4 h-4 text-[#79C8E8] shrink-0" />
                    <span className="whitespace-nowrap">{t.actions.shareCard}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenFavorites}
                    aria-label={t.aria.favoritesAction}
                    aria-pressed={isFavorite}
                    className={`isonil-btn min-h-[48px] px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8] cursor-pointer ${
                      isFavorite
                        ? 'border-[#E50914]/55 bg-[#E50914]/12 text-white hover:bg-[#E50914]/20'
                        : 'border-[#C5D0DC]/25 hover:border-[#79C8E8]/45 bg-[#0B192C]/55 hover:bg-[#163052] text-white'
                    }`}
                  >
                    <Bookmark
                      className={`isonil-btn-icon w-4 h-4 shrink-0 ${
                        isFavorite ? 'fill-[#E50914] text-[#E50914]' : 'text-[#79C8E8]'
                      }`}
                    />
                    <span className="whitespace-nowrap">
                      {isFavorite ? t.actions.savedInFavorites : t.actions.addToFavorites}
                    </span>
                  </button>
                </div>
              </div>

              {/* Official Contact Information (Hairline separated, zero nested card clutter) */}
              <section
                aria-labelledby="isonil-contact-details-heading"
                className={`mt-6 sm:mt-7 pt-5 border-t border-[#C5D0DC]/15 isonil-enter isonil-delay-4 ${langAnimClass}`}
              >
                <h2
                  id="isonil-contact-details-heading"
                  className="text-xs font-semibold text-[#9FB3C8] mb-2"
                >
                  {t.sections.contactDetails}
                </h2>

                <dl className="divide-y divide-[#C5D0DC]/12">
                  {/* Phone & WhatsApp with strict LTR directional isolation */}
                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs text-[#9FB3C8]">{t.fields.phoneAndWhatsapp}</dt>
                      <dd className="mt-0.5">
                        <a
                          href={ISONIL_CONTACT.phoneHref}
                          dir="ltr"
                          className="ltr-isolate font-mono tabular-nums text-[15px] sm:text-base font-semibold text-white hover:text-[#A9DDF1] transition-colors"
                        >
                          {ISONIL_CONTACT.phoneDisplay}
                        </a>
                      </dd>
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
                      className="isonil-icon-btn min-h-[44px] min-w-[44px] rounded-xl text-[#9FB3C8] hover:text-white hover:bg-[#163052] flex items-center justify-center shrink-0 no-print cursor-pointer"
                    >
                      {copiedField === 'phone' ? (
                        <Check className="isonil-check-pop w-4 h-4 text-[#79C8E8]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Official Email */}
                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs text-[#9FB3C8]">{t.fields.email}</dt>
                      <dd className="mt-0.5">
                        <a
                          href={ISONIL_CONTACT.emailHref}
                          dir="ltr"
                          className="ltr-isolate text-sm sm:text-[15px] font-medium text-white hover:text-[#A9DDF1] transition-colors break-all"
                        >
                          {ISONIL_CONTACT.email}
                        </a>
                      </dd>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyValue('email', ISONIL_CONTACT.email, t.toasts.emailCopied)
                      }
                      aria-label={t.aria.copyEmail}
                      className="isonil-icon-btn min-h-[44px] min-w-[44px] rounded-xl text-[#9FB3C8] hover:text-white hover:bg-[#163052] flex items-center justify-center shrink-0 no-print cursor-pointer"
                    >
                      {copiedField === 'email' ? (
                        <Check className="isonil-check-pop w-4 h-4 text-[#79C8E8]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Official Website */}
                  <div className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs text-[#9FB3C8]">{t.fields.website}</dt>
                      <dd className="mt-0.5">
                        <a
                          href={ISONIL_CONTACT.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className="ltr-isolate text-sm sm:text-[15px] font-medium text-[#79C8E8] hover:text-[#A9DDF1] transition-colors break-all"
                        >
                          {ISONIL_CONTACT.websiteUrl}
                        </a>
                      </dd>
                    </div>
                    <a
                      href={ISONIL_CONTACT.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.aria.websiteAction}
                      className="isonil-icon-btn min-h-[44px] min-w-[44px] rounded-xl text-[#9FB3C8] hover:text-white hover:bg-[#163052] flex items-center justify-center shrink-0 no-print"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Official Address */}
                  <div className="pt-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs text-[#9FB3C8]">{t.fields.address}</dt>
                      <dd className="mt-0.5 text-sm sm:text-[15px] font-medium text-white/95 leading-relaxed">
                        <span dir="ltr" className="ltr-isolate text-start break-words max-w-full">
                          {ISONIL_CONTACT.address}
                        </span>
                      </dd>
                      <div className="mt-2.5 no-print">
                        <a
                          href={ISONIL_CONTACT.mapsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-semibold text-[#79C8E8] hover:text-[#A9DDF1] transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
                          <span>{t.actions.openMap}</span>
                        </a>
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
                      className="isonil-icon-btn min-h-[44px] min-w-[44px] rounded-xl text-[#9FB3C8] hover:text-white hover:bg-[#163052] flex items-center justify-center shrink-0 no-print cursor-pointer"
                    >
                      {copiedField === 'address' ? (
                        <Check className="isonil-check-pop w-4 h-4 text-[#79C8E8]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </dl>
              </section>
            </div>
          </article>

          {/* Secondary Column: Permanent Scannable QR Code */}
          <aside className="isonil-enter isonil-delay-2 lg:col-span-5 min-w-0">
            <QrCodePanel
              t={t}
              langAnimClass={langAnimClass}
              onNotify={showToast}
              onCopyUrl={() =>
                handleCopyValue('url', ISONIL_CONTACT.cardCanonicalUrl, t.toasts.linkCopied)
              }
              urlCopied={copiedField === 'url'}
            />
          </aside>
        </div>

        {/* Quiet Footer with discreet card-management NFC Settings entry */}
        <footer className={`isonil-enter isonil-delay-5 mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9FB3C8] px-1 text-center sm:text-start ${langAnimClass}`}>
          <p>{t.footer.officialNotice}</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href={ISONIL_CONTACT.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="ltr-isolate font-medium text-[#C5D0DC] hover:text-[#A9DDF1] transition-colors"
            >
              {ISONIL_CONTACT.websiteDisplay}
            </a>
            <span aria-hidden="true" className="text-[#C5D0DC]/35 no-print">
              ·
            </span>
            <button
              type="button"
              onClick={() => setNfcModalOpen(true)}
              aria-label={t.nfc.triggerAria}
              className="isonil-icon-btn no-print min-h-[36px] inline-flex items-center gap-1.5 font-medium text-[#9FB3C8] hover:text-[#A9DDF1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79C8E8] rounded-md px-1.5 cursor-pointer"
            >
              <Nfc className="w-3.5 h-3.5 text-[#79C8E8] shrink-0" />
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
        onDownloadVCard={handleSaveContact}
        onNotify={showToast}
      />

      {/* Accessible Non-Intrusive Feedback Toast */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] inset-x-4 z-50 flex justify-center no-print"
      >
        {toastMessage && (
          <div
            key={toastMessage}
            className="isonil-toast-enter pointer-events-auto max-w-md bg-white text-[#0B192C] text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-lg border border-[#79C8E8]/50"
          >
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
