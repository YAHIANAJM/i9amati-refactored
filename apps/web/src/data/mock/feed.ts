export type GroupType = 'residence' | 'building' | 'custom'

export interface MockGroup {
  id: string
  name: string
  memberCount: number
  type: GroupType
}

export interface MockUser {
  id: string
  name: string
  role: string
  avatar: string | null
  apartment: string
  phone?: string
  email?: string
  joinedAt: string
}

export const mockUsers: MockUser[] = [
  { id: 'u1',  name: 'Ahmed Benali',      role: 'Syndic',       avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',    apartment: 'Bureau syndic', phone: '06 12 34 56 78', email: 'ahmed.benali@alnour.ma',       joinedAt: '2020-01-01' },
  { id: 'u2',  name: 'Mohammed El Fassi', role: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed', apartment: 'Apt A-201',     phone: '06 23 45 67 89', email: 'mohammed.elfassi@gmail.com',   joinedAt: '2021-03-15' },
  { id: 'u3',  name: 'Aicha Lamrani',     role: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aicha',    apartment: 'Apt A-302',     phone: '06 34 56 78 90', email: 'aicha.lamrani@gmail.com',      joinedAt: '2021-06-20' },
  { id: 'u4',  name: 'Youssef Tazi',      role: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Youssef',  apartment: 'Apt B-101',     phone: '06 45 67 89 01', email: 'youssef.tazi@hotmail.com',     joinedAt: '2022-01-10' },
  { id: 'u5',  name: 'Fatima Idrissi',    role: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',   apartment: 'Apt B-204',     phone: '06 56 78 90 12', email: 'fatima.idrissi@gmail.com',     joinedAt: '2021-09-05' },
  { id: 'u6',  name: 'Karim Alaoui',      role: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karim',    apartment: 'Apt A-103',     phone: '06 67 89 01 23', email: 'karim.alaoui@gmail.com',       joinedAt: '2020-11-30' },
  { id: 'u7',  name: 'Nadia Chraibi',     role: 'Délégué',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nadia',    apartment: 'Apt A-405',     phone: '06 78 90 12 34', email: 'nadia.chraibi@gmail.com',      joinedAt: '2020-04-17' },
  { id: 'u8',  name: 'Hassan Berrada',    role: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hassan',   apartment: 'Apt B-301',     phone: '06 89 01 23 45', email: 'hassan.berrada@yahoo.com',     joinedAt: '2022-07-22' },
  { id: 'u9',  name: 'Salma Bensouda',    role: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Salma',    apartment: 'Apt B-102',     phone: '06 90 12 34 56', email: 'salma.bensouda@gmail.com',     joinedAt: '2021-12-01' },
  { id: 'u10', name: 'Omar Filali',       role: 'Délégué',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar',     apartment: 'Apt A-305',     phone: '06 01 23 45 67', email: 'omar.filali@gmail.com',        joinedAt: '2020-08-14' },
  { id: 'u11', name: 'Rachid Ouali',      role: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachid',   apartment: 'Apt A-204',     phone: '06 11 22 33 44', email: 'rachid.ouali@gmail.com',       joinedAt: '2023-02-28' },
  { id: 'u12', name: 'Zineb Messari',     role: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zineb',    apartment: 'Apt B-403',     phone: '06 22 33 44 55', email: 'zineb.messari@gmail.com',      joinedAt: '2022-10-10' },
  { id: 'u13', name: 'Khalid Benkirane',  role: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Khalid',   apartment: 'Apt A-102',     phone: '06 33 44 55 66', email: 'khalid.benkirane@outlook.com', joinedAt: '2021-05-05' },
]

export const mockGroupMembers: Record<string, string[]> = {
  'g-residence': ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12','u13'],
  'g-bat-a':     ['u1','u2','u3','u6','u7','u10','u11','u13'],
  'g-bat-b':     ['u1','u4','u5','u8','u9','u12'],
  'g-comite':    ['u1','u7','u10','u2','u3'],
  'g-actifs':    ['u2','u3','u4','u5','u6','u8','u9'],
}

export interface MockComment {
  id: string
  authorName: string
  authorRole: string
  avatar: string | null
  content: string
  createdAt: string
}

export interface MockFeedPost {
  id: string
  groupId: string
  authorName: string
  authorRole: string
  avatar: string | null
  content: string
  createdAt: string
  likes: number
  liked: boolean
  comments: MockComment[]
}

export const mockGroups: MockGroup[] = [
  { id: 'g-residence', name: 'Résidence Al Nour', memberCount: 48, type: 'residence' },
  { id: 'g-bat-a', name: 'Bâtiment A', memberCount: 24, type: 'building' },
  { id: 'g-bat-b', name: 'Bâtiment B', memberCount: 24, type: 'building' },
  { id: 'g-comite', name: 'Comité de Gestion', memberCount: 7, type: 'custom' },
  { id: 'g-actifs', name: 'Propriétaires Actifs', memberCount: 15, type: 'custom' },
]

export const mockFeedPosts: MockFeedPost[] = [
  // ── Résidence Al Nour ──────────────────────────────────────────────────────
  {
    id: 'p1', groupId: 'g-residence',
    authorName: 'Ahmed Benali', authorRole: 'Syndic',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    content: 'Rappel : l\'assemblée générale extraordinaire aura lieu le 20 juin à 17h30 dans la salle commune. Votre présence est importante pour voter sur la réfection de l\'ascenseur et le budget 2025.',
    createdAt: '2024-06-08T10:30:00', likes: 12, liked: false,
    comments: [
      { id: 'c1-1', authorName: 'Mohammed El Fassi', authorRole: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed', content: 'Merci pour le rappel, je serai présent.', createdAt: '2024-06-08T11:00:00' },
      { id: 'c1-2', authorName: 'Aicha Lamrani', authorRole: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aicha', content: 'Pouvez-vous envoyer l\'ordre du jour par email ?', createdAt: '2024-06-08T11:30:00' },
      { id: 'c1-3', authorName: 'Ahmed Benali', authorRole: 'Syndic', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', content: 'Bien sûr Aicha, je vous l\'envoie demain.', createdAt: '2024-06-08T12:00:00' },
    ],
  },
  {
    id: 'p2', groupId: 'g-residence',
    authorName: 'Mohammed El Fassi', authorRole: 'Propriétaire',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed',
    content: 'Bonjour à tous, y a-t-il quelqu\'un disponible pour surveiller le gardien pendant son absence la semaine prochaine ? Merci de me contacter.',
    createdAt: '2024-06-07T14:15:00', likes: 5, liked: false,
    comments: [
      { id: 'c2-1', authorName: 'Youssef Tazi', authorRole: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Youssef', content: 'Je peux m\'en occuper lundi et mardi.', createdAt: '2024-06-07T15:00:00' },
      { id: 'c2-2', authorName: 'Fatima Idrissi', authorRole: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima', content: 'Et moi mercredi si besoin.', createdAt: '2024-06-07T15:45:00' },
    ],
  },
  {
    id: 'p3', groupId: 'g-residence',
    authorName: 'Aicha Lamrani', authorRole: 'Propriétaire',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aicha',
    content: 'Merci au syndic pour la rapidité d\'intervention concernant la fuite d\'eau au 2ème étage. Problème résolu en moins de 24h 👏',
    createdAt: '2024-06-05T16:45:00', likes: 22, liked: true,
    comments: [
      { id: 'c3-1', authorName: 'Ahmed Benali', authorRole: 'Syndic', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', content: 'Merci Aicha ! C\'est notre priorité d\'assurer le bien-être de tous.', createdAt: '2024-06-05T17:00:00' },
    ],
  },
  {
    id: 'p4', groupId: 'g-residence',
    authorName: 'Ahmed Benali', authorRole: 'Syndic',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    content: '🔔 Les travaux de ravalement de façade débuteront le 1er juillet. La résidence sera mise en valeur avec une nouvelle peinture extérieure. Durée estimée : 3 semaines.',
    createdAt: '2024-06-03T09:00:00', likes: 31, liked: false,
    comments: [
      { id: 'c4-1', authorName: 'Omar Filali', authorRole: 'Délégué', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar', content: 'Excellente nouvelle !', createdAt: '2024-06-03T09:30:00' },
    ],
  },

  // ── Bâtiment A ─────────────────────────────────────────────────────────────
  {
    id: 'p5', groupId: 'g-bat-a',
    authorName: 'Ahmed Benali', authorRole: 'Syndic',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    content: '🔧 Travaux de plomberie prévus mercredi 12 juin de 9h à 13h. L\'eau sera coupée dans les étages 2 et 3 du Bâtiment A. Merci de votre compréhension.',
    createdAt: '2024-06-06T09:00:00', likes: 18, liked: false,
    comments: [
      { id: 'c5-1', authorName: 'Karim Alaoui', authorRole: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karim', content: 'Merci pour le préavis, je vais prévoir des réserves d\'eau.', createdAt: '2024-06-06T09:30:00' },
    ],
  },
  {
    id: 'p6', groupId: 'g-bat-a',
    authorName: 'Karim Alaoui', authorRole: 'Propriétaire',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karim',
    content: 'L\'interphone de l\'entrée principale du Bâtiment A est en panne depuis hier soir. Quelqu\'un peut-il contacter la maintenance ?',
    createdAt: '2024-06-04T08:20:00', likes: 8, liked: false,
    comments: [
      { id: 'c6-1', authorName: 'Ahmed Benali', authorRole: 'Syndic', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', content: 'Je contacte le technicien dès maintenant, merci Karim.', createdAt: '2024-06-04T08:45:00' },
      { id: 'c6-2', authorName: 'Karim Alaoui', authorRole: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karim', content: 'Parfait, merci pour la réactivité !', createdAt: '2024-06-04T09:00:00' },
    ],
  },
  {
    id: 'p7', groupId: 'g-bat-a',
    authorName: 'Nadia Chraibi', authorRole: 'Propriétaire',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nadia',
    content: 'Rappel à tous les résidents du Bâtiment A : veuillez ne pas laisser vos vélos dans le couloir du rez-de-chaussée. Merci de les garer dans le local prévu à cet effet.',
    createdAt: '2024-06-02T10:00:00', likes: 6, liked: false,
    comments: [],
  },

  // ── Bâtiment B ─────────────────────────────────────────────────────────────
  {
    id: 'p8', groupId: 'g-bat-b',
    authorName: 'Ahmed Benali', authorRole: 'Syndic',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    content: 'Nettoyage des parties communes du Bâtiment B prévu samedi 15 juin à partir de 10h. Merci de ne pas garer vos voitures dans la cour ce matin-là.',
    createdAt: '2024-06-03T11:00:00', likes: 15, liked: false,
    comments: [
      { id: 'c8-1', authorName: 'Salma Bensouda', authorRole: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Salma', content: 'Bonne initiative, la cour en avait besoin !', createdAt: '2024-06-03T11:30:00' },
    ],
  },
  {
    id: 'p9', groupId: 'g-bat-b',
    authorName: 'Salma Bensouda', authorRole: 'Propriétaire',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Salma',
    content: 'Est-ce que quelqu\'un a trouvé un trousseau de clés dans le couloir du 3ème étage hier soir ? Merci de me contacter.',
    createdAt: '2024-06-02T18:30:00', likes: 3, liked: false,
    comments: [],
  },
  {
    id: 'p10', groupId: 'g-bat-b',
    authorName: 'Hassan Berrada', authorRole: 'Propriétaire',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hassan',
    content: 'Le couloir du 4ème étage a besoin d\'une ampoule neuve. Est-ce que le syndic peut s\'en occuper rapidement ? Merci.',
    createdAt: '2024-06-01T17:00:00', likes: 4, liked: false,
    comments: [
      { id: 'c10-1', authorName: 'Ahmed Benali', authorRole: 'Syndic', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', content: 'C\'est noté Hassan, on règle ça demain.', createdAt: '2024-06-01T17:30:00' },
    ],
  },

  // ── Comité de Gestion ──────────────────────────────────────────────────────
  {
    id: 'p11', groupId: 'g-comite',
    authorName: 'Ahmed Benali', authorRole: 'Syndic',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    content: 'Ordre du jour de la réunion du comité du 15 juin :\n1. Bilan financier du trimestre\n2. Devis pour la rénovation du hall\n3. Contrat de nettoyage - renouvellement\n4. Questions diverses',
    createdAt: '2024-06-01T09:00:00', likes: 4, liked: false,
    comments: [
      { id: 'c11-1', authorName: 'Omar Filali', authorRole: 'Délégué', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar', content: 'Je prépare les chiffres pour le point 1.', createdAt: '2024-06-01T10:00:00' },
      { id: 'c11-2', authorName: 'Nadia Chraibi', authorRole: 'Délégué', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nadia', content: 'J\'ai déjà 3 devis pour la rénovation du hall, je les apporte.', createdAt: '2024-06-01T10:30:00' },
    ],
  },
  {
    id: 'p12', groupId: 'g-comite',
    authorName: 'Omar Filali', authorRole: 'Délégué',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar',
    content: 'Bilan Q1 2024 partagé en pièce jointe. En résumé : taux de recouvrement 87%, charges exceptionnelles +12% vs budget. Je propose qu\'on en discute en réunion.',
    createdAt: '2024-05-30T15:00:00', likes: 2, liked: false,
    comments: [],
  },

  // ── Propriétaires Actifs ───────────────────────────────────────────────────
  {
    id: 'p13', groupId: 'g-actifs',
    authorName: 'Youssef Tazi', authorRole: 'Propriétaire',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Youssef',
    content: 'Idée : et si on organisait une journée portes ouvertes pour les futurs propriétaires de la résidence ? Ce serait une belle occasion de valoriser notre quartier.',
    createdAt: '2024-05-30T14:00:00', likes: 9, liked: false,
    comments: [
      { id: 'c13-1', authorName: 'Fatima Idrissi', authorRole: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima', content: 'Super idée Youssef ! Je suis partante.', createdAt: '2024-05-30T14:30:00' },
      { id: 'c13-2', authorName: 'Aicha Lamrani', authorRole: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aicha', content: 'On peut peut-être prévoir un couscous communautaire 😄', createdAt: '2024-05-30T15:00:00' },
    ],
  },
  {
    id: 'p14', groupId: 'g-actifs',
    authorName: 'Fatima Idrissi', authorRole: 'Propriétaire',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    content: 'Rappel : la pétition pour l\'ajout d\'un deuxième gardien la nuit est encore ouverte. On a besoin de 30 signatures, on en est à 21. Merci de signer si vous êtes d\'accord !',
    createdAt: '2024-05-28T11:00:00', likes: 14, liked: false,
    comments: [
      { id: 'c14-1', authorName: 'Hassan Berrada', authorRole: 'Propriétaire', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hassan', content: 'Je viens de signer, bonne initiative.', createdAt: '2024-05-28T11:30:00' },
    ],
  },
]
