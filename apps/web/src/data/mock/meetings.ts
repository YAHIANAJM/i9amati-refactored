export type VoteStatus = 'PENDING' | 'OPEN' | 'CLOSED'

export type AgendaItem = {
  id: string
  title: string
  description?: string
  voteStatus: VoteStatus
  pour: number
  contre: number
  abstention: number
  // undefined when CLOSED + tie → president must exercise voix prépondérante (Loi 18-00)
  result?: 'ADOPTED' | 'REJECTED'
}

export type Attendee = {
  id: string
  name: string
  apartment: string
  // Response to convocation invitation (pre-meeting, done from their profile)
  rsvp: 'ACCEPTED' | 'DECLINED' | 'PENDING'
  // Physically present at the meeting — toggled by syndic during IN_PROGRESS (pointage/appel)
  present: boolean
}

export type Meeting = {
  id: string
  title: string
  description?: string
  type: 'GLOBAL' | 'EXCEPTIONAL' | 'NORMAL'
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  // Loi 18-00 art. 30: 1ère convocation requires quorum ≥ 50% of eligible.
  // 2ème convocation deliberates validly regardless of attendance.
  convocationNumber: 1 | 2
  scheduledAt: string
  location?: string
  residenceId: string
  buildingId?: string
  convocationSentAt?: string
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
    convocationNumber: 1,
    scheduledAt: '2024-07-15T10:00:00',
    location: 'Salle de réunion RDC',
    residenceId: 'res-1',
    createdAt: '2024-06-01',
    totalEligible: 8,
    agenda: [
      {
        id: 'ag-1-1', voteStatus: 'PENDING', pour: 0, contre: 0, abstention: 0,
        title: 'Présentation et approbation des comptes 2023',
        description: "Revue du bilan financier de l'exercice 2023 présenté par le syndic.",
      },
      {
        id: 'ag-1-2', voteStatus: 'PENDING', pour: 0, contre: 0, abstention: 0,
        title: 'Élection du nouveau bureau du conseil syndical',
        description: 'Vote pour les membres du conseil : Président, Trésorier, Secrétaire.',
      },
      {
        id: 'ag-1-3', voteStatus: 'PENDING', pour: 0, contre: 0, abstention: 0,
        title: 'Budget prévisionnel 2024-2025',
        description: "Discussion et vote du budget de gestion pour l'exercice à venir.",
      },
    ],
    // SCHEDULED: present is always false — nobody has physically arrived yet
    // rsvp reflects who responded to the convocation
    attendeeList: [
      { id: 'a1', name: 'Ahmed Alaoui',       apartment: 'Apt 1A', rsvp: 'ACCEPTED',  present: false },
      { id: 'a2', name: 'Fatima Benali',      apartment: 'Apt 1B', rsvp: 'ACCEPTED',  present: false },
      { id: 'a3', name: 'Youssef El Idrissi', apartment: 'Apt 2A', rsvp: 'ACCEPTED',  present: false },
      { id: 'a4', name: 'Khadija Tazi',       apartment: 'Apt 2B', rsvp: 'DECLINED',  present: false },
      { id: 'a5', name: 'Rachid Benjelloun',  apartment: 'Apt 3A', rsvp: 'ACCEPTED',  present: false },
      { id: 'a6', name: 'Nadia Chaoui',       apartment: 'Apt 3B', rsvp: 'PENDING',   present: false },
      { id: 'a7', name: 'Hassan Berrada',     apartment: 'Apt 4A', rsvp: 'PENDING',   present: false },
      { id: 'a8', name: 'Laila Chraibi',      apartment: 'Apt 4B', rsvp: 'ACCEPTED',  present: false },
    ],
  },
  {
    id: 'mtg-3',
    title: 'Point urgence ascenseur',
    description: "Décision sur le remplacement du moteur de l'ascenseur en panne.",
    type: 'EXCEPTIONAL',
    status: 'IN_PROGRESS',
    // 2ème convocation: quorum not required — demo this case
    convocationNumber: 2,
    scheduledAt: '2024-06-20T17:30:00',
    location: 'En ligne (Zoom)',
    residenceId: 'res-1',
    createdAt: '2024-06-08',
    totalEligible: 8,
    agenda: [
      {
        id: 'ag-3-1', voteStatus: 'CLOSED', pour: 6, contre: 0, abstention: 1, result: 'ADOPTED',
        title: 'Rapport de panne ascenseur',
        description: 'Présentation du rapport technique du prestataire OTIS Maroc.',
      },
      {
        id: 'ag-3-2', voteStatus: 'OPEN', pour: 3, contre: 3, abstention: 1,
        title: 'Vote remplacement moteur ascenseur',
        description: 'Devis OTIS — 62 000 MAD, délai d\'intervention 3 semaines.',
      },
    ],
    // IN_PROGRESS: pointage done — syndic marked who physically arrived
    attendeeList: [
      { id: 'a1', name: 'Ahmed Alaoui',       apartment: 'Apt 1A', rsvp: 'ACCEPTED', present: true  },
      { id: 'a2', name: 'Fatima Benali',      apartment: 'Apt 1B', rsvp: 'ACCEPTED', present: true  },
      { id: 'a3', name: 'Youssef El Idrissi', apartment: 'Apt 2A', rsvp: 'ACCEPTED', present: true  },
      { id: 'a4', name: 'Khadija Tazi',       apartment: 'Apt 2B', rsvp: 'ACCEPTED', present: true  },
      { id: 'a5', name: 'Rachid Benjelloun',  apartment: 'Apt 3A', rsvp: 'ACCEPTED', present: true  },
      { id: 'a6', name: 'Nadia Chaoui',       apartment: 'Apt 3B', rsvp: 'DECLINED', present: true  },
      { id: 'a7', name: 'Hassan Berrada',     apartment: 'Apt 4A', rsvp: 'DECLINED', present: false },
      { id: 'a8', name: 'Laila Chraibi',      apartment: 'Apt 4B', rsvp: 'PENDING',  present: true  },
    ],
  },
  {
    id: 'mtg-2',
    title: 'Réunion travaux toiture',
    description: 'Discussion sur le devis pour la réfection complète de la toiture.',
    type: 'EXCEPTIONAL',
    status: 'COMPLETED',
    convocationNumber: 1,
    scheduledAt: '2024-05-20T18:00:00',
    location: 'Salle de réunion RDC',
    residenceId: 'res-1',
    createdAt: '2024-05-10',
    totalEligible: 8,
    agenda: [
      {
        id: 'ag-2-1', voteStatus: 'CLOSED', pour: 5, contre: 2, abstention: 0, result: 'ADOPTED',
        title: 'Approbation du devis toiture',
        description: 'Devis société ABC Travaux pour réfection complète — 145 000 MAD.',
      },
      {
        id: 'ag-2-2', voteStatus: 'CLOSED', pour: 4, contre: 3, abstention: 0, result: 'ADOPTED',
        title: 'Modalités de financement des travaux',
        description: 'Cotisation exceptionnelle de 1 500 MAD / appartement sur 3 mensualités.',
      },
    ],
    attendeeList: [
      { id: 'a1', name: 'Ahmed Alaoui',       apartment: 'Apt 1A', rsvp: 'ACCEPTED', present: true  },
      { id: 'a2', name: 'Fatima Benali',      apartment: 'Apt 1B', rsvp: 'ACCEPTED', present: true  },
      { id: 'a3', name: 'Youssef El Idrissi', apartment: 'Apt 2A', rsvp: 'ACCEPTED', present: true  },
      { id: 'a4', name: 'Khadija Tazi',       apartment: 'Apt 2B', rsvp: 'ACCEPTED', present: true  },
      { id: 'a5', name: 'Rachid Benjelloun',  apartment: 'Apt 3A', rsvp: 'DECLINED', present: false },
      { id: 'a6', name: 'Nadia Chaoui',       apartment: 'Apt 3B', rsvp: 'ACCEPTED', present: true  },
      { id: 'a7', name: 'Hassan Berrada',     apartment: 'Apt 4A', rsvp: 'ACCEPTED', present: true  },
      { id: 'a8', name: 'Laila Chraibi',      apartment: 'Apt 4B', rsvp: 'PENDING',  present: false },
    ],
  },
]
