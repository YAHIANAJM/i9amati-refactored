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
  },
  nav: {
    search: "Search in i9amati...",
    matchingPages: "Matching pages",
    noPageFound: "No page found",
    tryAnother: "Try another keyword",
    home: "Home",
    about: "About",
    services: "Services",
    profile: "Profile",
    logout: "Logout",
    lang: "Language",
    syndic: "Syndic",
    syndicMgmt: "Syndic Management"
  },
  login: {
    subtitle: "IQAMATI – The Human Story",
    email: "Email or Phone ID",
    password: "Password",
    forgot: "Forgot?",
    submit: "Log in",
    loading: "Signing in...",
    orWith: "or continue with",
    noAccount: "First time?",
    createAccount: "Create an account",
    savedAccounts: "Saved accounts",
    continueAs: "Continue as {{name}}",
    savedCount: "{{count}} saved accounts",
    savePrompt: "Save account?",
    notNow: "Not now",
    save: "Save",
    loginFailed: "Login failed",
    checkCredentials: "Check your email and password",
    savedConfirm: "Account saved",
    savedDetail: "{{email}} will be pre-filled",
    welcome: "Welcome back",
    loginSuccess: "Signed in successfully"
  },
  register: {
    subtitle: "Create your syndic space",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    submit: "Create account",
    loading: "Creating...",
    orWith: "or continue with",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    mismatch: "Passwords don't match",
    registerFailed: "Registration failed"
  },
  unionDash: {
    title: "Union Analytics",
    subtitle: "Building coverage · Delegates · Partner network",
    kpi: {
      activeDelegates: "Active Delegates",
      pendingInvites: "Pending Invites",
      buildingCoverage: "Building Coverage",
      partnerSyndics: "Partner Syndics",
      totalInSystem: "{{count}} total in system",
      awaitingResponse: "Awaiting response",
      allResponded: "All responded",
      buildingsCovered: "{{covered}} of {{total}} buildings",
      network: "{{count}}-syndic network",
      noPartners: "No partners yet"
    },
    charts: {
      delegatesPerBuilding: "Delegates per Building",
      active: "Active",
      pending: "Pending",
      delegateStatus: "Delegate Status",
      buildingCoverage: "Building Coverage",
      covered: "Covered",
      uncovered: "Uncovered"
    },
    coverage: {
      active: "Covered",
      pending: "Pending",
      uncovered: "Uncovered",
      noDelegate: "No delegate assigned"
    },
    errors: {
      buildings: "Failed to load buildings",
      delegates: "Failed to load delegates",
      partners: "Failed to load partners"
    },
    sections: {
      pendingInvites: "Pending Invitations",
      partners: "Partner Network",
      activeDelegates: "Active Delegates",
      buildingStatus: "Building Status"
    },
    urgency: {
      daysAgo: "{{count}}d ago"
    },
    empty: {
      noPending: "No pending invitations",
      noPartners: "No partner syndics linked yet",
      noDelegates: "No active delegates yet"
    }
  },
  meetingsDash: {
    title: "Meetings & Voting Analytics",
    subtitle: "Meeting and voting statistics",
    kpi: {
      total: "Total meetings",
      scheduled: "Scheduled",
      activeVotes: "Active votes",
      avgQuorum: "Avg. quorum",
      adoptionRate: "Adoption rate",
      convocations: "Convocations"
    },
    charts: {
      frequency: "Meetings per month (last 6 months)",
      statuses: "Statuses",
      rsvp: "RSVP Engagement",
      adoption: "Resolution adoption",
      meetings: "Meetings",
      accepted: "Accepted",
      declined: "Declined",
      pending: "Pending",
      adopted: "Adopted",
      rejected: "Rejected"
    },
    status: {
      scheduled: "Scheduled",
      inProgress: "In progress",
      completed: "Completed",
      cancelled: "Cancelled"
    },
    sections: {
      quorum: "Quorum analysis",
      resolutions: "Resolutions timeline",
      activeVotes: "Active votes"
    },
    quorum: {
      reached: "Reached",
      notReached: "Not reached"
    },
    noData: "No data",
    loading: "Loading..."
  },
  meetings: {
    title: "Meetings & Voting",
    newMeeting: "New Meeting",
    types: {
      GLOBAL: "General Assembly",
      EXCEPTIONAL: "Extraordinary AG",
      NORMAL: "Council Meeting"
    },
    status: {
      SCHEDULED: "Scheduled",
      IN_PROGRESS: "In progress",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled"
    },
    convocation: "Convocation",
    sendConvocation: "Send Convocation",
    attendees: "Attendees",
    agenda: "Agenda",
    vote: "Vote",
    addItem: "Add item",
    quorum: "Quorum",
    required: "required",
    present: "present",
    eligible: "eligible",
    adopted: "Adopted",
    rejected: "Rejected",
    open: "Open",
    closed: "Closed",
    start: "Start Meeting",
    end: "End Meeting",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete"
  },
  unionMembers: {
    title: "Union Members",
    tabs: {
      delegates: "Delegates",
      partners: "Partner Syndics"
    },
    delegates: {
      active: "Active Delegates",
      pending: "Pending Invitations",
      invite: "Invite Delegate",
      noActive: "No active delegates yet",
      noPending: "No pending invitations",
      building: "Building",
      since: "Since"
    },
    partners: {
      title: "Partner Syndics",
      noPartners: "No partner syndics linked yet",
      residence: "Residence",
      linkedSince: "Linked since",
      edit: "Edit",
      delete: "Delete",
      name: "Name",
      phone: "Phone",
      note: "Note (optional)",
      save: "Save changes",
      saving: "Saving..."
    },
    confirm: {
      deleteDelegate: "Delete this delegate invitation?",
      deletePartner: "Remove this partner syndic?",
      yes: "Yes, delete",
      cancel: "Cancel"
    }
  },
  home: {
    title: "i9amati",
    tagline: "Modern syndic management for Moroccan residences",
    getStarted: "Get started",
    learnMore: "Learn more",
    features: "Features",
    about: "About",
    contact: "Contact"
  },
  auth: {
    forgot: {
      title: "Reset your password",
      emailPlaceholder: "Enter your email address",
      sendBtn: "Send reset link",
      sending: "Sending…",
      successTitle: "Email sent",
      successDesc: "Check your inbox for the reset link.",
      errorTitle: "Error",
      errorDesc: "Failed to send reset email. Please try again.",
      remembered: "Remembered your password?",
      loginLink: "Back to login"
    },
    reset: {
      title: "Set a new password",
      passwordPlaceholder: "New password",
      confirmPlaceholder: "Confirm new password",
      resetBtn: "Reset password",
      processing: "Processing…",
      successTitle: "Password updated",
      successDesc: "Your password has been changed. You can now log in.",
      errorTitle: "Error",
      errorDesc: "Failed to reset password. Please try again.",
      mismatchTitle: "Passwords do not match",
      mismatchDesc: "Please make sure both passwords are the same.",
      missingToken: "Reset token missing. Please use the link from your email."
    }
  },
  common: {
    cancel: "Cancel",
    delete: "Delete"
  },
  services: {
    pageTitle: "Services & Contracts",
    pageSubtitle: "Manage providers, contracts and staff",
    loading: "Loading services…",
    loadError: "Failed to load services.",
    noServicesYet: "No services yet.",
    addFirstService: "Add your first service provider to get started.",
    createService: "Add Service",
    editService: "Edit Service",
    providerName: "Provider name",
    serviceType: "Service type",
    serviceTypePlaceholder: "Select a type…",
    description: "Description",
    email: "Email",
    phone: "Phone",
    firstName: "First name",
    lastName: "Last name",
    status: "Status",
    startDate: "Start date",
    endDate: "End date",
    save: "Save",
    saveWithFiles: "Save with files",
    skipAndSave: "Skip & Save",
    next: "Next",
    back: "Back",
    cancel: "Cancel",
    confirm: "Confirm",
    created: "Service created",
    updated: "Service updated",
    deleted: "Service deleted",
    confirmDelete: "Delete this service?",
    confirmDeleteDesc: "This action cannot be undone.",
    addContract: "Add Contract",
    editContract: "Edit Contract",
    contractName: "Contract name",
    totalContract: "Total contract amount",
    paid: "Paid",
    remaining: "Remaining",
    paymentProgress: "Payment progress",
    paymentAmount: "Payment amount",
    recordPayment: "Record payment",
    paymentRecorded: "Payment recorded",
    contractCreated: "Contract created",
    contractUpdated: "Contract updated",
    contractDeleted: "Contract deleted",
    confirmDeleteContract: "Delete this contract?",
    confirmDeleteContractDesc: "All payment records will be lost.",
    confirmUpdate: "Save changes?",
    confirmUpdateDesc: "The contract details will be updated.",
    noContractsYet: "No contracts yet.",
    attachFile: "Attach file",
    clickToAttach: "Click to attach",
    confirmRemoveFile: "Remove this file?",
    confirmRemoveFileDesc: "The file will be permanently deleted.",
    amount: "Amount",
    staffTracking: "Staff Tracking",
    trackStaff: "Track staff",
    trackStaffDesc: "Record check-in and check-out for on-site staff.",
    assignStaff: "Assign Staff",
    selectStaff: "Select staff",
    selectStaffPlaceholder: "Search staff…",
    createStaff: "Create staff member",
    createStaffButton: "Create staff",
    deleteStaff: "Delete staff member",
    deleteStaffTitle: "Delete staff member?",
    deleteStaffDesc: "This staff member will be permanently removed.",
    staffCreatedSuccessfully: "Staff member created.",
    staffDeleted: "Staff member deleted.",
    checkIn: "Check In",
    checkOut: "Check Out",
    staffCheckedIn: "Staff checked in.",
    staffCheckedOut: "Staff checked out.",
    activeSessions: "Active sessions",
    pastSessions: "Past sessions",
    noActiveSessions: "No active sessions.",
    noPastSessions: "No past sessions.",
    noStaffFound: "No staff found.",
    stepOptional: "Optional",
    addProvider: "Add provider",
    in: "in",
    status_ACTIVE: "Active",
    status_PENDING: "Pending",
    status_EXPIRED: "Expired",
    status_CANCELLED: "Cancelled",
    stepProvider: "Provider",
    stepContract: "Contract",
    stepDocuments: "Documents",
    documentsFor: "Documents for {{contract}}",
    assignStaffDesc: "Assign staff members to {{serviceName}}"
  },
  serviceAnalytics: {
    title: "Services Analytics",
    subtitle: "Contract spending and provider performance",
    loading: "Loading analytics…",
    kpi: {
      totalContracts: "Total Contracts",
      activeContracts: "Active Contracts",
      pendingContracts: "Pending Contracts",
      totalPaid: "Total Paid",
      totalRemaining: "Total Remaining"
    },
    charts: {
      paidVsRemaining: "Paid vs Remaining",
      paid: "Paid",
      remaining: "Remaining",
      paymentProgress: "Payment Progress"
    }
  },
  validation: {
    date: {
      endBeforeStart: "End date must be after start date."
    }
  }
} as const

export default en
