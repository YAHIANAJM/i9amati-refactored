# i9amati — Project Tracker

**Team:** Yahia · Ayman · Bader  
**Last updated:** June 2026

---

## 📄 Pages & Auth

| Section | Owner | Status | Progress |
|---------|-------|--------|----------|
| Home Page | Ayman | ✅ Done | 100% |
| Login / Registration | Ayman | ✅ Done | 100% |
| Chatbot | Ayman | ✅ Done | 100% |

---

## ⚙️ Management Sections

| # | Section | Owner | Status | Progress |
|---|---------|-------|--------|----------|
| 1 | Owners' Association | Yahia | ✅ Done | 100% |
| 2 | Payments | Yahia | ⬜ Not Started | 0% |
| 3 | Accounting | Yahia + Ayman | ⬜ Not Started | 0% |
| 4 | Meeting & Voting | Ayman | ⬜ Not Started | 0% |
| 5 | Documents | Yahia | 🔄 In Progress | 55% |
| 6 | Service Tracking | Bader | ✅ Done | 100% |
| 7 | Feed Management | Bader | ✅ Done | 100% |
| 8 | Alerts & Notifications | Bader | ⬜ Not Started | 0% |
| 9 | Union Members | Ayman | ⬜ Not Started | 0% |

---

## 📊 Analytics Dashboards

| # | Dashboard | Owner | Status | Progress |
|---|-----------|-------|--------|----------|
| — | Global Overview | Bader | ⬜ Not Started | 0% |
| 1 | Owners' Association Analytics | Yahia | ✅ Done | 100% |
| 2 | Payments Analytics | Yahia | ⬜ Not Started | 0% |
| 3 | Accounting Analytics | Yahia + Ayman | ⬜ Not Started | 0% |
| 4 | Meetings Analytics | Ayman | ⬜ Not Started | 0% |
| 5 | Feed Analytics | Bader | ✅ Done | 100% |
| 6 | Alerts Analytics | Bader | ⬜ Not Started | 0% |
| 7 | Services Analytics | Bader | ✅ Done | 100% |
| 8 | Documents Analytics | Yahia | ⬜ Not Started | 0% |
| 9 | Union Analytics | Ayman | ⬜ Not Started | 0% |

---

## 🏁 Totals

| Member | Total | Done | In Progress | Remaining |
|--------|-------|------|-------------|-----------|
| **Yahia** | **8** | 2 | 1 | 5 |
| **Ayman** | **8** | 3 | 0 | 5 |
| **Bader** | **7** | 4 | 0 | 3 |

---

## 📝 Notes
- Accounting + Accounting Analytics counted as 1 shared task for both Yahia and Ayman
- Documents at 55%: UI done (list, categories, filters, detail view, mock data) — file storage needs backend
- Build order: Payments → Accounting → Meeting & Voting → Documents → Service Tracking → Feed → Alerts → Union Members → Global Overview
- Service Tracking: full CASL permissions, CRUD for services + contracts, payment recording + direct paid-amount editing, contract file upload/download with presigned URLs (documents bucket is private), payment integrity DB constraints, i18n validation errors via shared Zod schemas
