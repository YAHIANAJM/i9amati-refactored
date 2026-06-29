export const ar = {
  errors: {
    title: {
      error: "خطأ",
      warning: "تحذير",
      NOT_FOUND: "غير موجود",
      UNAUTHORIZED: "غير مصرح",
      FORBIDDEN: "ممنوع الوصول",
      CONFLICT: "تعارض في البيانات",
      VALIDATION_ERROR: "بيانات غير صالحة"
    },
    codes: {
      ERROR_FORBIDDEN: "ليس لديك صلاحية لهذا الإجراء",
      ERROR_GROUP_NOT_FOUND: "المجموعة غير موجودة",
      ERROR_CANNOT_REMOVE_SYNDIC: "لا يمكن إزالة مدير المجموعة",
      ERROR_NOT_MEMBER: "لست عضوا في هذه المجموعة",
      ERROR_POST_NOT_FOUND: "المنشور غير موجود",
      ERROR_COMMENT_NOT_FOUND: "التعليق غير موجود",
      ERROR_PARENT_COMMENT_NOT_FOUND: "التعليق الأساسي غير موجود",
      ERROR_ANALYTICS_FORBIDDEN: "إحصاءات الفيد متاحة للسنديك فقط",
      NOT_FOUND: "تحقق من البيانات وحاول مرة أخرى",
      UNAUTHORIZED: "يرجى تسجيل الدخول أولاً",
      FORBIDDEN: "ليس لديك صلاحية لهذا الإجراء",
      CONFLICT: "تعارض في البيانات",
      VALIDATION_ERROR: "بيانات غير صالحة",
      BAD_REQUEST: "طلب غير صالح",
      INTERNAL_ERROR: "حدث خطأ غير متوقع"
    }
  },
  success: {
    groupCreated: "تم إنشاء المجموعة",
    groupUpdated: "تم تحديث المجموعة",
    groupDeleted: "تم حذف المجموعة",
    memberAdded: "تمت إضافة العضو",
    memberRemoved: "تمت إزالة العضو",
    postCreated: "تم نشر المنشور",
    postUpdated: "تم تحديث المنشور",
    postDeleted: "تم حذف المنشور",
    commentAdded: "تمت إضافة التعليق",
    commentDeleted: "تم حذف التعليق",
    generic: "تمت العملية بنجاح"
  },
  feed: {
    pageTitle: "الفيد المجتمعي",
    pageSubtitle: "تواصل مع مجتمعك",
    groupName: "اسم المجموعة...",
    cancel: "إلغاء",
    save: "حفظ",
    members: "أعضاء",
    loading: "جاري التحميل...",
    failedLoadMembers: "فشل في تحميل الأعضاء.",
    noMembersYet: "لا يوجد أعضاء بعد.",
    unknown: "مجهول",
    addMember: "إضافة عضو",
    available: "متاح",
    allMembersAdded: "تمت إضافة جميع الأعضاء المتاحين.",
    loadingComments: "جاري تحميل التعليقات...",
    noCommentsYet: "لا توجد تعليقات بعد.",
    writeComment: "اكتب تعليقاً...",
    post: "نشر",
    photoVideo: "صورة / فيديو",
    whatAreYouThinking: "بم تفكر؟",
    postingTo: "نشر إلى",
    noGroupsYet: "لا توجد مجموعات بعد.",
    createGroup: "قم بإنشاء مجموعة لبدء التواصل مع مجتمعك.",
    createGroupBtn: "إنشاء مجموعة",
    rename: "إعادة تسمية",
    delete: "حذف",
    manageMembers: "إدارة الأعضاء",
    noPostsYet: "لا توجد منشورات بعد.",
    shareSomething: "شارك شيئاً مع هذه المجموعة!",
    like: "إعجاب",
    comment: "تعليق",
    share: "مشاركة",
    viewAllComments: "عرض جميع التعليقات ({{count}})",
    hideComments: "إخفاء التعليقات",
    editPost: "تعديل المنشور",
    deletePost: "حذف المنشور",
    newGroup: "مجموعة جديدة",
    renameGroup: "إعادة تسمية المجموعة",
    selectMedia: "اختر صورة أو فيديو",
    removeMedia: "إزالة المرفق",
    unsupportedFile: "نوع الملف غير مدعوم أو حجمه كبير جدًا",
    publishing: "جاري النشر...",
    groupsLoadError: "فشل تحميل المجموعات.",
    postsLoadError: "فشل تحميل المنشورات.",
    syndicBadge: "السنديك",
    memberBadge: "عضو",
    groups: "المجموعات",
    selectGroup: "اختر مجموعة",
    selectGroupDesc: "اختر مجموعة من الشريط الجانبي لعرض المنشورات والتفاعل.",
    beFirstToPost: "كن أول من ينشر في هذه المجموعة!"
  },
  feedAnalytics: {
    title: "تحليلات الفيد",
    subtitle: "الانخراط والنشاط المجتمعي",
    loading: "جاري تحميل الإحصاءات...",
    kpi: {
      publications: "منشورات",
      totalLikes: "إجمالي الإعجابات",
      comments: "تعليقات",
      members: "أعضاء",
      avgEngagement: "متوسط التفاعل"
    },
    charts: {
      activityByGroup: "النشاط حسب المجموعة",
      activityOverTime: "النشاط عبر الزمن (30 يوماً)",
      posts: "منشورات",
      likes: "إعجابات",
      comments: "تعليقات",
      publications: "منشورات",
      postsDistribution: "توزيع المنشورات"
    },
    topPosts: {
      title: "أفضل المنشورات",
      none: "لا توجد منشورات بعد."
    },
    topMembers: {
      title: "الأعضاء الأكثر نشاطاً",
      none: "لا يوجد نشاط بعد."
    },
    error: {
      title: "خطأ في التحميل",
      desc: "تعذر تحميل البيانات. حاول مرة أخرى لاحقاً.",
      forbiddenTitle: "وصول محدود",
      forbiddenDesc: "إحصاءات الفيد متاحة للسنديك فقط."
    }
  },
  nav: {
    search: "ابحث في i9amati...",
    matchingPages: "الصفحات المطابقة",
    noPageFound: "لا توجد نتائج",
    tryAnother: "جرّب كلمة أخرى",
    home: "الرئيسية",
    about: "حول",
    services: "الخدمات",
    profile: "الملف الشخصي",
    logout: "تسجيل الخروج",
    lang: "اللغة",
    syndic: "السنديك",
    syndicMgmt: "إدارة السنديك"
  },
  login: {
    subtitle: "إقامتي – القصة الإنسانية",
    email: "البريد الإلكتروني أو رقم الهاتف",
    password: "كلمة المرور",
    forgot: "نسيت؟",
    submit: "دخول",
    loading: "جاري الدخول...",
    orWith: "أو تابع مع",
    noAccount: "أول مرة؟",
    createAccount: "إنشاء حساب",
    savedAccounts: "الحسابات المحفوظة",
    continueAs: "تابع كـ {{name}}",
    savedCount: "{{count}} حسابات محفوظة",
    savePrompt: "حفظ الحساب؟",
    notNow: "ليس الآن",
    save: "حفظ",
    loginFailed: "فشل تسجيل الدخول",
    checkCredentials: "تحقق من البريد الإلكتروني وكلمة المرور",
    savedConfirm: "تم حفظ الحساب",
    savedDetail: "سيتم تعبئة {{email}} تلقائياً",
    welcome: "مرحباً بك",
    loginSuccess: "تم تسجيل الدخول بنجاح"
  },
  register: {
    subtitle: "أنشئ فضاء السنديك الخاص بك",
    firstName: "الاسم الأول",
    lastName: "الكنية",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    submit: "إنشاء حساب",
    loading: "جاري الإنشاء...",
    orWith: "أو تابع مع",
    haveAccount: "لديك حساب مسبقاً؟",
    signIn: "تسجيل الدخول",
    mismatch: "كلمتا المرور غير متطابقتين",
    registerFailed: "فشل إنشاء الحساب"
  },
  unionDash: {
    title: "تحليلات الاتحاد",
    subtitle: "تغطية المباني · المندوبون · شبكة الشركاء",
    kpi: {
      activeDelegates: "مندوبون نشطون",
      pendingInvites: "دعوات معلقة",
      buildingCoverage: "تغطية المباني",
      partnerSyndics: "سنديك شركاء",
      totalInSystem: "{{count}} إجمالي في النظام",
      awaitingResponse: "في انتظار الرد",
      allResponded: "جميعهم ردوا",
      buildingsCovered: "{{covered}} من {{total}} مبنى",
      network: "شبكة {{count}} سنديك",
      noPartners: "لا يوجد شركاء بعد"
    },
    charts: {
      delegatesPerBuilding: "المندوبون لكل مبنى",
      active: "نشط",
      pending: "معلق",
      delegateStatus: "حالة المندوبين",
      buildingCoverage: "تغطية المباني",
      covered: "مغطى",
      uncovered: "غير مغطى"
    },
    coverage: {
      active: "مغطى",
      pending: "قيد الانتظار",
      uncovered: "غير مغطى",
      noDelegate: "لم يُعيَّن مندوب"
    },
    errors: {
      buildings: "فشل تحميل المباني",
      delegates: "فشل تحميل المندوبين",
      partners: "فشل تحميل الشركاء"
    },
    sections: {
      pendingInvites: "الدعوات المعلقة",
      partners: "شبكة الشركاء",
      activeDelegates: "المندوبون النشطون",
      buildingStatus: "حالة المباني"
    },
    urgency: {
      daysAgo: "منذ {{count}} يوم"
    },
    empty: {
      noPending: "لا توجد دعوات معلقة",
      noPartners: "لم يتم ربط أي سنديك شريك بعد",
      noDelegates: "لا يوجد مندوبون نشطون بعد"
    }
  },
  meetingsDash: {
    title: "تحليلات الاجتماعات والتصويت",
    subtitle: "إحصاءات الاجتماعات والتصويتات",
    kpi: {
      total: "إجمالي الاجتماعات",
      scheduled: "مجدولة",
      activeVotes: "تصويتات نشطة",
      avgQuorum: "متوسط النصاب",
      adoptionRate: "نسبة التبني",
      convocations: "الاستدعاءات"
    },
    charts: {
      frequency: "الاجتماعات شهرياً (آخر 6 أشهر)",
      statuses: "الحالات",
      rsvp: "تفاعل الحضور",
      adoption: "تبني القرارات",
      meetings: "اجتماعات",
      accepted: "قبل",
      declined: "رفض",
      pending: "قيد الانتظار",
      adopted: "مُتبنى",
      rejected: "مرفوض"
    },
    status: {
      scheduled: "مجدول",
      inProgress: "جارٍ",
      completed: "مكتمل",
      cancelled: "ملغى"
    },
    sections: {
      quorum: "تحليل النصاب",
      resolutions: "جدول القرارات",
      activeVotes: "التصويتات النشطة"
    },
    quorum: {
      reached: "تحقق",
      notReached: "لم يتحقق"
    },
    noData: "لا توجد بيانات",
    loading: "جاري التحميل..."
  },
  meetings: {
    title: "الاجتماعات والتصويت",
    newMeeting: "اجتماع جديد",
    types: {
      GLOBAL: "جمعية عامة",
      EXCEPTIONAL: "جمعية عامة استثنائية",
      NORMAL: "اجتماع مجلس"
    },
    status: {
      SCHEDULED: "مجدول",
      IN_PROGRESS: "جارٍ",
      COMPLETED: "مكتمل",
      CANCELLED: "ملغى"
    },
    convocation: "استدعاء",
    sendConvocation: "إرسال الاستدعاء",
    attendees: "الحاضرون",
    agenda: "جدول الأعمال",
    vote: "تصويت",
    addItem: "إضافة بند",
    quorum: "النصاب",
    required: "مطلوب",
    present: "حاضر",
    eligible: "مؤهل",
    adopted: "مُتبنى",
    rejected: "مرفوض",
    open: "مفتوح",
    closed: "مغلق",
    start: "بدء الاجتماع",
    end: "إنهاء الاجتماع",
    cancel: "إلغاء",
    confirm: "تأكيد",
    delete: "حذف"
  },
  unionMembers: {
    title: "أعضاء الاتحاد",
    tabs: {
      delegates: "المندوبون",
      partners: "سنديك شركاء"
    },
    delegates: {
      active: "مندوبون نشطون",
      pending: "دعوات معلقة",
      invite: "دعوة مندوب",
      noActive: "لا يوجد مندوبون نشطون بعد",
      noPending: "لا توجد دعوات معلقة",
      building: "المبنى",
      since: "منذ"
    },
    partners: {
      title: "سنديك شركاء",
      noPartners: "لم يتم ربط أي سنديك شريك بعد",
      residence: "الإقامة",
      linkedSince: "مرتبط منذ",
      edit: "تعديل",
      delete: "حذف",
      name: "الاسم",
      phone: "الهاتف",
      note: "ملاحظة (اختياري)",
      save: "حفظ التغييرات",
      saving: "جاري الحفظ..."
    },
    confirm: {
      deleteDelegate: "حذف دعوة المندوب؟",
      deletePartner: "إزالة السنديك الشريك؟",
      yes: "نعم، احذف",
      cancel: "إلغاء"
    }
  },
  home: {
    title: "إقامتي",
    tagline: "إدارة حديثة للسنديك في الإقامات المغربية",
    getStarted: "ابدأ الآن",
    learnMore: "اعرف أكثر",
    features: "المميزات",
    about: "حول",
    contact: "تواصل معنا"
  },
  auth: {
    forgot: {
      title: "إعادة تعيين كلمة المرور",
      emailPlaceholder: "أدخل بريدك الإلكتروني",
      sendBtn: "إرسال رابط الاستعادة",
      sending: "جاري الإرسال…",
      successTitle: "تم الإرسال",
      successDesc: "تحقق من بريدك الإلكتروني للحصول على رابط الاستعادة.",
      errorTitle: "خطأ",
      errorDesc: "فشل إرسال البريد الإلكتروني. حاول مرة أخرى.",
      remembered: "تذكرت كلمة المرور؟",
      loginLink: "العودة إلى تسجيل الدخول"
    },
    reset: {
      title: "تعيين كلمة مرور جديدة",
      passwordPlaceholder: "كلمة المرور الجديدة",
      confirmPlaceholder: "تأكيد كلمة المرور الجديدة",
      resetBtn: "تعيين كلمة المرور",
      processing: "جاري المعالجة…",
      successTitle: "تم تحديث كلمة المرور",
      successDesc: "تم تغيير كلمة مرورك. يمكنك الآن تسجيل الدخول.",
      errorTitle: "خطأ",
      errorDesc: "فشل إعادة تعيين كلمة المرور. حاول مرة أخرى.",
      mismatchTitle: "كلمتا المرور غير متطابقتين",
      mismatchDesc: "يرجى التأكد من أن كلمتي المرور متطابقتين.",
      missingToken: "رمز الاستعادة مفقود. يرجى استخدام الرابط الوارد في بريدك الإلكتروني."
    }
  },
  common: {
    cancel: "إلغاء",
    delete: "حذف"
  },
  services: {
    pageTitle: "الخدمات والعقود",
    pageSubtitle: "إدارة مزودي الخدمات والعقود والموظفين",
    loading: "جاري تحميل الخدمات…",
    loadError: "فشل تحميل الخدمات.",
    noServicesYet: "لا توجد خدمات بعد.",
    addFirstService: "أضف أول مزود خدمة للبدء.",
    createService: "إضافة خدمة",
    editService: "تعديل الخدمة",
    providerName: "اسم المزود",
    serviceType: "نوع الخدمة",
    serviceTypePlaceholder: "اختر نوعاً…",
    description: "الوصف",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    firstName: "الاسم الأول",
    lastName: "الكنية",
    status: "الحالة",
    startDate: "تاريخ البداية",
    endDate: "تاريخ النهاية",
    save: "حفظ",
    saveWithFiles: "حفظ مع الملفات",
    skipAndSave: "تخطي وحفظ",
    next: "التالي",
    back: "رجوع",
    cancel: "إلغاء",
    confirm: "تأكيد",
    created: "تم إنشاء الخدمة",
    updated: "تم تحديث الخدمة",
    deleted: "تم حذف الخدمة",
    confirmDelete: "حذف هذه الخدمة؟",
    confirmDeleteDesc: "لا يمكن التراجع عن هذا الإجراء.",
    addContract: "إضافة عقد",
    editContract: "تعديل العقد",
    contractName: "اسم العقد",
    totalContract: "القيمة الإجمالية للعقد",
    paid: "مدفوع",
    remaining: "المتبقي",
    paymentProgress: "تقدم الدفع",
    paymentAmount: "مبلغ الدفع",
    recordPayment: "تسجيل دفعة",
    paymentRecorded: "تم تسجيل الدفعة",
    contractCreated: "تم إنشاء العقد",
    contractUpdated: "تم تحديث العقد",
    contractDeleted: "تم حذف العقد",
    confirmDeleteContract: "حذف هذا العقد؟",
    confirmDeleteContractDesc: "ستُفقد جميع سجلات الدفع.",
    confirmUpdate: "حفظ التغييرات؟",
    confirmUpdateDesc: "سيتم تحديث تفاصيل العقد.",
    noContractsYet: "لا توجد عقود بعد.",
    attachFile: "إرفاق ملف",
    clickToAttach: "انقر للإرفاق",
    confirmRemoveFile: "إزالة هذا الملف؟",
    confirmRemoveFileDesc: "سيتم حذف الملف نهائياً.",
    amount: "المبلغ",
    staffTracking: "تتبع الموظفين",
    trackStaff: "تتبع الموظفين",
    trackStaffDesc: "تسجيل حضور وانصراف الموظفين في الموقع.",
    assignStaff: "تعيين موظف",
    selectStaff: "اختر موظفاً",
    selectStaffPlaceholder: "ابحث عن موظف…",
    createStaff: "إنشاء موظف",
    createStaffButton: "إنشاء موظف",
    deleteStaff: "حذف الموظف",
    deleteStaffTitle: "حذف الموظف؟",
    deleteStaffDesc: "سيتم حذف هذا الموظف نهائياً.",
    staffCreatedSuccessfully: "تم إنشاء الموظف.",
    staffDeleted: "تم حذف الموظف.",
    checkIn: "تسجيل الحضور",
    checkOut: "تسجيل الانصراف",
    staffCheckedIn: "تم تسجيل حضور الموظف.",
    staffCheckedOut: "تم تسجيل انصراف الموظف.",
    activeSessions: "الجلسات النشطة",
    pastSessions: "الجلسات السابقة",
    noActiveSessions: "لا توجد جلسات نشطة.",
    noPastSessions: "لا توجد جلسات سابقة.",
    noStaffFound: "لم يُعثر على موظفين.",
    stepOptional: "اختياري",
    addProvider: "إضافة مزود",
    in: "في",
    status_ACTIVE: "نشط",
    status_PENDING: "معلق",
    status_EXPIRED: "منتهي",
    status_CANCELLED: "ملغى",
    stepProvider: "المزود",
    stepContract: "العقد",
    stepDocuments: "الوثائق",
    documentsFor: "وثائق {{contract}}",
    assignStaffDesc: "تعيين موظفين لـ {{serviceName}}"
  },
  serviceAnalytics: {
    title: "تحليلات الخدمات",
    subtitle: "الإنفاق على العقود وأداء المزودين",
    loading: "جاري تحميل الإحصاءات…",
    kpi: {
      totalContracts: "إجمالي العقود",
      activeContracts: "العقود النشطة",
      pendingContracts: "العقود المعلقة",
      totalPaid: "إجمالي المدفوع",
      totalRemaining: "إجمالي المتبقي"
    },
    charts: {
      paidVsRemaining: "المدفوع مقابل المتبقي",
      paid: "مدفوع",
      remaining: "متبقي",
      paymentProgress: "تقدم الدفعات"
    }
  },
  validation: {
    date: {
      endBeforeStart: "يجب أن يكون تاريخ النهاية بعد تاريخ البداية."
    }
  }
} as const

export default ar
