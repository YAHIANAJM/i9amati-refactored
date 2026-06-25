# Internationalization & Notifications System

This document explains the implementation of the global toast notification system and the associated internationalization (i18n) setup.

## 1. Internationalization (i18n)

The application utilizes `i18next` and `react-i18next` to provide a multi-language experience.

* **Translation Files (`apps/web/src/locales/*`):** Translation dictionaries are structured and maintained across three languages:
  * Arabic (`ar/translation.ts`)
  * English (`en/translation.ts`)
  * French (`fr/translation.ts`)
* **Initialization (`apps/web/src/lib/i18n.ts`):** 
  `i18next` is initialized globally, applying fallback languages and detecting the user's preferred browser language natively.

## 2. Global Toast Notification System

A highly animated, globally accessible toast notification system was built on top of Radix UI primitives.

* **Components (`apps/web/src/components/toast/*`):**
  * Built using a custom `useToast` hook for declarative invocation.
  * Incorporates Radix UI's accessible Toast primitives.
* **Notification Presets:** Standardized visual presets were defined for consistency:
  * `success.ts` (Green, confirmation icons)
  * `error.ts` (Red, warning icons)
  * `validation.ts`
  * `confirmation.ts`

## 3. Connecting i18n with API Errors

A core achievement in this branch is the seamless connection between backend error codes, the frontend API client, the Toast system, and i18n dictionaries.

1. **Error Objects:** The backend throws a specific error structure (e.g., `{ message: '...', code: 'ERROR_GROUP_NOT_FOUND' }`).
2. **Client Parsing:** The frontend API interceptor was refactored to catch and forward this entire `{ code }` object instead of just a generic string.
3. **Localized Toasts:** The global error toast handlers use the `useTranslation` hook (`t()`) to intelligently map the backend's `error.code` directly to a key in the `locales/*/translation.ts` files.
4. **Result:** Instead of displaying raw backend English error strings (or `[object Object]`), the user receives a beautifully styled toast displaying the error contextually in Arabic, French, or English based on their active settings. All feed mutations (create, update, delete on posts/groups/comments) now trigger these unified success/error feedback loops.
