import { useRef, useState } from 'react';
import { Briefcase, Check, Copy, Mail, MessageCircle, X } from 'lucide-react';
import { ISONIL_CONTACT } from './constants';
import type { CardTranslation } from './translations';
import { useModalSheet } from './useModalSheet';

export type InquiryTopicKey = 'quote' | 'study' | 'partnership' | 'general';

interface QuickInquiryModalProps {
  isOpen: boolean;
  t: CardTranslation;
  onClose: () => void;
  onCopyMessage: (message: string) => void;
  messageCopied: boolean;
}

const TOPIC_KEYS: InquiryTopicKey[] = ['quote', 'study', 'partnership', 'general'];

export function QuickInquiryModal({
  isOpen,
  t,
  onClose,
  onCopyMessage,
  messageCopied,
}: QuickInquiryModalProps) {
  const [topic, setTopic] = useState<InquiryTopicKey>('quote');
  const [senderName, setSenderName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [details, setDetails] = useState('');

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const { sheetTouchHandlers } = useModalSheet({
    isOpen,
    onClose,
    dialogRef,
    initialFocusRef: closeButtonRef,
  });

  if (!isOpen) return null;

  const topicLabel = t.inquiry.topics[topic];

  const composeFormattedMessage = (): string => {
    const lines: string[] = [t.inquiry.greeting, `${t.inquiry.subjectPrefix}: ${topicLabel}`];
    if (senderName.trim()) {
      lines.push(`${t.inquiry.nameLabel}: ${senderName.trim()}`);
    }
    if (companyName.trim()) {
      lines.push(`${t.inquiry.companyLabel}: ${companyName.trim()}`);
    }
    if (details.trim()) {
      lines.push('', details.trim());
    }
    return lines.join('\n');
  };

  const formattedMessage = composeFormattedMessage();
  const whatsappUrl = `${ISONIL_CONTACT.whatsappHref}?text=${encodeURIComponent(formattedMessage)}`;
  const emailSubject = `${t.inquiry.emailSubjectBase} — ${topicLabel}`;
  const emailUrl = `${ISONIL_CONTACT.emailHref}?subject=${encodeURIComponent(
    emailSubject
  )}&body=${encodeURIComponent(formattedMessage)}`;

  const isRtl = t.dir === 'rtl';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="isonil-inquiry-title"
      className="isonil-backdrop-enter fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#05090D]/72 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        {...sheetTouchHandlers}
        className="isonil-sheet-enter isonil-glass-sheet overscroll-contain w-full sm:max-w-lg text-[#F8FAFC] rounded-t-3xl sm:rounded-2xl border ring-1 ring-white/[0.04] p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[92dvh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="sm:hidden w-10 h-1.5 bg-[#C8D4DF]/35 rounded-full mx-auto mb-4"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              aria-hidden="true"
              className="isonil-glass-tile w-10 h-10 rounded-xl border border-[#45C4DC]/35 text-[#45C4DC] flex items-center justify-center shrink-0 mt-0.5"
            >
              <Briefcase className="w-5 h-5" strokeWidth={1.65} />
            </div>
            <div className="min-w-0">
              <h3 id="isonil-inquiry-title" className="text-lg font-semibold text-[#F8FAFC] leading-snug">
                {t.inquiry.modalTitle}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#C8D4DF] leading-relaxed">
                {t.inquiry.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t.actions.close}
            className="isonil-icon-btn min-h-[44px] min-w-[44px] -me-2 -mt-1 rounded-xl text-[#C8D4DF] hover:bg-[#1C2A36] hover:text-white flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.65} />
          </button>
        </div>

        {/* Topic Selector */}
        <div className="mt-5 pt-4 border-t border-[#CBD8E6]/10">
          <p className="text-xs font-medium text-[#96AAB9] mb-2.5">{t.inquiry.topicLabel}</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={t.inquiry.topicLabel}>
            {TOPIC_KEYS.map((key) => {
              const selected = topic === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTopic(key)}
                  aria-pressed={selected}
                  className={`isonil-tab-btn min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer ${
                    selected
                      ? 'bg-gradient-to-b from-[#45C4DC]/24 via-white/[0.10] to-white/[0.04] backdrop-blur-md border border-[#7ADAE9]/44 text-[#F8FAFC] shadow-[0_6px_16px_-10px_rgba(69,196,220,0.44),inset_0_1px_0_rgba(255,255,255,0.22)]'
                      : 'isonil-glass-well border text-[#AEBECC] hover:text-white hover:border-[#45C4DC]/35'
                  }`}
                >
                  {t.inquiry.topics[key]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Structured B2B Fields */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="isonil-inq-name"
                className="block text-xs font-medium text-[#96AAB9] mb-1.5"
              >
                {t.inquiry.nameLabel}
              </label>
              <input
                id="isonil-inq-name"
                type="text"
                autoComplete="name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder={t.inquiry.namePlaceholder}
                className="isonil-glass-well w-full min-h-[44px] px-3.5 py-2 rounded-xl border focus:border-[#45C4DC]/65 focus:outline-none text-sm text-[#F8FAFC] placeholder:text-[#667B8C] transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="isonil-inq-company"
                className="block text-xs font-medium text-[#96AAB9] mb-1.5"
              >
                {t.inquiry.companyLabel}
              </label>
              <input
                id="isonil-inq-company"
                type="text"
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t.inquiry.companyPlaceholder}
                className="isonil-glass-well w-full min-h-[44px] px-3.5 py-2 rounded-xl border focus:border-[#45C4DC]/65 focus:outline-none text-sm text-[#F8FAFC] placeholder:text-[#667B8C] transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="isonil-inq-details"
              className="block text-xs font-medium text-[#96AAB9] mb-1.5"
            >
              {t.inquiry.detailsLabel}
            </label>
            <textarea
              id="isonil-inq-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t.inquiry.detailsPlaceholder}
              className="isonil-glass-well w-full px-3.5 py-2.5 rounded-xl border focus:border-[#45C4DC]/65 focus:outline-none text-sm text-[#F8FAFC] placeholder:text-[#667B8C] leading-relaxed resize-none transition-colors"
            />
          </div>
        </div>

        {/* Direct Dispatch Actions */}
        <div className="mt-5 pt-4 border-t border-[#DCE8F2]/10 space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`isonil-btn-primary w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#7ADAE9]/38 hover:border-[#7ADAE9]/62 bg-gradient-to-b from-[#45C4DC]/[0.22] via-white/[0.10] to-[#45C4DC]/[0.07] hover:from-[#45C4DC]/[0.30] hover:via-white/[0.14] hover:to-[#45C4DC]/[0.11] backdrop-blur-xl shadow-[0_12px_26px_-12px_rgba(69,196,220,0.42),inset_0_1px_0_rgba(255,255,255,0.28)] text-[#F8FAFC] text-sm font-semibold ${
              isRtl ? '' : 'tracking-[0.01em]'
            } flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC]`}
          >
            <MessageCircle className="isonil-btn-icon w-4 h-4 text-[#7ADAE9] shrink-0" strokeWidth={1.75} />
            <span>{t.inquiry.sendWhatsapp}</span>
          </a>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={emailUrl}
              className="isonil-btn isonil-glass-tile group min-h-[46px] px-3 py-2 rounded-xl border text-[#EBF1F6] hover:text-white text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC]"
            >
              <Mail className="isonil-btn-icon w-4 h-4 text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" strokeWidth={1.65} />
              <span className="truncate">{t.inquiry.sendEmail}</span>
            </a>

            <button
              type="button"
              onClick={() => onCopyMessage(formattedMessage)}
              className="isonil-btn isonil-glass-tile group min-h-[46px] px-3 py-2 rounded-xl border text-[#EBF1F6] hover:text-white text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45C4DC] cursor-pointer"
            >
              {messageCopied ? (
                <>
                  <Check className="isonil-check-pop w-4 h-4 text-[#7ADAE9] shrink-0" strokeWidth={1.75} />
                  <span className="text-[#7ADAE9] truncate">{t.actions.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="isonil-btn-icon w-4 h-4 text-[#45C4DC] group-hover:text-[#7ADAE9] shrink-0" strokeWidth={1.65} />
                  <span className="truncate">{t.inquiry.copyMessage}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
