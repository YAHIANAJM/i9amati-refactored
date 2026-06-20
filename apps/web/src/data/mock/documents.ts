export interface MockDocument {
  id: string
  name: string
  type: 'PDF' | 'DOCX' | 'XLSX' | 'IMG'
  size: number
  uploadedAt: string
  category: 'residence' | 'building' | 'apartment' | 'owner' | 'law'
  linkedId: string
  description?: string
}

export const mockDocuments: MockDocument[] = [
  // ── RESIDENCES ──────────────────────────────────────────────────────────────
  { id: 'd-r1-1', name: 'General Residence Rules 2023',      type: 'PDF',  size: 2457600, uploadedAt: '2023-01-20', category: 'residence', linkedId: 'res-1', description: 'Internal regulations for إقامة النور' },
  { id: 'd-r1-2', name: 'AGM Minutes – May 2024',            type: 'PDF',  size: 512000,  uploadedAt: '2024-05-25', category: 'residence', linkedId: 'res-1', description: 'Annual general meeting decisions' },
  { id: 'd-r2-1', name: 'Building Rules & Regulations',      type: 'PDF',  size: 1024000, uploadedAt: '2023-03-15', category: 'residence', linkedId: 'res-2' },
  { id: 'd-r2-2', name: 'Emergency Contact List 2024',       type: 'DOCX', size: 98304,   uploadedAt: '2024-01-10', category: 'residence', linkedId: 'res-2' },
  { id: 'd-r3-1', name: 'Marina Residence Foundation Charter', type: 'PDF', size: 3145728, uploadedAt: '2022-09-15', category: 'residence', linkedId: 'res-3', description: 'Foundation document — Signed 2022' },
  { id: 'd-r3-2', name: 'Maintenance Schedule 2024',         type: 'XLSX', size: 245760,  uploadedAt: '2024-02-01', category: 'residence', linkedId: 'res-3' },

  // ── BUILDINGS ────────────────────────────────────────────────────────────────
  { id: 'd-b1-1', name: 'Building A – Annual Structural Audit', type: 'PDF',  size: 3670016, uploadedAt: '2024-03-10', category: 'building', linkedId: 'bld-1' },
  { id: 'd-b1-2', name: 'Elevator Maintenance Contract',        type: 'PDF',  size: 1048576, uploadedAt: '2023-06-01', category: 'building', linkedId: 'bld-1' },
  { id: 'd-b2-1', name: 'Building B – Fire Safety Compliance',  type: 'PDF',  size: 819200,  uploadedAt: '2024-01-15', category: 'building', linkedId: 'bld-2' },
  { id: 'd-b2-2', name: 'Water System Inspection Report',       type: 'DOCX', size: 204800,  uploadedAt: '2023-11-20', category: 'building', linkedId: 'bld-2' },
  { id: 'd-b3-1', name: 'Atlas Building Insurance Policy 2024', type: 'PDF',  size: 2097152, uploadedAt: '2024-01-01', category: 'building', linkedId: 'bld-3' },
  { id: 'd-b3-2', name: 'Common Areas Renovation Estimate',     type: 'XLSX', size: 358400,  uploadedAt: '2024-04-20', category: 'building', linkedId: 'bld-3' },
  { id: 'd-b4-1', name: 'Ocean Tower – Structural Report',      type: 'PDF',  size: 4194304, uploadedAt: '2023-10-05', category: 'building', linkedId: 'bld-4' },
  { id: 'd-b4-2', name: 'Parking Management Regulations',       type: 'PDF',  size: 512000,  uploadedAt: '2023-07-01', category: 'building', linkedId: 'bld-4' },
  { id: 'd-b5-1', name: 'Beach Tower – Inspection Certificate', type: 'PDF',  size: 1572864, uploadedAt: '2023-10-05', category: 'building', linkedId: 'bld-5' },
  { id: 'd-b5-2', name: 'Pool Maintenance Agreement',           type: 'PDF',  size: 716800,  uploadedAt: '2024-03-15', category: 'building', linkedId: 'bld-5' },

  // ── APARTMENTS (شهادة الملكية) ────────────────────────────────────────────
  { id: 'd-a1-1', name: 'Ownership Certificate – A-101',     type: 'PDF', size: 1572864, uploadedAt: '2023-02-15', category: 'apartment', linkedId: 'apt-1', description: 'شهادة الملكية · رقم 38/163501' },
  { id: 'd-a1-2', name: 'Floor Plan – A-101',                type: 'IMG', size: 2097152, uploadedAt: '2023-02-15', category: 'apartment', linkedId: 'apt-1' },
  { id: 'd-a2-1', name: 'Ownership Certificate – A-102',     type: 'PDF', size: 1572864, uploadedAt: '2023-02-20', category: 'apartment', linkedId: 'apt-2', description: 'شهادة الملكية · رقم 38/163502' },
  { id: 'd-a3-1', name: 'Ownership Certificate – A-103',     type: 'PDF', size: 1572864, uploadedAt: '2023-02-25', category: 'apartment', linkedId: 'apt-3', description: 'شهادة الملكية · رقم 38/163503' },
  { id: 'd-a4-1', name: 'Ownership Certificate – A-201',     type: 'PDF', size: 1572864, uploadedAt: '2023-03-01', category: 'apartment', linkedId: 'apt-4', description: 'شهادة الملكية · رقم 38/163504' },
  { id: 'd-a4-2', name: 'Co-Ownership Agreement – A-201',    type: 'DOCX',size: 512000,  uploadedAt: '2023-03-05', category: 'apartment', linkedId: 'apt-4', description: 'Joint ownership · بنعلي & الطاهري' },
  { id: 'd-a5-1', name: 'Ownership Certificate – A-202',     type: 'PDF', size: 1572864, uploadedAt: '2023-03-10', category: 'apartment', linkedId: 'apt-5', description: 'شهادة الملكية · رقم 38/163505' },
  { id: 'd-a6-1', name: 'Ownership Certificate – A-301',     type: 'PDF', size: 1572864, uploadedAt: '2023-03-15', category: 'apartment', linkedId: 'apt-6', description: 'شهادة الملكية · رقم 38/163506' },
  { id: 'd-a7-1', name: 'Ownership Certificate – AT-101',    type: 'PDF', size: 1572864, uploadedAt: '2023-04-15', category: 'apartment', linkedId: 'apt-7', description: 'شهادة الملكية · رقم 12/044201' },
  { id: 'd-a8-1', name: 'Ownership Certificate – AT-102',    type: 'PDF', size: 1572864, uploadedAt: '2023-04-20', category: 'apartment', linkedId: 'apt-8', description: 'شهادة الملكية (تجاري) · رقم 12/044202' },
  { id: 'd-a9-1', name: 'Ownership Certificate – AT-201',    type: 'PDF', size: 1572864, uploadedAt: '2023-04-25', category: 'apartment', linkedId: 'apt-9', description: 'شهادة الملكية · رقم 12/044203' },

  // ── OWNERS (payment receipts, statements) ────────────────────────────────────
  { id: 'd-o1-1', name: 'Payment Receipt Jan 2024',  type: 'PDF',  size: 204800, uploadedAt: '2024-01-05', category: 'owner', linkedId: 'own-1', description: 'محمد الفاسي · Unit A-101' },
  { id: 'd-o1-2', name: 'Annual Statement 2023',     type: 'XLSX', size: 98304,  uploadedAt: '2024-01-10', category: 'owner', linkedId: 'own-1' },
  { id: 'd-o2-1', name: 'Payment Receipt Jan 2024',  type: 'PDF',  size: 204800, uploadedAt: '2024-01-06', category: 'owner', linkedId: 'own-2', description: 'فاطمة الزهراء بنحدو · Unit A-102' },
  { id: 'd-o3-1', name: 'Payment Receipt Jan 2024',  type: 'PDF',  size: 204800, uploadedAt: '2024-01-07', category: 'owner', linkedId: 'own-3', description: 'يوسف العلمي · Unit A-103' },
  { id: 'd-o4-1', name: 'Payment Receipt Jan 2024',  type: 'PDF',  size: 204800, uploadedAt: '2024-01-08', category: 'owner', linkedId: 'own-4', description: 'خديجة بنعلي · Unit A-201' },
  { id: 'd-o5-1', name: 'Payment Receipt Jan 2024',  type: 'PDF',  size: 204800, uploadedAt: '2024-01-08', category: 'owner', linkedId: 'own-5', description: 'عمر الطاهري · Unit A-201' },
  { id: 'd-o6-1', name: 'Payment Receipt Jan 2024',  type: 'PDF',  size: 204800, uploadedAt: '2024-01-09', category: 'owner', linkedId: 'own-6', description: 'حسن الشرقاوي · Unit A-202' },
  { id: 'd-o7-1', name: 'Payment Receipt Jan 2024',  type: 'PDF',  size: 204800, uploadedAt: '2024-01-10', category: 'owner', linkedId: 'own-7', description: 'عائشة اللمراني · Unit A-301' },
  { id: 'd-o8-1', name: 'Payment Receipt Jan 2024',  type: 'PDF',  size: 204800, uploadedAt: '2024-01-11', category: 'owner', linkedId: 'own-8', description: 'رشيد بوعزة · Unit AT-101' },
  { id: 'd-o9-1', name: 'Payment Receipt Jan 2024',  type: 'PDF',  size: 204800, uploadedAt: '2024-01-12', category: 'owner', linkedId: 'own-9', description: 'نادية التازي · Unit AT-102' },

  // ── LAW (global) ─────────────────────────────────────────────────────────────
  { id: 'd-l-1', name: 'Loi 18-00 — Copropriété (Full Text)', type: 'PDF',  size: 5242880, uploadedAt: '2022-01-01', category: 'law', linkedId: 'global', description: 'Official Moroccan co-ownership law text' },
  { id: 'd-l-2', name: 'Loi 18-00 — Amendments 2016',         type: 'PDF',  size: 1048576, uploadedAt: '2022-01-01', category: 'law', linkedId: 'global' },
  { id: 'd-l-3', name: 'Syndic Obligations Reference Card',    type: 'PDF',  size: 204800,  uploadedAt: '2023-01-01', category: 'law', linkedId: 'global', description: 'Quick-reference duties checklist' },
  { id: 'd-l-4', name: "Court Decisions — Copropriété 2023",  type: 'DOCX', size: 819200,  uploadedAt: '2024-01-15', category: 'law', linkedId: 'global' },
  { id: 'd-l-5', name: "Décret d'Application 18-00",           type: 'PDF',  size: 1572864, uploadedAt: '2022-06-01', category: 'law', linkedId: 'global' },
]
