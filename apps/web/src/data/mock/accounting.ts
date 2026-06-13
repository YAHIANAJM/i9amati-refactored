export const mockDailyEntries = [
  { id: 'd1', date: '2024-06-10', label: 'Charges ascenseur - Otis', type: 'DEBIT',  amount: 1200, category: 'Entretien' },
  { id: 'd2', date: '2024-06-09', label: 'Cotisation Appt A101',      type: 'CREDIT', amount: 450,  category: 'Cotisations' },
  { id: 'd3', date: '2024-06-09', label: 'Cotisation Appt A102',      type: 'CREDIT', amount: 380,  category: 'Cotisations' },
  { id: 'd4', date: '2024-06-08', label: 'Facture nettoyage juin',    type: 'DEBIT',  amount: 800,  category: 'Services' },
  { id: 'd5', date: '2024-06-07', label: 'Cotisation Appt C301',      type: 'CREDIT', amount: 650,  category: 'Cotisations' },
  { id: 'd6', date: '2024-06-06', label: 'Réparation toiture',        type: 'DEBIT',  amount: 3500, category: 'Réparations' },
  { id: 'd7', date: '2024-06-05', label: 'Assurance immeuble',        type: 'DEBIT',  amount: 2100, category: 'Assurance' },
  { id: 'd8', date: '2024-06-04', label: 'Cotisation Appt B203',      type: 'CREDIT', amount: 470,  category: 'Cotisations' },
]

export const mockAccountingStats = {
  totalCredits: 18450,
  totalDebits: 12300,
  balance: 6150,
  pendingContributions: 3,
}

export const mockContributions = [
  { id: 'c1', type: 'Normale',    label: 'Charges communes juin 2024', amount: 450,  status: 'PAID' },
  { id: 'c2', type: 'Exception',  label: 'Réfection toiture',          amount: 3500, status: 'PENDING' },
  { id: 'c3', type: 'Mosaba9a',   label: 'Rénovation hall entrée',     amount: 1800, status: 'PENDING' },
]
