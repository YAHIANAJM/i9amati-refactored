# Access Control & Permissions: Feed Management

This document details the access control mechanisms implemented to secure the feed management, group operations, and user interactions within the application.

## 1. CASL Integration

Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) are managed using the **CASL** library (`@casl/ability`).

* **Shared Abilities (`packages/shared/src/feed-ability.ts`):** To ensure security logic remains perfectly synchronized between the backend (enforcement) and the frontend (UI conditional rendering), the CASL ability builder logic is exported from the shared workspace package.
* **Granular Subject Tagging:** The system uses `ForcedSubject` to tag resources (e.g., `TaggedFeedPost`, `TaggedFeedComment`, `TaggedGroupMember`) alongside required attributes (like `groupId`, `authorId`).

## 2. Permission Matrices by Profile Role

Permissions are granted cumulatively based on the user's overarching `ProfileRole` and their specific relationship to the group (`MembershipInfo`).

### SYNDIC (Global Administrator)
* **Abilities:** The Syndic has unrestricted (`manage`, `all`) access across the tenant.
* **Membership Enforcement:** A specialized helper (`ensureSyndicMembership`) ensures that `SYNDIC` profiles always have an underlying `_profile_groups` row for every group. This is crucial because `feed_posts.author_id` enforces a foreign key constraint to `_profile_groups.id`, guaranteeing even administrators leave an accurate relational footprint when posting.

### RIGHT_HAND (Moderator)
* **Abilities:** Granted broad content moderation powers (`manage`, `FeedPost`, `FeedComment`, `FeedPostLike`).
* **Limitations:** They cannot manage Group configurations or overarching group settings.

### STAFF (Read-Only)
* **Abilities:** Outside of their explicit residences, STAFF roles have strict read-only access (`read`) to posts, comments, and members within the groups they are enrolled in.

### OWNER / TENANT (Standard Members)
* **Abilities:** Base members can `read` all content within their enrolled groups.
* **Creation:** They can `create` posts, comments, and likes.
* **Ownership Constraint:** They can only `update` or `delete` content that they own (verified by matching `authorId` or `authorProfileId` against their own profile).

### Group ADMIN
* **Abilities:** Profiles elevated to `ADMIN` within a specific `_profile_groups` record gain the ability to `update` and `delete` *any* post or comment within that specific group. They can also manage (`create`, `delete`) group members.

## 3. Route Guard Enhancements

Specific hardcoded route guards have been layered on top of CASL for edge-case business logic:

* **Syndic Removal Prevention:** In `DELETE /groups/:groupId/members/:profileId`, an explicit check is performed against the `public.profiles` table to prevent the removal of a `SYNDIC`. If attempted, the API throws `ERROR_CANNOT_REMOVE_SYNDIC`.
