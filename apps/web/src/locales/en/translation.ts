export const en = {
  errors: {
    title: {
      error: "Error",
      warning: "Warning",
      NOT_FOUND: "Not Found",
      UNAUTHORIZED: "Unauthorized",
      FORBIDDEN: "Forbidden",
      CONFLICT: "Conflict",
      VALIDATION_ERROR: "Validation Error"
    },
    codes: {
      ERROR_FORBIDDEN: "You do not have permission for this action",
      ERROR_GROUP_NOT_FOUND: "Group not found",
      ERROR_CANNOT_REMOVE_SYNDIC: "Cannot remove the syndic from the group",
      ERROR_NOT_MEMBER: "You are not a member of this group",
      ERROR_POST_NOT_FOUND: "Post not found",
      ERROR_COMMENT_NOT_FOUND: "Comment not found",
      ERROR_PARENT_COMMENT_NOT_FOUND: "Parent comment not found",
      NOT_FOUND: "Check the data and try again",
      UNAUTHORIZED: "Please log in first",
      FORBIDDEN: "You do not have permission for this action",
      CONFLICT: "Data conflict",
      VALIDATION_ERROR: "Invalid data",
      BAD_REQUEST: "Bad request",
      INTERNAL_ERROR: "An unexpected error occurred"
    }
  }
} as const

export default en
