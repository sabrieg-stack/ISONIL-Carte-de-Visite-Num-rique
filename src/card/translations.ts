import type { CardLanguage } from './constants';

export interface CardTranslation {
  dir: 'ltr' | 'rtl';
  langName: string;
  switcherLabel: string;
  metaTitle: string;
  metaDescription: string;
  cardKicker: string;
  displayName: string;
  businessActivity: string;
  cityCountry: string;
  languageSelectorAria: string;
  skipToContent: string;
  stickyBarAria: string;
  dismissToast: string;
  actions: {
    call: string;
    whatsapp: string;
    email: string;
    website: string;
    location: string;
    saveContact: string;
    contactReady: string;
    shareCard: string;
    addToFavorites: string;
    savedInFavorites: string;
    copyLink: string;
    copied: string;
    openMap: string;
    enlargeQr: string;
    downloadQr: string;
    close: string;
  };
  aria: {
    callAction: string;
    whatsappAction: string;
    emailAction: string;
    websiteAction: string;
    locationAction: string;
    saveContactAction: string;
    shareCardAction: string;
    favoritesAction: string;
    copyPhone: string;
    copyEmail: string;
    copyAddress: string;
    copyCardUrl: string;
    qrCodeImage: string;
    logoAlt: string;
  };
  sections: {
    quickActions: string;
    contactDetails: string;
    qrTitle: string;
    qrSubtitle: string;
    permanentLinkLabel: string;
  };
  fields: {
    phoneAndWhatsapp: string;
    email: string;
    website: string;
    address: string;
  };
  share: {
    title: string;
    text: string;
  };
  prefill: {
    whatsappMessage: string;
    emailSubject: string;
  };
  toasts: {
    vcfDownloaded: string;
    linkCopied: string;
    phoneCopied: string;
    emailCopied: string;
    addressCopied: string;
    shareCompleted: string;
    shareFallbackCopied: string;
    qrDownloaded: string;
    favoriteSaved: string;
    favoriteRemoved: string;
    copyError: string;
  };
  qrModal: {
    title: string;
    subtitle: string;
    scanHint: string;
  };
  favoritesModal: {
    title: string;
    subtitle: string;
    browserNote: string;
    iosTitle: string;
    iosSteps: string;
    androidTitle: string;
    androidSteps: string;
    desktopTitle: string;
    desktopSteps: string;
    desktopStepsMac: string;
    desktopStepsWin: string;
    savedStatusLabel: string;
    toggleSave: string;
    toggleRemove: string;
    currentDeviceLabel: string;
  };
  nfcTapHelp: {
    triggerLabel: string;
    triggerAria: string;
    title: string;
    summary: string;
    iphoneTip: string;
    androidTip: string;
  };
  nfc: {
    triggerLabel: string;
    triggerAria: string;
    modalTitle: string;
    modalSubtitle: string;
    managementScopeNote: string;
    statusLabel: string;
    statusReady: string;
    statusIncomplete: string;
    permanentUrlTitle: string;
    permanentUrlHint: string;
    copyNfcLink: string;
    nfcLinkCopiedToast: string;
    chipCompatibilityTitle: string;
    recordTypeLabel: string;
    recordTypeValue: string;
    payloadSizeLabel: string;
    bytesUnit: string;
    ntag213Label: string;
    ntag215Label: string;
    compatibleLabel: string;
    exceedsLabel: string;
    checklistTitle: string;
    checkPermanentUrl: string;
    checkNtagFit: string;
    checkQrSync: string;
    checkVcardReady: string;
    qrAndVcardTitle: string;
    qrAndVcardSubtitle: string;
    downloadVcard: string;
    dynamicUpdateTitle: string;
    dynamicUpdateText: string;
    noDependencyNote: string;
    hardwareNoticeTitle: string;
    hardwareNoticeText: string;
    stepsTitle: string;
    step1: string;
    step2: string;
    step3: string;
  };
  footer: {
    officialNotice: string;
    rights: string;
  };
}

export const CARD_TRANSLATIONS: Record<CardLanguage, CardTranslation> = {
  fr: {
    dir: 'ltr',
    langName: 'Français',
    switcherLabel: 'FR',
    metaTitle: 'ISONIL — La Direction d’ISONIL | Carte de Visite Numérique',
    metaDescription:
      "Carte de visite numérique officielle de La Direction d’ISONIL — Solutions d'Isolation Thermique et Industrielle à El Jadida, Maroc.",
    cardKicker: 'Carte de Visite Numérique Officielle',
    displayName: 'La Direction d’ISONIL',
    businessActivity: "Solutions d'Isolation Thermique et Industrielle",
    cityCountry: 'El Jadida, Maroc',
    languageSelectorAria: 'Choisir la langue de la carte',
    skipToContent: 'Aller directement à la carte de contact',
    stickyBarAria: 'Actions rapides de contact',
    dismissToast: 'Fermer la notification',
    actions: {
      call: 'Appeler',
      whatsapp: 'WhatsApp',
      email: 'E-mail',
      website: 'Site web',
      location: 'Localisation',
      saveContact: 'Enregistrer le contact',
      contactReady: 'Fiche prête',
      shareCard: 'Partager la carte',
      addToFavorites: 'Ajouter aux favoris',
      savedInFavorites: 'Dans vos favoris',
      copyLink: 'Copier le lien',
      copied: 'Copié',
      openMap: 'Voir sur la carte',
      enlargeQr: 'Agrandir le QR',
      downloadQr: 'Télécharger PNG',
      close: 'Fermer',
    },
    aria: {
      callAction: 'Appeler ISONIL au +212 710 738 409',
      whatsappAction: 'Contacter ISONIL sur WhatsApp',
      emailAction: 'Envoyer un e-mail à contact@isonil.com',
      websiteAction: 'Ouvrir le site officiel isonil.com',
      locationAction: "Ouvrir l'adresse ISONIL sur Google Maps",
      saveContactAction: 'Télécharger la fiche contact VCF pour iPhone et Android',
      shareCardAction: 'Partager le lien permanent de la carte ISONIL',
      favoritesAction: 'Ajouter cette carte aux favoris du navigateur',
      copyPhone: 'Copier le numéro de téléphone',
      copyEmail: "Copier l'adresse e-mail",
      copyAddress: "Copier l'adresse postale",
      copyCardUrl: 'Copier le lien permanent de la carte',
      qrCodeImage: 'Code QR permanent vers https://carte.isonil.com/',
      logoAlt: 'Logo officiel ISONIL',
    },
    sections: {
      quickActions: 'Contact direct',
      contactDetails: 'Coordonnées officielles',
      qrTitle: 'Scanner le QR Code',
      qrSubtitle: 'Ouvre directement cette carte officielle sur mobile, sans application requise.',
      permanentLinkLabel: 'Lien permanent',
    },
    fields: {
      phoneAndWhatsapp: 'Téléphone & WhatsApp',
      email: 'E-mail',
      website: 'Site officiel',
      address: 'Adresse',
    },
    share: {
      title: 'ISONIL — La Direction d’ISONIL',
      text: "Carte de visite numérique officielle de La Direction d’ISONIL (Solutions d'Isolation Thermique et Industrielle).",
    },
    prefill: {
      whatsappMessage: 'Bonjour, je vous contacte via la carte de visite numérique officielle d’ISONIL.',
      emailSubject: 'Contact — Carte Numérique ISONIL',
    },
    toasts: {
      vcfDownloaded: 'Fiche contact ISONIL (.vcf) prête à être enregistrée.',
      linkCopied: 'Lien officiel copié dans le presse-papiers.',
      phoneCopied: 'Numéro de téléphone copié.',
      emailCopied: 'Adresse e-mail copiée.',
      addressCopied: 'Adresse complète copiée.',
      shareCompleted: 'Carte partagée avec succès.',
      shareFallbackCopied: 'Partage indisponible — le lien a été copié.',
      qrDownloaded: 'Image QR Code haute définition téléchargée.',
      favoriteSaved: 'Carte marquée comme favorite sur cet appareil.',
      favoriteRemoved: 'Carte retirée des favoris locaux.',
      copyError: 'Impossible de copier automatiquement. Sélectionnez le lien manuellement.',
    },
    qrModal: {
      title: 'QR Code Officiel ISONIL',
      subtitle: 'Pointez la caméra du téléphone pour ouvrir la carte.',
      scanHint: 'Lien permanent et fixe — compatible avec toutes les caméras.',
    },
    favoritesModal: {
      title: 'Ajouter aux favoris',
      subtitle: 'Gardez la carte ISONIL accessible en un instant.',
      browserNote:
        "Pour des raisons de sécurité, les navigateurs n'autorisent pas l'ajout automatique aux favoris par un site web. Utilisez l'option intégrée de votre navigateur :",
      iosTitle: 'iPhone (Safari)',
      iosSteps: "Appuyez sur l'icône Partager en bas, puis choisissez « Sur l'écran d'accueil » ou « Ajouter un signet ».",
      androidTitle: 'Android (Chrome)',
      androidSteps: "Appuyez sur le menu (⋮) en haut à droite, puis sélectionnez « Ajouter à l'écran d'accueil » ou l'étoile Favoris.",
      desktopTitle: 'Ordinateur',
      desktopSteps: 'Utilisez le raccourci Ctrl + D (Windows/Linux) ou ⌘ + D (Mac) pour enregistrer cette page.',
      desktopStepsMac: 'Appuyez sur ⌘ + D dans votre navigateur pour enregistrer immédiatement cette carte.',
      desktopStepsWin: 'Appuyez sur Ctrl + D dans votre navigateur pour enregistrer immédiatement cette carte.',
      savedStatusLabel: 'Rappel local sur cet appareil',
      toggleSave: 'Marquer comme favori ici',
      toggleRemove: 'Retirer le marquage local',
      currentDeviceLabel: 'Cet appareil',
    },
    nfcTapHelp: {
      triggerLabel: 'Aide NFC',
      triggerAria: 'Comment utiliser une carte NFC ISONIL sur téléphone',
      title: 'Comment ouvrir la carte via NFC',
      summary: 'Approchez votre téléphone déverrouillé de la carte physique ISONIL pendant 1 seconde — aucune application n’est requise.',
      iphoneTip: 'iPhone : placez le haut du téléphone (près de la caméra avant) contre la carte.',
      androidTip: 'Android : activez NFC dans les réglages et placez le centre du dos du téléphone sur la carte.',
    },
    nfc: {
      triggerLabel: 'Paramètres NFC',
      triggerAria: 'Ouvrir les paramètres et la préparation NFC de la carte ISONIL',
      modalTitle: 'Configuration & Préparation NFC',
      modalSubtitle: 'Gestion technique pour programmer les cartes physiques NFC ISONIL.',
      managementScopeNote: 'Espace de gestion de la carte — non requis pour les visiteurs.',
      statusLabel: 'État de préparation NFC',
      statusReady: 'Prêt à programmer',
      statusIncomplete: 'Incomplet',
      permanentUrlTitle: 'Lien NFC permanent et fixe',
      permanentUrlHint:
        'Ce lien unique reste identique même si le design ou les coordonnées changent ultérieurement.',
      copyNfcLink: 'Copier le lien NFC',
      nfcLinkCopiedToast: 'Lien NFC permanent copié et prêt à être écrit sur la puce.',
      chipCompatibilityTitle: 'Compatibilité puces NTAG213 / NTAG215',
      recordTypeLabel: 'Type d’enregistrement',
      recordTypeValue: 'NDEF URI / URL (Standard)',
      payloadSizeLabel: 'Taille mémoire estimée',
      bytesUnit: 'octets',
      ntag213Label: 'NTAG213 (144 octets)',
      ntag215Label: 'NTAG215 (504 octets)',
      compatibleLabel: 'Compatible',
      exceedsLabel: 'Capacité dépassée',
      checklistTitle: 'Vérification technique',
      checkPermanentUrl: 'Lien HTTPS permanent et unique',
      checkNtagFit: 'Compatible NTAG213 & NTAG215',
      checkQrSync: 'QR Code synchronisé sur le même lien',
      checkVcardReady: 'Fichier vCard (.vcf) complet et téléchargeable',
      qrAndVcardTitle: 'QR Code & vCard associés',
      qrAndVcardSubtitle:
        'Le même lien permanent sert au QR Code de secours et donne accès au contact vCard.',
      downloadVcard: 'Télécharger vCard (.vcf)',
      dynamicUpdateTitle: 'Mises à jour automatiques sans reprogrammation',
      dynamicUpdateText:
        'En écrivant ce lien permanent sur la puce NFC, toute modification future des données ou du design de la carte apparaît automatiquement lors du prochain scan.',
      noDependencyNote:
        'Ce lien fonctionne immédiatement sans puce NFC, sans abonnement et sans service externe payant.',
      hardwareNoticeTitle: 'Information importante sur la programmation',
      hardwareNoticeText:
        'Ce site prépare et vérifie le lien NFC, mais ne peut pas écrire directement sur une puce physique sans un appareil compatible (smartphone équipé NFC avec une application d’écriture NDEF gratuite, ou lecteur/encodeur NFC USB).',
      stepsTitle: 'Étapes d’écriture sur NTAG213 / NTAG215',
      step1: 'Copiez le lien NFC permanent ci-dessus.',
      step2: 'Ouvrez une application d’écriture NFC standard et ajoutez un enregistrement « URL / URI ».',
      step3: 'Approchez la carte vierge NTAG213 ou NTAG215 du téléphone ou du lecteur NFC pour enregistrer.',
    },
    footer: {
      officialNotice: 'Fiche officielle ISONIL — El Jadida, Maroc',
      rights: 'ISONIL',
    },
  },

  en: {
    dir: 'ltr',
    langName: 'English',
    switcherLabel: 'EN',
    metaTitle: 'ISONIL — ISONIL Management | Digital Business Card',
    metaDescription:
      'Official digital business card of ISONIL Management — Thermal & Industrial Insulation Solutions in El Jadida, Morocco.',
    cardKicker: 'Official Digital Business Card',
    displayName: 'ISONIL Management',
    businessActivity: 'Thermal & Industrial Insulation Solutions',
    cityCountry: 'El Jadida, Morocco',
    languageSelectorAria: 'Choose card language',
    skipToContent: 'Skip to contact card',
    stickyBarAria: 'Quick contact bar',
    dismissToast: 'Dismiss notification',
    actions: {
      call: 'Call',
      whatsapp: 'WhatsApp',
      email: 'Email',
      website: 'Website',
      location: 'Location',
      saveContact: 'Save Contact',
      contactReady: 'Contact ready',
      shareCard: 'Share Card',
      addToFavorites: 'Add to Favorites',
      savedInFavorites: 'Saved in Favorites',
      copyLink: 'Copy Link',
      copied: 'Copied',
      openMap: 'Open in Maps',
      enlargeQr: 'Enlarge QR',
      downloadQr: 'Download PNG',
      close: 'Close',
    },
    aria: {
      callAction: 'Call ISONIL at +212 710 738 409',
      whatsappAction: 'Start a WhatsApp chat with ISONIL',
      emailAction: 'Send an email to contact@isonil.com',
      websiteAction: 'Visit official website isonil.com',
      locationAction: 'Open ISONIL address in Google Maps',
      saveContactAction: 'Download VCF contact card for iPhone and Android',
      shareCardAction: 'Share the permanent ISONIL card link',
      favoritesAction: 'Save this card to browser favorites',
      copyPhone: 'Copy phone number',
      copyEmail: 'Copy email address',
      copyAddress: 'Copy street address',
      copyCardUrl: 'Copy permanent card link',
      qrCodeImage: 'Permanent QR code linking to https://carte.isonil.com/',
      logoAlt: 'Official ISONIL logo',
    },
    sections: {
      quickActions: 'Direct Actions',
      contactDetails: 'Official Contact Details',
      qrTitle: 'Scan QR Code',
      qrSubtitle: 'Opens this official digital card directly on any smartphone camera.',
      permanentLinkLabel: 'Permanent link',
    },
    fields: {
      phoneAndWhatsapp: 'Phone & WhatsApp',
      email: 'Email',
      website: 'Official Website',
      address: 'Address',
    },
    share: {
      title: 'ISONIL — ISONIL Management',
      text: 'Official digital business card of ISONIL Management (Thermal & Industrial Insulation Solutions).',
    },
    prefill: {
      whatsappMessage: 'Hello, I am reaching out via the official ISONIL digital business card.',
      emailSubject: 'Contact — ISONIL Digital Business Card',
    },
    toasts: {
      vcfDownloaded: 'ISONIL contact file (.vcf) ready to save.',
      linkCopied: 'Official card link copied to clipboard.',
      phoneCopied: 'Phone number copied.',
      emailCopied: 'Email address copied.',
      addressCopied: 'Full address copied.',
      shareCompleted: 'Card shared successfully.',
      shareFallbackCopied: 'Native share unavailable — link copied instead.',
      qrDownloaded: 'High-resolution QR Code PNG downloaded.',
      favoriteSaved: 'Card marked as favorite on this device.',
      favoriteRemoved: 'Card removed from local favorites.',
      copyError: 'Unable to copy automatically. Please copy the link manually.',
    },
    qrModal: {
      title: 'Official ISONIL QR Code',
      subtitle: 'Point any smartphone camera to open this card.',
      scanHint: 'Fixed permanent URL — works across iOS and Android cameras.',
    },
    favoritesModal: {
      title: 'Add to Favorites',
      subtitle: 'Keep the ISONIL card ready whenever you need it.',
      browserNote:
        'For browser security, websites cannot add bookmarks automatically. Use your browser menu to save this page directly:',
      iosTitle: 'iPhone (Safari)',
      iosSteps: 'Tap the Share icon at the bottom, then choose "Add to Home Screen" or "Add Bookmark".',
      androidTitle: 'Android (Chrome)',
      androidSteps: 'Tap the menu (⋮) in the top right, then choose "Add to Home screen" or tap the Bookmark star.',
      desktopTitle: 'Desktop Browser',
      desktopSteps: 'Press Ctrl + D (Windows/Linux) or ⌘ + D (Mac) to bookmark this page.',
      desktopStepsMac: 'Press ⌘ + D in your browser to bookmark this card right away.',
      desktopStepsWin: 'Press Ctrl + D in your browser to bookmark this card right away.',
      savedStatusLabel: 'Local bookmark state on this device',
      toggleSave: 'Mark as favorite here',
      toggleRemove: 'Remove local favorite mark',
      currentDeviceLabel: 'This device',
    },
    nfcTapHelp: {
      triggerLabel: 'NFC Guide',
      triggerAria: 'How to tap a phone against an ISONIL NFC card',
      title: 'How to tap with NFC',
      summary: 'Hold your unlocked phone against the physical ISONIL smart card for 1 second — no app required.',
      iphoneTip: 'iPhone: tap the top edge of the phone near the front camera against the card.',
      androidTip: 'Android: make sure NFC is enabled and hold the back center of the phone against the card.',
    },
    nfc: {
      triggerLabel: 'NFC Settings',
      triggerAria: 'Open NFC setup and readiness management for the ISONIL card',
      modalTitle: 'NFC Setup & Preparation',
      modalSubtitle: 'Technical management tools for programming physical ISONIL NFC cards.',
      managementScopeNote: 'Card management panel — intended for administrators, not regular visitors.',
      statusLabel: 'NFC Readiness Status',
      statusReady: 'Ready to Program',
      statusIncomplete: 'Incomplete',
      permanentUrlTitle: 'Fixed Permanent NFC Link',
      permanentUrlHint:
        'This unique URL never changes when the card design or contact information is updated.',
      copyNfcLink: 'Copy NFC Link',
      nfcLinkCopiedToast: 'Permanent NFC link copied and ready to write to a chip.',
      chipCompatibilityTitle: 'NTAG213 / NTAG215 Chip Compatibility',
      recordTypeLabel: 'Record Format',
      recordTypeValue: 'Standard NDEF URI / URL',
      payloadSizeLabel: 'Estimated Tag Footprint',
      bytesUnit: 'bytes',
      ntag213Label: 'NTAG213 (144 bytes)',
      ntag215Label: 'NTAG215 (504 bytes)',
      compatibleLabel: 'Compatible',
      exceedsLabel: 'Exceeds capacity',
      checklistTitle: 'Readiness Verification',
      checkPermanentUrl: 'Permanent unique HTTPS URL active',
      checkNtagFit: 'Fits NTAG213 & NTAG215 memory',
      checkQrSync: 'QR Code synced to identical URL',
      checkVcardReady: 'Complete vCard (.vcf) contact payload ready',
      qrAndVcardTitle: 'Synced QR Code & vCard',
      qrAndVcardSubtitle:
        'The exact same permanent link powers the backup QR code and vCard contact download.',
      downloadVcard: 'Download vCard (.vcf)',
      dynamicUpdateTitle: 'Automatic Future Updates Without Reprogramming',
      dynamicUpdateText:
        'Writing this permanent URL to your NFC tag ensures any future update to ISONIL contact details or design appears automatically whenever the same physical card is tapped.',
      noDependencyNote:
        'This link works immediately on its own — no NFC chip, subscription, or paid third-party service is required to activate it.',
      hardwareNoticeTitle: 'Important Programming Disclosure',
      hardwareNoticeText:
        'This website prepares and verifies your NFC payload, but it cannot write directly to a physical NFC chip without an NFC-capable writing device (such as an NFC-enabled smartphone with a free standard NDEF writer app, or a USB NFC encoder).',
      stepsTitle: 'How to Write to NTAG213 / NTAG215',
      step1: 'Copy the fixed permanent NFC URL above.',
      step2: 'Open a standard NFC writer app on an NFC-capable device and choose a URL / URI record.',
      step3: 'Hold a blank NTAG213 or NTAG215 card against the NFC antenna to write and verify.',
    },
    footer: {
      officialNotice: 'Official ISONIL Contact Card — El Jadida, Morocco',
      rights: 'ISONIL',
    },
  },

  ar: {
    dir: 'rtl',
    langName: 'العربية',
    switcherLabel: 'العربية',
    metaTitle: 'ISONIL — إدارة ISONIL | بطاقة التعريف الرقمية',
    metaDescription:
      'بطاقة التعريف الرقمية الرسمية لإدارة ISONIL — حلول العزل الحراري والصناعي في الجديدة، المغرب.',
    cardKicker: 'بطاقة التعريف الرقمية الرسمية',
    displayName: 'إدارة ISONIL',
    businessActivity: 'حلول العزل الحراري والصناعي',
    cityCountry: 'الجديدة، المغرب',
    languageSelectorAria: 'اختيار لغة البطاقة',
    skipToContent: 'الانتقال مباشرة إلى بطاقة التواصل',
    stickyBarAria: 'شريط التواصل السريع',
    dismissToast: 'إغلاق الإشعار',
    actions: {
      call: 'اتصال',
      whatsapp: 'واتساب',
      email: 'البريد',
      website: 'الموقع',
      location: 'الخريطة',
      saveContact: 'حفظ جهة الاتصال',
      contactReady: 'تم تجهيز الملف',
      shareCard: 'مشاركة البطاقة',
      addToFavorites: 'إضافة للمفضلة',
      savedInFavorites: 'محفوظة في المفضلة',
      copyLink: 'نسخ الرابط',
      copied: 'تم النسخ',
      openMap: 'فتح في الخرائط',
      enlargeQr: 'تكبير الرمز',
      downloadQr: 'تنزيل PNG',
      close: 'إغلاق',
    },
    aria: {
      callAction: 'الاتصال بشركة ISONIL على الرقم +212 710 738 409',
      whatsappAction: 'بدء محادثة واتساب مع شركة ISONIL',
      emailAction: 'إرسال بريد إلكتروني إلى contact@isonil.com',
      websiteAction: 'فتح الموقع الرسمي isonil.com',
      locationAction: 'فتح عنوان ISONIL على خرائط جوجل',
      saveContactAction: 'تنزيل ملف جهة الاتصال VCF لهواتف أندرويد وآيفون',
      shareCardAction: 'مشاركة الرابط الدائم لبطاقة ISONIL',
      favoritesAction: 'حفظ البطاقة في مفضلة المتصفح',
      copyPhone: 'نسخ رقم الهاتف',
      copyEmail: 'نسخ البريد الإلكتروني',
      copyAddress: 'نسخ العنوان الكامل',
      copyCardUrl: 'نسخ الرابط الدائم للبطاقة',
      qrCodeImage: 'رمز QR دائم يفتح الرابط https://carte.isonil.com/',
      logoAlt: 'الشعار الرسمي لشركة ISONIL',
    },
    sections: {
      quickActions: 'التواصل السريع',
      contactDetails: 'بيانات التواصل الرسمية',
      qrTitle: 'مسح رمز QR',
      qrSubtitle: 'يفتح هذه البطاقة الرقمية الرسمية مباشرة عبر كاميرا الهاتف دون الحاجة لأي تطبيق.',
      permanentLinkLabel: 'الرابط الدائم',
    },
    fields: {
      phoneAndWhatsapp: 'الهاتف وواتساب',
      email: 'البريد الإلكتروني',
      website: 'الموقع الإلكتروني',
      address: 'العنوان',
    },
    share: {
      title: 'ISONIL — إدارة ISONIL',
      text: 'بطاقة التعريف الرقمية الرسمية لإدارة ISONIL — حلول العزل الحراري والصناعي.',
    },
    prefill: {
      whatsappMessage: 'السلام عليكم، أتواصل معكم عبر بطاقة التعريف الرقمية الرسمية لشركة ISONIL.',
      emailSubject: 'تواصل عبر البطاقة الرقمية — ISONIL',
    },
    toasts: {
      vcfDownloaded: 'تم تجهيز ملف جهة الاتصال (.vcf) للحفظ على جهازك.',
      linkCopied: 'تم نسخ رابط البطاقة الرسمي.',
      phoneCopied: 'تم نسخ رقم الهاتف.',
      emailCopied: 'تم نسخ البريد الإلكتروني.',
      addressCopied: 'تم نسخ العنوان الكامل.',
      shareCompleted: 'تمت مشاركة البطاقة بنجاح.',
      shareFallbackCopied: 'المشاركة المباشرة غير متوفرة — تم نسخ الرابط.',
      qrDownloaded: 'تم تنزيل صورة رمز QR بدقة عالية.',
      favoriteSaved: 'تم تمييز البطاقة كمفضلة على هذا الجهاز.',
      favoriteRemoved: 'تمت إزالة التمييز المحلي للبطاقة.',
      copyError: 'تعذر النسخ التلقائي. يمكنك نسخ الرابط يدوياً.',
    },
    qrModal: {
      title: 'رمز QR الرسمي لشركة ISONIL',
      subtitle: 'وجّه كاميرا الهاتف لمسح الرمز وفتح البطاقة مباشرة.',
      scanHint: 'رابط دائم وثابت — متوافق مع كاميرات آيفون وأندرويد.',
    },
    favoritesModal: {
      title: 'إضافة البطاقة إلى المفضلة',
      subtitle: 'احتفظ ببطاقة ISONIL للوصول السريع في أي وقت.',
      browserNote:
        'لا تسمح المتصفحات للمواقع بإضافة الصفحات إلى المفضلة تلقائياً حفاظاً على خصوصيتك. يمكنك إضافتها مباشرة من المتصفح بالطريقة التالية:',
      iosTitle: 'آيفون (Safari)',
      iosSteps: 'اضغط على زر المشاركة أسفل الشاشة، ثم اختر «إضافة إلى الشاشة الرئيسية» أو «إضافة إشارة مرجعية».',
      androidTitle: 'أندرويد (Chrome)',
      androidSteps: 'اضغط على القائمة (⋮) أعلى الشاشة، ثم اختر «الإضافة إلى الشاشة الرئيسية» أو اضغط على أيقونة النجمة.',
      desktopTitle: 'الكمبيوتر',
      desktopSteps: 'اضغط على الاختصار Ctrl + D (ويندوز/لينكس) أو ⌘ + D (ماك) لحفظ الصفحة في المفضلة.',
      desktopStepsMac: 'اضغط على الاختصار ⌘ + D في متصفحك لحفظ البطاقة فوراً في المفضلة.',
      desktopStepsWin: 'اضغط على الاختصار Ctrl + D في متصفحك لحفظ البطاقة فوراً في المفضلة.',
      savedStatusLabel: 'حالة الحفظ المحلية على هذا المتصفح',
      toggleSave: 'تمييز كمفضلة هنا',
      toggleRemove: 'إزالة التمييز المحلي',
      currentDeviceLabel: 'جهازك الحالي',
    },
    nfcTapHelp: {
      triggerLabel: 'دليل NFC',
      triggerAria: 'كيفية لمس الهاتف ببطاقة ISONIL الذكية بتقنية NFC',
      title: 'طريقة فتح البطاقة بلمسة NFC',
      summary: 'قرّب هاتفك المفتوح من بطاقة ISONIL الذكية لمدة ثانية واحدة لفتح البطاقة تلقائياً دون أي تطبيق.',
      iphoneTip: 'آيفون: قرّب الحافة العلوية للهاتف (بجانب الكاميرا الأمامية) من البطاقة.',
      androidTip: 'أندرويد: فعّل NFC من الإعدادات وقرّب منتصف ظهر الهاتف من البطاقة.',
    },
    nfc: {
      triggerLabel: 'إعدادات NFC',
      triggerAria: 'فتح إعدادات وتجهيز تقنية NFC لبطاقة ISONIL',
      modalTitle: 'إعدادات وتجهيز NFC',
      modalSubtitle: 'أدوات الإدارة التقنية لتجهيز وكتابة بطاقات ISONIL الذكية بتقنية NFC.',
      managementScopeNote: 'قسم خاص بإدارة البطاقة — ولا يظهر كعنصر مزعج لزوار البطاقة.',
      statusLabel: 'حالة التجهيز للبرمجة',
      statusReady: 'جاهز للبرمجة',
      statusIncomplete: 'غير مكتمل',
      permanentUrlTitle: 'رابط NFC الدائم والثابت',
      permanentUrlHint:
        'رابط فريد وثابت لا يتغير بتغير تصميم البطاقة أو تحديث بيانات التواصل مستقبلاً.',
      copyNfcLink: 'نسخ رابط NFC',
      nfcLinkCopiedToast: 'تم نسخ رابط NFC الدائم وهو جاهز للكتابة على الشريحة.',
      chipCompatibilityTitle: 'التوافق مع شرائح NTAG213 و NTAG215',
      recordTypeLabel: 'نوع السجل القياسي',
      recordTypeValue: 'NDEF URI / URL (قياسي)',
      payloadSizeLabel: 'الحجم التقديري على الشريحة',
      bytesUnit: 'بايت',
      ntag213Label: 'شريحة NTAG213 (سعة 144 بايت)',
      ntag215Label: 'شريحة NTAG215 (سعة 504 بايت)',
      compatibleLabel: 'متوافق',
      exceedsLabel: 'يتجاوز السعة',
      checklistTitle: 'فحص جاهزية التجهيز',
      checkPermanentUrl: 'رابط HTTPS دائم وفريد ومعتمد',
      checkNtagFit: 'مناسب لسعة شرائح NTAG213 و NTAG215',
      checkQrSync: 'رمز QR مطابق لنفس الرابط الدائم',
      checkVcardReady: 'ملف جهات الاتصال vCard (.vcf) مكتمل وجاهز للتنزيل',
      qrAndVcardTitle: 'رمز QR وملف vCard المرتبطان',
      qrAndVcardSubtitle:
        'نفس الرابط الثابت يُستخدم لرمز QR الاحتياطي على البطاقة ويتيح حفظ جهة الاتصال بصيغة vCard.',
      downloadVcard: 'تنزيل vCard (.vcf)',
      dynamicUpdateTitle: 'تحديث تلقائي للبيانات دون إعادة برمجة الشريحة',
      dynamicUpdateText:
        'بمجرد كتابة هذا الرابط الدائم على الشريحة، سيظهر أي تحديث مستقبلي لبيانات أو تصميم بطاقة ISONIL تلقائياً عند لمس نفس البطاقة دون الحاجة لإعادة برمجتها.',
      noDependencyNote:
        'يعمل الرابط فوراً بشكل مستقل دون اشتراط وجود شريحة NFC مسبقاً ودون أي اشتراكات أو خدمات خارجية مدفوعة.',
      hardwareNoticeTitle: 'توضيح تقني مهم حول برمجة الشريحة',
      hardwareNoticeText:
        'يُجهّز هذا القسم الرابط والبيانات ويتحقق من جاهزيتها، لكن الموقع لا يستطيع برمجة شريحة NFC الفعلية بنفسه دون جهاز يدعم الكتابة عليها (مثل هاتف يدعم NFC مع تطبيق كتابة NDEF قياسي، أو قارئ/كاتب NFC عبر USB).',
      stepsTitle: 'خطوات الكتابة على شريحة NTAG213 أو NTAG215',
      step1: 'انسخ رابط NFC الدائم والثابت أعلاه.',
      step2: 'افتح تطبيق كتابة NFC قياسياً على جهاز يدعم NFC واختر إضافة سجل رابط (URL / URI).',
      step3: 'قرّب بطاقة NTAG213 أو NTAG215 الفارغة من هوائي NFC بالهاتف أو القارئ لإتمام الكتابة.',
    },
    footer: {
      officialNotice: 'البطاقة الرقمية الرسمية لشركة ISONIL — الجديدة، المغرب',
      rights: 'ISONIL',
    },
  },
};
