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
      NOT_FOUND: "تحقق من البيانات وحاول مرة أخرى",
      UNAUTHORIZED: "يرجى تسجيل الدخول أولاً",
      FORBIDDEN: "ليس لديك صلاحية لهذا الإجراء",
      CONFLICT: "تعارض في البيانات",
      VALIDATION_ERROR: "بيانات غير صالحة",
      BAD_REQUEST: "طلب غير صالح",
      INTERNAL_ERROR: "حدث خطأ غير متوقع"
    }
  }
} as const

export default ar
