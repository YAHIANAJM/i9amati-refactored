# Frontend Implementation: Feed Management & UI

This document details the frontend implementation (React/Vite) changes associated with the Feed, including API integrations, state management, and infinite scrolling.

## 1. Infinite Scrolling Integration

To handle potentially large feeds without overwhelming network or DOM resources, infinite scrolling was implemented.

* **`useInfiniteQuery`:** Replaced standard queries with React Query's `useInfiniteQuery`. This seamlessly manages cursor pages, extracting the `nextCursor` from the backend response and feeding it into the subsequent `fetchNextPage` call.
* **`IntersectionObserver`:** Integrated a custom hook or component utilizing the native `IntersectionObserver` API. When the user scrolls near the bottom of the feed list, the intersection event triggers `fetchNextPage()`, appending new posts dynamically.
* **Cursor over Timestamp Validation:** The UI relies on the `id` string cursor rather than simple offset numbers, drastically reducing edge cases where posts shift as new items are added by other users.

## 2. API Error Interception & Structure

* **Full Error Objects (`apps/web/src/lib/api.ts`):** 
  The base API client was refactored. Instead of throwing simple string messages or stripped-down errors, exceptions thrown by the API layer now retain the entire error object.
  * This allows the UI layer to access the specific `code` (e.g., `ERROR_FORBIDDEN`) and standard HTTP status, which is strictly required for the i18n translation mapping.
* **ESM Pre-bundling Fix:** Forced Vite to pre-bundle `@i9amati/shared` as ESM in `vite.config.ts`. This resolved module resolution errors when importing the shared `feed-ability.ts` CASL logic directly into the React context.

## 3. State Management & Query Invalidation

* **Syndic Membership Auto-resolution:** The UI gracefully handles loading states when a Syndic accesses a newly created group. If a membership error briefly appears, the backend resolves it natively, and the frontend automatically invalidates the `feed-groups` query to reflect the updated member state seamlessly.
* **Mutation Side Effects:** Modifying group members, adding posts, or toggling likes aggressively invalidate their specific React Query caches (`queryClient.invalidateQueries`), ensuring the UI remains perfectly synchronized with the PostgreSQL database.

## 4. UI Layout Refinements

* **Syndic Dashboard & Sidebar:** 
  The base layout was expanded with `Association.tsx`, `Residences.tsx`, and `Feed.tsx`. 
* **Media Rendering:** Feed posts are now capable of rendering images and standard `<video>` tags conditionally based on the `mediaType` returned from the API, utilizing the pre-signed/public MinIO `mediaUrl`.
