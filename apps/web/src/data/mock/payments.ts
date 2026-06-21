// ─── Fee Records ─────────────────────────────────────────────────────────────
export interface FeeRecord {
  id: string
  apartmentId: string
  unitCode: string
  ownerName: string
  building: string
  residenceId: string
  amount: number
  period: string
  dueDate: string
  paidAt: string | null
  paymentMethod: 'CASH' | 'TRANSFER' | 'CHECK' | null
  status: 'PAID' | 'PENDING' | 'OVERDUE'
  note?: string
}

export const mockFees: FeeRecord[] = [
  // ── A-101 محمد الفاسي — 6 months ──────────────────────────────────────────
  { id: 'fee-1a', apartmentId: 'apt-1', unitCode: 'A-101', ownerName: 'محمد الفاسي',          building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-01', dueDate: '2024-01-01', paidAt: '2024-01-03', paymentMethod: 'CASH',     status: 'PAID' },
  { id: 'fee-1b', apartmentId: 'apt-1', unitCode: 'A-101', ownerName: 'محمد الفاسي',          building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-02', dueDate: '2024-02-01', paidAt: '2024-02-02', paymentMethod: 'TRANSFER', status: 'PAID' },
  { id: 'fee-1c', apartmentId: 'apt-1', unitCode: 'A-101', ownerName: 'محمد الفاسي',          building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-03', dueDate: '2024-03-01', paidAt: '2024-03-01', paymentMethod: 'CASH',     status: 'PAID' },
  { id: 'fee-1d', apartmentId: 'apt-1', unitCode: 'A-101', ownerName: 'محمد الفاسي',          building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-04', dueDate: '2024-04-01', paidAt: '2024-04-04', paymentMethod: 'CHECK',    status: 'PAID' },
  { id: 'fee-1e', apartmentId: 'apt-1', unitCode: 'A-101', ownerName: 'محمد الفاسي',          building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-05', dueDate: '2024-05-01', paidAt: '2024-05-02', paymentMethod: 'CASH',     status: 'PAID' },
  { id: 'fee-1',  apartmentId: 'apt-1', unitCode: 'A-101', ownerName: 'محمد الفاسي',          building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-06', dueDate: '2024-06-01', paidAt: '2024-06-02', paymentMethod: 'CASH',     status: 'PAID' },

  // ── A-102 فاطمة الزهراء بنحدو — 4 months ──────────────────────────────────
  { id: 'fee-2c', apartmentId: 'apt-2', unitCode: 'A-102', ownerName: 'فاطمة الزهراء بنحدو', building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-03', dueDate: '2024-03-01', paidAt: '2024-03-03', paymentMethod: 'TRANSFER', status: 'PAID' },
  { id: 'fee-2d', apartmentId: 'apt-2', unitCode: 'A-102', ownerName: 'فاطمة الزهراء بنحدو', building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-04', dueDate: '2024-04-01', paidAt: '2024-04-01', paymentMethod: 'TRANSFER', status: 'PAID' },
  { id: 'fee-2e', apartmentId: 'apt-2', unitCode: 'A-102', ownerName: 'فاطمة الزهراء بنحدو', building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-05', dueDate: '2024-05-01', paidAt: '2024-05-30', paymentMethod: 'CASH',     status: 'PAID' },
  { id: 'fee-2',  apartmentId: 'apt-2', unitCode: 'A-102', ownerName: 'فاطمة الزهراء بنحدو', building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-06', dueDate: '2024-06-01', paidAt: '2024-05-30', paymentMethod: 'TRANSFER', status: 'PAID' },

  // ── A-103 يوسف العلمي — 4 months (deteriorating) ─────────────────────────
  { id: 'fee-3c', apartmentId: 'apt-3', unitCode: 'A-103', ownerName: 'يوسف العلمي',          building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-03', dueDate: '2024-03-01', paidAt: '2024-03-10', paymentMethod: 'CASH',     status: 'PAID' },
  { id: 'fee-3d', apartmentId: 'apt-3', unitCode: 'A-103', ownerName: 'يوسف العلمي',          building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-04', dueDate: '2024-04-01', paidAt: null,         paymentMethod: null,       status: 'OVERDUE' },
  { id: 'fee-3e', apartmentId: 'apt-3', unitCode: 'A-103', ownerName: 'يوسف العلمي',          building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-05', dueDate: '2024-05-01', paidAt: null,         paymentMethod: null,       status: 'OVERDUE' },
  { id: 'fee-3',  apartmentId: 'apt-3', unitCode: 'A-103', ownerName: 'يوسف العلمي',          building: 'Bât A',     residenceId: 'res-1', amount: 500, period: '2024-06', dueDate: '2024-05-01', paidAt: null,         paymentMethod: null,       status: 'OVERDUE' },

  // ── A-201 خديجة بنعلي — 3 months ─────────────────────────────────────────
  { id: 'fee-4d', apartmentId: 'apt-4', unitCode: 'A-201', ownerName: 'خديجة بنعلي',          building: 'Bât A',     residenceId: 'res-1', amount: 650, period: '2024-04', dueDate: '2024-04-01', paidAt: '2024-04-02', paymentMethod: 'CHECK',    status: 'PAID' },
  { id: 'fee-4e', apartmentId: 'apt-4', unitCode: 'A-201', ownerName: 'خديجة بنعلي',          building: 'Bât A',     residenceId: 'res-1', amount: 650, period: '2024-05', dueDate: '2024-05-01', paidAt: '2024-05-03', paymentMethod: 'CHECK',    status: 'PAID' },
  { id: 'fee-4',  apartmentId: 'apt-4', unitCode: 'A-201', ownerName: 'خديجة بنعلي',          building: 'Bât A',     residenceId: 'res-1', amount: 650, period: '2024-06', dueDate: '2024-06-01', paidAt: '2024-06-01', paymentMethod: 'CHECK',    status: 'PAID' },

  // ── A-202 حسن الشرقاوي — 2 months ────────────────────────────────────────
  { id: 'fee-5e', apartmentId: 'apt-5', unitCode: 'A-202', ownerName: 'حسن الشرقاوي',         building: 'Bât A',     residenceId: 'res-1', amount: 450, period: '2024-05', dueDate: '2024-05-01', paidAt: '2024-05-08', paymentMethod: 'CASH',     status: 'PAID' },
  { id: 'fee-5',  apartmentId: 'apt-5', unitCode: 'A-202', ownerName: 'حسن الشرقاوي',         building: 'Bât A',     residenceId: 'res-1', amount: 450, period: '2024-06', dueDate: '2024-06-01', paidAt: null,         paymentMethod: null,       status: 'PENDING' },

  // ── A-301 عائشة اللمراني — 2 months ──────────────────────────────────────
  { id: 'fee-6e', apartmentId: 'apt-6', unitCode: 'A-301', ownerName: 'عائشة اللمراني',       building: 'Bât A',     residenceId: 'res-1', amount: 550, period: '2024-05', dueDate: '2024-05-01', paidAt: null,         paymentMethod: null,       status: 'OVERDUE' },
  { id: 'fee-6',  apartmentId: 'apt-6', unitCode: 'A-301', ownerName: 'عائشة اللمراني',       building: 'Bât A',     residenceId: 'res-1', amount: 550, period: '2024-06', dueDate: '2024-05-01', paidAt: null,         paymentMethod: null,       status: 'OVERDUE' },

  // ── AT-101 رشيد بوعزة — 2 months ─────────────────────────────────────────
  { id: 'fee-7e', apartmentId: 'apt-7', unitCode: 'AT-101', ownerName: 'رشيد بوعزة',          building: 'Bât Atlas', residenceId: 'res-2', amount: 400, period: '2024-05', dueDate: '2024-05-01', paidAt: '2024-05-05', paymentMethod: 'CASH',     status: 'PAID' },
  { id: 'fee-7',  apartmentId: 'apt-7', unitCode: 'AT-101', ownerName: 'رشيد بوعزة',          building: 'Bât Atlas', residenceId: 'res-2', amount: 400, period: '2024-06', dueDate: '2024-06-01', paidAt: '2024-06-03', paymentMethod: 'CASH',     status: 'PAID' },

  // ── AT-102 نادية التازي — 1 month ────────────────────────────────────────
  { id: 'fee-8',  apartmentId: 'apt-8', unitCode: 'AT-102', ownerName: 'نادية التازي',         building: 'Bât Atlas', residenceId: 'res-2', amount: 600, period: '2024-06', dueDate: '2024-06-01', paidAt: null,         paymentMethod: null,       status: 'PENDING' },

  // ── AT-201 (vacant) — 1 month ─────────────────────────────────────────────
  { id: 'fee-9',  apartmentId: 'apt-9', unitCode: 'AT-201', ownerName: '—',                   building: 'Bât Atlas', residenceId: 'res-2', amount: 400, period: '2024-06', dueDate: '2024-06-01', paidAt: null,         paymentMethod: null,       status: 'PENDING' },
]

// ─── Expenses ─────────────────────────────────────────────────────────────────
export type ExpenseCategory = 'CLEANING' | 'MAINTENANCE' | 'SECURITY' | 'ADMIN' | 'UTILITIES' | 'REPAIR' | 'OTHER'

export interface ExpenseRecord {
  id: string
  description: string
  category: ExpenseCategory
  amount: number
  date: string
  paidTo: string
  linkedTo: string
  hasReceipt: boolean
  addedBy: string
}

export const mockExpenses: ExpenseRecord[] = [
  { id: 'exp-1', description: 'Nettoyage escaliers & parties communes', category: 'CLEANING',     amount: 800,  date: '2024-06-01', paidTo: 'Société Propre SARL',   linkedTo: 'Résidence Nour',   hasReceipt: true,  addedBy: 'Yahia' },
  { id: 'exp-2', description: 'Gardiennage — Juin 2024',               category: 'SECURITY',     amount: 2000, date: '2024-06-01', paidTo: 'M. Khalid Berrada',      linkedTo: 'Résidence Nour',   hasReceipt: false, addedBy: 'Yahia' },
  { id: 'exp-3', description: 'Remplacement ampoules couloir',          category: 'MAINTENANCE',  amount: 150,  date: '2024-06-05', paidTo: 'Magasin El Amal',        linkedTo: 'Bât A',            hasReceipt: true,  addedBy: 'Yahia' },
  { id: 'exp-4', description: 'Réparation pompe eau',                   category: 'REPAIR',       amount: 3500, date: '2024-06-10', paidTo: 'Plomberie Amine & Fils', linkedTo: 'Bât Atlas',        hasReceipt: true,  addedBy: 'Yahia' },
  { id: 'exp-5', description: 'Frais administratifs & fournitures',     category: 'ADMIN',        amount: 200,  date: '2024-06-12', paidTo: '—',                      linkedTo: 'Global',           hasReceipt: false, addedBy: 'Yahia' },
  { id: 'exp-6', description: 'Facture eau commune — Mai',              category: 'UTILITIES',    amount: 420,  date: '2024-05-28', paidTo: 'ONEE',                   linkedTo: 'Résidence Nour',   hasReceipt: true,  addedBy: 'Yahia' },
  { id: 'exp-7', description: 'Peinture cage escalier Bât A',           category: 'MAINTENANCE',  amount: 1200, date: '2024-05-15', paidTo: 'M. Hassan Peintre',      linkedTo: 'Bât A',            hasReceipt: false, addedBy: 'Yahia' },
]

// ─── Project Funds ────────────────────────────────────────────────────────────
export interface ProjectContribution {
  ownerId: string
  ownerName: string
  unitCode: string
  shareAmount: number
  status: 'PAID' | 'PENDING' | 'OVERDUE'
  paidAt: string | null
  paymentMethod: 'CASH' | 'TRANSFER' | 'CHECK' | null
}

export interface ProjectFund {
  id: string
  name: string
  description: string
  targetAmount: number
  collectedAmount: number
  linkedMeeting?: string
  splitMethod: 'EQUAL' | 'PROPORTIONAL'
  status: 'COLLECTING' | 'FUNDED' | 'IN_PROGRESS' | 'DONE'
  dueDate?: string
  contributions: ProjectContribution[]
}

export const mockProjects: ProjectFund[] = [
  {
    id: 'proj-1',
    name: 'Rénovation ascenseur',
    description: 'Remplacement complet de la cabine et du mécanisme de l\'ascenseur — Bâtiment A',
    targetAmount: 48000,
    collectedAmount: 32000,
    linkedMeeting: 'Réunion 14 Mai 2024',
    splitMethod: 'EQUAL',
    status: 'COLLECTING',
    dueDate: '2024-06-30',
    contributions: [
      { ownerId: 'own-1', ownerName: 'محمد الفاسي',          unitCode: 'A-101', shareAmount: 8000, status: 'PAID',    paidAt: '2024-06-05', paymentMethod: 'TRANSFER' },
      { ownerId: 'own-2', ownerName: 'فاطمة الزهراء بنحدو', unitCode: 'A-102', shareAmount: 8000, status: 'PAID',    paidAt: '2024-06-03', paymentMethod: 'CASH' },
      { ownerId: 'own-3', ownerName: 'يوسف العلمي',          unitCode: 'A-103', shareAmount: 8000, status: 'OVERDUE', paidAt: null,         paymentMethod: null },
      { ownerId: 'own-4', ownerName: 'خديجة بنعلي',          unitCode: 'A-201', shareAmount: 8000, status: 'PAID',    paidAt: '2024-06-08', paymentMethod: 'CHECK' },
      { ownerId: 'own-6', ownerName: 'حسن الشرقاوي',         unitCode: 'A-202', shareAmount: 8000, status: 'PENDING', paidAt: null,         paymentMethod: null },
      { ownerId: 'own-7', ownerName: 'عائشة اللمراني',       unitCode: 'A-301', shareAmount: 8000, status: 'PAID',    paidAt: '2024-06-10', paymentMethod: 'CASH' },
    ],
  },
  {
    id: 'proj-2',
    name: 'Peinture façade',
    description: 'Ravalement et peinture de la façade extérieure — Bâtiment Atlas',
    targetAmount: 24000,
    collectedAmount: 8000,
    linkedMeeting: 'Réunion 02 Juin 2024',
    splitMethod: 'EQUAL',
    status: 'COLLECTING',
    dueDate: '2024-07-15',
    contributions: [
      { ownerId: 'own-8', ownerName: 'رشيد بوعزة',  unitCode: 'AT-101', shareAmount: 8000, status: 'PAID',    paidAt: '2024-06-01', paymentMethod: 'CASH' },
      { ownerId: 'own-9', ownerName: 'نادية التازي', unitCode: 'AT-102', shareAmount: 8000, status: 'PENDING', paidAt: null,         paymentMethod: null },
      { ownerId: 'own-3', ownerName: '—',            unitCode: 'AT-201', shareAmount: 8000, status: 'PENDING', paidAt: null,         paymentMethod: null },
    ],
  },
  {
    id: 'proj-3',
    name: 'Installation caméras sécurité',
    description: 'Mise en place d\'un système de vidéosurveillance — Entrées et parkings',
    targetAmount: 18000,
    collectedAmount: 6000,
    splitMethod: 'EQUAL',
    status: 'COLLECTING',
    dueDate: '2024-07-01',
    contributions: [
      { ownerId: 'own-1', ownerName: 'محمد الفاسي',          unitCode: 'A-101',  shareAmount: 2000, status: 'PAID',    paidAt: '2024-06-06', paymentMethod: 'CASH' },
      { ownerId: 'own-2', ownerName: 'فاطمة الزهراء بنحدو', unitCode: 'A-102',  shareAmount: 2000, status: 'PENDING', paidAt: null,         paymentMethod: null },
      { ownerId: 'own-3', ownerName: 'يوسف العلمي',          unitCode: 'A-103',  shareAmount: 2000, status: 'OVERDUE', paidAt: null,         paymentMethod: null },
      { ownerId: 'own-4', ownerName: 'خديجة بنعلي',          unitCode: 'A-201',  shareAmount: 2000, status: 'PAID',    paidAt: '2024-06-04', paymentMethod: 'TRANSFER' },
      { ownerId: 'own-6', ownerName: 'حسن الشرقاوي',         unitCode: 'A-202',  shareAmount: 2000, status: 'PENDING', paidAt: null,         paymentMethod: null },
      { ownerId: 'own-7', ownerName: 'عائشة اللمراني',       unitCode: 'A-301',  shareAmount: 2000, status: 'OVERDUE', paidAt: null,         paymentMethod: null },
      { ownerId: 'own-8', ownerName: 'رشيد بوعزة',           unitCode: 'AT-101', shareAmount: 2000, status: 'PAID',    paidAt: '2024-06-02', paymentMethod: 'CASH' },
      { ownerId: 'own-9', ownerName: 'نادية التازي',          unitCode: 'AT-102', shareAmount: 2000, status: 'PENDING', paidAt: null,        paymentMethod: null },
      { ownerId: 'own-3', ownerName: '—',                     unitCode: 'AT-201', shareAmount: 2000, status: 'PENDING', paidAt: null,        paymentMethod: null },
    ],
  },
]

// ─── Summary ──────────────────────────────────────────────────────────────────
export const paymentSummary = {
  syndicBalance: 38200,
  balanceTrend: +4.2,
  outstandingAmount: 3100,
  overdueOwners: 7,
  activeProjects: 3,
  totalExpensesThisMonth: 7070,
}

// ─── Legacy compatibility (used by Dashboard + PaymentsDash) ─────────────────
export const mockPayments = mockFees.map(f => ({
  id: f.id, apartmentNumber: f.unitCode, ownerName: f.ownerName,
  amount: f.amount, status: f.status, type: 'CHARGE',
  dueDate: f.dueDate, paidAt: f.paidAt, residenceId: f.residenceId,
}))

export const mockPaymentStats = {
  totalCollected: mockFees.filter(f => f.status === 'PAID').reduce((s, f) => s + f.amount, 0),
  totalPending:   mockFees.filter(f => f.status === 'PENDING').reduce((s, f) => s + f.amount, 0),
  totalOverdue:   mockFees.filter(f => f.status === 'OVERDUE').reduce((s, f) => s + f.amount, 0),
  collectionRate: Math.round((mockFees.filter(f => f.status === 'PAID').length / mockFees.length) * 100),
  monthlyTrend: [
    { month: 'Jan', collected: 28000, pending: 4000 },
    { month: 'Fév', collected: 31000, pending: 3500 },
    { month: 'Mar', collected: 29500, pending: 5000 },
    { month: 'Avr', collected: 33000, pending: 2800 },
    { month: 'Mai', collected: 30000, pending: 6200 },
    { month: 'Jun', collected: 32450, pending: 8200 },
  ],
}
