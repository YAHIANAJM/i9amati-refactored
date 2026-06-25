# Backend Architecture: Feed Management & Groups

This document outlines the backend architecture, database changes, and API structures implemented for the feed management and group functionalities.

## 1. Database Migrations & Structure

New database structures were introduced to support a rich feed experience, including media and likes.

* **Migrations:**
  * `004_feed_post_likes.ts`: Introduced the `feed_post_likes` table to track user likes on specific feed posts.
  * `005_feed_post_media.ts`: Added columns for media attachments (`media_url`, `media_type`) to the existing `feed_posts` table to allow rich media uploads (images and videos).
* **Tenant Isolation:** The database utilizes a multi-tenant structure (`TenantDB`). Queries across feed posts, groups, and members are securely scoped within the specific tenant context using Kysely SQL query builder.

## 2. File Upload & MinIO Storage

A dedicated file upload service was created to handle media associated with feed posts securely and efficiently.

* **MinIO Integration:** Storage is managed via MinIO (S3-compatible). The connection is instantiated in `apps/api/src/lib/storage.ts` using the `minio` client library.
* **Upload Configuration (`packages/shared/src/upload-config.ts`):** Centralizes validation rules for file uploads, including allowed MIME types (e.g., `image/jpeg`, `image/png`, `video/mp4`) and maximum file sizes, sharing this configuration between the client and server.
* **Upload Routes (`apps/api/src/routes/upload.ts`):** An express route that uses `multer` middleware to intercept, validate, and stream files directly to the MinIO bucket, returning the generated `objectUrl` for storage in the `feed_posts` table.

## 3. Feed & Group API Routes (`apps/api/src/routes/feed.ts`)

The Feed API exposes comprehensive endpoints to handle Groups, Members, Posts, Comments, and Likes.

### Group Management
* **`GET /feed/groups`:** Returns all groups accessible to the user. Includes an optimized single-query SQL join to compute the total `memberCount` and identify the current user's membership role.
* **`POST /feed/groups`:** Creates a new group. It guarantees that the `SYNDIC` role is always added as an `ADMIN` during creation.
* **`DELETE /feed/groups/:groupId`:** Implements cascading deletion manually, first dropping associated `feed_post_likes`, `feed_comments`, `feed_posts`, and `_profile_groups` to maintain relational integrity before deleting the group itself.

### Post & Comment Feeds
* **Cursor-Based Pagination:** `GET /feed/groups/:groupId/posts` handles infinite scrolling via cursor-based pagination (using the `created_at` timestamp). This replaces offset-based pagination to improve performance and prevent layout shifts when new posts are added in real-time.
* **Rich Data Hydration:** Post payloads are hydrated with related data in parallel (using `Promise.all`), including:
  * Like counts and comments counts.
  * A boolean `likedByMe` indicating if the requesting user liked the post.
  * Author details (name, avatar) joined from the `public.profiles` and `public.user` tables.
* **Idempotent Actions:** `POST /posts/:postId/like` safely toggles likes. If the like already exists, it returns `200 OK` rather than throwing an error, simplifying frontend synchronization.

## 4. Error Handling & Standardization

* **Specific Error Codes:** API errors now return structured, specific error codes (e.g., `ERROR_GROUP_NOT_FOUND`, `ERROR_FORBIDDEN`) alongside HTTP status codes via the custom `AppError` class. This allows the frontend to map these exact codes to localized messages.
* **204 No Content Fix:** Removed arbitrary `res.json()` calls on `DELETE` operations returning a 204 status, fixing an issue where Express would attempt to send a body on a No Content response.
