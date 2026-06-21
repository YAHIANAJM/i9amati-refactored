export type VoteStatus = 'PENDING' | 'OPEN' | 'CLOSED'

export type AgendaItem = {
  id: string
  title: string
  description?: string
  voteStatus: VoteStatus
  pour: number
  contre: number
  abstention: number
  result?: 'ADOPTED' | 'REJECTED'
}

export type Attendee = {
  id: string
  name: string
  apartment: string
  present: boolean
}

export type Meeting = {
  id: string
  title: string
  description?: string
  type: 'GLOBAL' | 'EXCEPTIONAL' | 'NORMAL'
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  scheduledAt: string
  location?: string
  residenceId: string
  createdAt: string
  agenda: AgendaItem[]
  attendeeList: Attendee[]
  totalEligible: number
}

export const mockMeetings: Meeting[] = [
  {
    id: 'mtg-1',
    title: 'Assemblée Générale Ordinaire 2024',
    description: 'Présentation des comptes annuels et élection du bureau syndical.',
    type: 'GLOBAL',
    status: 'SCHEDULED',
    scheduledAt: '2024-07-15T10:00:00',
    location: 'Salle de réunion RDC',
    residenceId: 'res-1',
    createdAt: '2024-06-01',
    totalEligible: 19,
    agenda: [
      {
        id: 'ag-1-1', voteStatus: 'PENDING', pour: 0, contre: 0, abstention: 0,
        title: 'Présentation et approbation des comptes 2023',
        description: 'Revue du bilan financier de l\'exercice 2023 présenté par le syndic.',
      },
      {
        id: 'ag-1-2', voteStatus: 'PENDING', pour: 0, contre: 0, abstention: 0,
        title: 'Élection du nouveau bureau du conseil syndical',
        description: 'Vote pour les membres du conseil : Président, Trésorier, Secrétaire.',
      },
      {
        id: 'ag-1-3', voteStatus: 'PENDING', pour: 0, contre: 0, abstention: 0,
        title: 'Budget prévisionnel 2024-2025',
        description: 'Discussion et vote du budget de gestion pour l\'exercice à venir.',
      },
    ],
    attendeeList: [
      { id: 'a1', name: 'Ahmed Alaoui',        apartment: 'Apt 1A', present: true  },
      { id: 'a2', name: 'Fatima Benali',       apartment: 'Apt 1B', present: true  },
      { id: 'a3', name: 'Youssef El Idrissi', apartment: 'Apt 2A', present: true  },
      { id: 'a4', name: 'Khadija Tazi',        apartment: 'Apt 2B', present: false },
      { id: 'a5', name: 'Rachid Benjelloun',   apartment: 'Apt 3A', present: true  },
      { id: 'a6', name: 'Nadia Chaoui',        apartment: 'Apt 3B', present: true  },
      { id: 'a7', name: 'Hassan Berrada',      apartment: 'Apt 4A', present: false },
      { id: 'a8', name: 'Laila Chraibi',       apartment: 'Apt 4B', present: true  },
    ],
  },
  {
    id: 'mtg-3',
    title: 'Point urgence ascenseur',
    description: 'Décision sur le remplacement du moteur de l\'ascenseur en panne.',
    type: 'EXCEPTIONAL',
    status: 'IN_PROGRESS',
    scheduledAt: '2024-06-20T17:30:00',
    location: 'En ligne (Zoom)',
    residenceId: 'res-1',
    createdAt: '2024-06-08',
    totalEligible: 19,
    agenda: [
      {
        id: 'ag-3-1', voteStatus: 'CLOSED', pour: 8, contre: 0, abstention: 2, result: 'ADOPTED',
        title: 'Rapport de panne ascenseur',
        description: 'Présentation du rapport technique du prestataire OTIS Maroc.',
      },
      {
        id: 'ag-3-2', voteStatus: 'OPEN', pour: 5, contre: 2, abstention: 1,
        title: 'Vote remplacement moteur ascenseur',
        description: 'Devis OTIS — 62 000 MAD, délai d\'intervention 3 semaines.',
      },
    ],
    attendeeList: [
      { id: 'a1', name: 'Ahmed Alaoui',        apartment: 'Apt 1A', present: true  },
      { id: 'a2', name: 'Fatima Benali',       apartment: 'Apt 1B', present: true  },
      { id: 'a3', name: 'Youssef El Idrissi', apartment: 'Apt 2A', present: true  },
      { id: 'a4', name: 'Khadija Tazi',        apartment: 'Apt 2B', present: true  },
      { id: 'a5', name: 'Rachid Benjelloun',   apartment: 'Apt 3A', present: true  },
      { id: 'a6', name: 'Nadia Chaoui',        apartment: 'Apt 3B', present: true  },
      { id: 'a7', name: 'Hassan Berrada',      apartment: 'Apt 4A', present: false },
      { id: 'a8', name: 'Laila Chraibi',       apartment: 'Apt 4B', present: true  },
    ],
  },
  {
    id: 'mtg-2',
    title: 'Réunion travaux toiture',
    description: 'Discussion sur le devis pour la réfection complète de la toiture.',
    type: 'EXCEPTIONAL',
    status: 'COMPLETED',
    scheduledAt: '2024-05-20T18:00:00',
    location: 'Salle de réunion RDC',
    residenceId: 'res-1',
    createdAt: '2024-05-10',
    totalEligible: 19,
    agenda: [
      {
        id: 'ag-2-1', voteStatus: 'CLOSED', pour: 10, contre: 2, abstention: 0, result: 'ADOPTED',
        title: 'Approbation du devis toiture',
        description: 'Devis société ABC Travaux pour réfection complète — 145 000 MAD.',
      },
      {
        id: 'ag-2-2', voteStatus: 'CLOSED', pour: 9, contre: 3, abstention: 0, result: 'ADOPTED',
        title: 'Modalités de financement des travaux',
        description: 'Cotisation exceptionnelle de 1 500 MAD / appartement sur 3 mensualités.',
      },
    ],
    attendeeList: [
      { id: 'a1', name: 'Ahmed Alaoui',        apartment: 'Apt 1A', present: true  },
      { id: 'a2', name: 'Fatima Benali',       apartment: 'Apt 1B', present: true  },
      { id: 'a3', name: 'Youssef El Idrissi', apartment: 'Apt 2A', present: true  },
      { id: 'a4', name: 'Khadija Tazi',        apartment: 'Apt 2B', present: true  },
      { id: 'a5', name: 'Rachid Benjelloun',   apartment: 'Apt 3A', present: false },
      { id: 'a6', name: 'Nadia Chaoui',        apartment: 'Apt 3B', present: true  },
      { id: 'a7', name: 'Hassan Berrada',      apartment: 'Apt 4A', present: true  },
      { id: 'a8', name: 'Laila Chraibi',       apartment: 'Apt 4B', present: false },
    ],
  },
]
