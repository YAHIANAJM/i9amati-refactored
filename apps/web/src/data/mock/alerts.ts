export const mockAlerts = [
  { id: 'a1', title: 'Paiement en retard', message: 'L\'appartement B202 a un paiement en retard de 65 jours.', type: 'PAYMENT',  priority: 'HIGH',   read: false, createdAt: '2024-06-08T09:00:00' },
  { id: 'a2', title: 'Nouvelle réclamation', message: 'Réclamation URGENTE: ascenseur en panne (B201).', type: 'COMPLAINT', priority: 'URGENT', read: false, createdAt: '2024-06-07T14:30:00' },
  { id: 'a3', title: 'Réunion dans 7 jours', message: 'Réunion "Point urgence ascenseur" prévue le 20 juin.', type: 'MEETING',  priority: 'MEDIUM', read: true,  createdAt: '2024-06-07T08:00:00' },
  { id: 'a4', title: 'Document expiré', message: 'Le contrat d\'assurance expire dans 30 jours.', type: 'DOCUMENT', priority: 'MEDIUM', read: true,  createdAt: '2024-06-06T10:00:00' },
  { id: 'a5', title: 'Nouveau membre', message: 'Omar Tahiri a rejoint la résidence Al Nour (B201).', type: 'MEMBER',   priority: 'LOW',    read: true,  createdAt: '2024-06-05T16:00:00' },
]

export const mockNotificationSettings = [
  { key: 'payments',   label: 'Paiements & Cotisations', enabled: true },
  { key: 'complaints', label: 'Réclamations',             enabled: true },
  { key: 'meetings',   label: 'Réunions & Votes',         enabled: true },
  { key: 'documents',  label: 'Documents',                enabled: false },
  { key: 'members',    label: 'Nouveaux membres',         enabled: true },
  { key: 'feed',       label: 'Publications Feed',        enabled: false },
]
