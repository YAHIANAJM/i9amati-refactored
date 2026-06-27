// ─── Right Hands ──────────────────────────────────────────────────────────────
// Persons the syndic delegates to manage a specific building

export type RightHand = {
  id:         string
  name:       string
  building:   string   // which building they're responsible for
  email:      string
  phone:      string
  status:     'ACTIVE' | 'PENDING'
  assignedAt: string   // ISO date
  note?:      string
}

export const mockRightHands: RightHand[] = [
  {
    id: 'rh1', name: 'Youssef Benkirane',
    building: 'Bloc B — Tour Ouest',
    email: 'y.benkirane@gmail.com', phone: '+212 6 72 33 44 55',
    status: 'ACTIVE', assignedAt: '2024-03-10',
    note: 'Gestion quotidienne, collecte des charges',
  },
  {
    id: 'rh2', name: 'Fatima Chraibi',
    building: 'Bloc C — Marina',
    email: 'f.chraibi@gmail.com', phone: '+212 6 83 55 66 77',
    status: 'ACTIVE', assignedAt: '2024-06-01',
  },
  {
    id: 'rh3', name: 'Karim Idrissi',
    building: 'Bloc A — Résidence Nord',
    email: 'k.idrissi@gmail.com', phone: '+212 6 55 99 00 11',
    status: 'PENDING', assignedAt: '2026-06-20',
    note: 'En attente de confirmation',
  },
]

// ─── Partner Syndics ──────────────────────────────────────────────────────────
// Other syndics sharing common parts with this syndic's residence

export type SharedPart = 'Parking commun' | 'Jardin commun' | 'Entrée principale' | 'Local technique' | 'Piscine' | 'Salle commune' | 'Autre'

export const SHARED_PARTS: SharedPart[] = [
  'Parking commun', 'Jardin commun', 'Entrée principale',
  'Local technique', 'Piscine', 'Salle commune', 'Autre',
]

export type PartnerSyndic = {
  id:          string
  name:        string      // syndic's full name
  residence:   string      // their residence / complex name
  sharedParts: SharedPart[]
  email:       string
  phone:       string
  linkedAt:    string      // ISO date when the partnership was recorded
  note?:       string
}

export const mockPartnerSyndics: PartnerSyndic[] = [
  {
    id: 'ps1', name: 'Omar Alaoui',
    residence: 'Résidence Al Farah',
    sharedParts: ['Parking commun', 'Jardin commun'],
    email: 'o.alaoui@alfar.ma', phone: '+212 6 11 22 33 44',
    linkedAt: '2023-09-15',
    note: 'Réunion trimestrielle pour l\'entretien du parking',
  },
  {
    id: 'ps2', name: 'Hassan Berrada',
    residence: 'Résidence Oasis',
    sharedParts: ['Entrée principale'],
    email: 'h.berrada@oasis.ma', phone: '+212 6 44 55 66 77',
    linkedAt: '2024-01-20',
  },
  {
    id: 'ps3', name: 'Nadia Chaoui',
    residence: 'Copropriété Les Acacias',
    sharedParts: ['Local technique', 'Salle commune'],
    email: 'n.chaoui@acacias.ma', phone: '+212 6 77 88 99 00',
    linkedAt: '2024-11-05',
    note: 'Contrat de maintenance partagé avec Société ProNet',
  },
]
