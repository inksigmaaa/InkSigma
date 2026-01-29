// Role-Based Access Control (RBAC) Configuration

export const PERMISSIONS = {
  admin: {
    // Article Management
    viewAllArticles: true,
    viewOwnArticles: true,
    createArticle: true,
    editOwnArticle: true,
    editAnyArticle: true,
    deleteOwnArticle: true,
    deleteAnyArticle: true,

    // Publishing
    publishArticle: true,
    unpublishArticle: true,
    scheduleArticle: true,

    // Review System
    viewReviewQueue: true,
    approveReview: true,
    rejectReview: true,

    // Member Management
    viewMembers: true,
    inviteMembers: true,
    removeMembers: true,
    changeAnyRole: true,

    // Navigation Access
    canAccessAllArticles: true,
    canAccessScheduled: true,
    canAccessReviewQueue: true,
    canAccessDrafts: true,
    canAccessPublished: true,
    canAccessMembers: true,
    canAccessSettings: true,
    canAccessDomain: true,
  },

  editor: {
    // Article Management
    viewAllArticles: true,
    viewOwnArticles: true,
    createArticle: true,
    editOwnArticle: true,
    editAnyArticle: true,
    deleteOwnArticle: true,
    deleteAnyArticle: false, // KEY DIFFERENCE

    // Publishing
    publishArticle: true,
    unpublishArticle: true,
    scheduleArticle: true,

    // Review System
    viewReviewQueue: true,
    approveReview: true,
    rejectReview: true,

    // Member Management
    viewMembers: true,
    inviteMembers: true,
    removeMembers: true,
    changeAnyRole: false, // KEY DIFFERENCE: Can't change admin

    // Navigation Access
    canAccessAllArticles: true,
    canAccessScheduled: true,
    canAccessReviewQueue: true,
    canAccessDrafts: true,
    canAccessPublished: true,
    canAccessMembers: true,
    canAccessSettings: false,
    canAccessDomain: false,
  },

  author: {
    // Article Management
    viewAllArticles: false, // KEY DIFFERENCE
    viewOwnArticles: true,
    createArticle: true,
    editOwnArticle: true,
    editAnyArticle: false,
    deleteOwnArticle: true,
    deleteAnyArticle: false,

    // Publishing
    publishArticle: false, // KEY DIFFERENCE: Submit to review only
    unpublishArticle: false,
    scheduleArticle: false,

    // Review System
    viewReviewQueue: false, // KEY DIFFERENCE
    approveReview: false,
    rejectReview: false,

    // Member Management
    viewMembers: false,
    inviteMembers: false,
    removeMembers: false,
    changeAnyRole: false,

    // Navigation Access
    canAccessAllArticles: false, // KEY DIFFERENCE
    canAccessScheduled: false,
    canAccessReviewQueue: true, // Authors can access the unified /review page
    canAccessDrafts: true,
    canAccessPublished: true, // Author can view their published articles
    canAccessMembers: true, // User comment: "the author also view the members"
    canAccessSettings: false,
    canAccessDomain: false,
  },
};

export const hasPermission = (role, permission) => {
  if (!role || !PERMISSIONS[role]) return false;
  return !!PERMISSIONS[role][permission];
};
