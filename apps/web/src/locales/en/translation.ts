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
      ERROR_ANALYTICS_FORBIDDEN: "Feed analytics are only accessible to the syndic",
      NOT_FOUND: "Check the data and try again",
      UNAUTHORIZED: "Please log in first",
      FORBIDDEN: "You do not have permission for this action",
      CONFLICT: "Data conflict",
      VALIDATION_ERROR: "Invalid data",
      BAD_REQUEST: "Bad request",
      INTERNAL_ERROR: "An unexpected error occurred"
    }
  },
  success: {
    groupCreated: "Group created",
    groupUpdated: "Group updated",
    groupDeleted: "Group deleted",
    memberAdded: "Member added",
    memberRemoved: "Member removed",
    postCreated: "Post published",
    postUpdated: "Post updated",
    postDeleted: "Post deleted",
    commentAdded: "Comment added",
    commentDeleted: "Comment deleted",
    generic: "Action successful"
  },
  feed: {
    pageTitle: "Community Feed",
    pageSubtitle: "Connect with your community",
    groupName: "Group name…",
    cancel: "Cancel",
    save: "Save",
    members: "members",
    loading: "Loading…",
    failedLoadMembers: "Failed to load members.",
    noMembersYet: "No members yet.",
    unknown: "Unknown",
    addMember: "Add member",
    available: "available",
    allMembersAdded: "All members already added.",
    loadingComments: "Loading comments…",
    noCommentsYet: "No comments yet.",
    writeComment: "Write a comment…",
    post: "Post",
    photoVideo: "Photo / Video",
    whatAreYouThinking: "What are you thinking of?",
    postingTo: "Posting to",
    noGroupsYet: "No groups yet.",
    createGroup: "Create a group to start communicating with your community.",
    createGroupBtn: "Create Group",
    rename: "Rename",
    delete: "Delete",
    manageMembers: "Manage Members",
    noPostsYet: "No posts yet.",
    shareSomething: "Share something with this group!",
    like: "Like",
    comment: "Comment",
    share: "Share",
    viewAllComments: "View all {{count}} comments",
    hideComments: "Hide comments",
    editPost: "Edit post",
    deletePost: "Delete post",
    newGroup: "New Group",
    renameGroup: "Rename Group",
    selectMedia: "Select an image or video",
    removeMedia: "Remove media",
    unsupportedFile: "File type not supported or too large",
    publishing: "Publishing...",
    groupsLoadError: "Failed to load groups.",
    postsLoadError: "Failed to load posts.",
    syndicBadge: "Syndic",
    memberBadge: "Member",
    groups: "Groups",
    selectGroup: "Select a group",
    selectGroupDesc: "Choose a group from the sidebar to view and post.",
    beFirstToPost: "Be the first to post in this group!"
  },
  feedAnalytics: {
    title: "Feed Analytics",
    subtitle: "Engagement and community activity",
    loading: "Loading analytics…",
    kpi: {
      publications: "Publications",
      totalLikes: "Total Likes",
      comments: "Comments",
      members: "Members",
      avgEngagement: "Avg. Engagement"
    },
    charts: {
      activityByGroup: "Activity by group",
      activityOverTime: "Activity over time (30 days)",
      posts: "Posts",
      likes: "Likes",
      comments: "Comments",
      publications: "Publications",
      postsDistribution: "Posts distribution"
    },
    topPosts: {
      title: "Top publications",
      none: "No publications yet."
    },
    topMembers: {
      title: "Most active members",
      none: "No activity yet."
    },
    error: {
      title: "Loading error",
      desc: "Could not load data. Please try again later.",
      forbiddenTitle: "Access restricted",
      forbiddenDesc: "Feed analytics are only accessible to the syndic."
    }
  }
} as const

export default en
