export const mockPayments = [
  { id: 'pay-1', apartmentNumber: 'A101', ownerName: 'Mohammed El Fassi', amount: 450, status: 'PAID', type: 'CHARGE', dueDate: '2024-06-01', paidAt: '2024-06-02', residenceId: 'res-1' },
  { id: 'pay-2', apartmentNumber: 'A102', ownerName: 'Fatima Zahra Benhaddou', amount: 380, status: 'PAID', type: 'CHARGE', dueDate: '2024-06-01', paidAt: '2024-05-30', residenceId: 'res-1' },
  { id: 'pay-3', apartmentNumber: 'B201', ownerName: 'Khadija Benali', amount: 600, status: 'PENDING', type: 'CHARGE', dueDate: '2024-06-01', paidAt: null, residenceId: 'res-1' },
  { id: 'pay-4', apartmentNumber: 'B203', ownerName: 'Aicha Lamrani', amount: 470, status: 'OVERDUE', type: 'CHARGE', dueDate: '2024-05-01', paidAt: null, residenceId: 'res-1' },
  { id: 'pay-5', apartmentNumber: 'C301', ownerName: 'Rachid Bouazza', amount: 650, status: 'PAID', type: 'CHARGE', dueDate: '2024-06-01', paidAt: '2024-06-01', residenceId: 'res-1' },
  { id: 'pay-6', apartmentNumber: 'C302', ownerName: 'Nadia Tazi', amount: 400, status: 'PENDING', type: 'CHARGE', dueDate: '2024-06-01', paidAt: null, residenceId: 'res-1' },
  { id: 'pay-7', apartmentNumber: 'A101', ownerName: 'Mohammed El Fassi', amount: 1200, status: 'PAID', type: 'REPAIR', dueDate: '2024-04-15', paidAt: '2024-04-14', residenceId: 'res-1' },
  { id: 'pay-8', apartmentNumber: 'B202', ownerName: 'Hassan Cherkaoui', amount: 350, status: 'OVERDUE', type: 'MAINTENANCE', dueDate: '2024-04-01', paidAt: null, residenceId: 'res-1' },
]

export const mockPaymentStats = {
  totalCollected: 32450,
  totalPending: 8200,
  totalOverdue: 3100,
  collectionRate: 78,
  monthlyTrend: [
    { month: 'Jan', collected: 28000, pending: 4000 },
    { month: 'Fév', collected: 31000, pending: 3500 },
    { month: 'Mar', collected: 29500, pending: 5000 },
    { month: 'Avr', collected: 33000, pending: 2800 },
    { month: 'Mai', collected: 30000, pending: 6200 },
    { month: 'Jun', collected: 32450, pending: 8200 },
  ],
}
