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
  }
} as const

export default ar
