import type { Owner } from '@i9amati/shared'

export const mockOwners: Owner[] = [
  // apt-1 — A101
  { id: 'own-1', firstName: 'محمد', lastName: 'الفاسي', nationalId: 'BK123456', phone: '0661234567', gender: 'MALE',   profileImage: undefined, isRepresentative: true,  apartmentId: 'apt-1', createdAt: '2023-02-01T00:00:00.000Z' },

  // apt-2 — A102
  { id: 'own-2', firstName: 'فاطمة الزهراء', lastName: 'بنحدو', nationalId: 'HH234567', phone: '0662345678', gender: 'FEMALE', profileImage: undefined, isRepresentative: true,  apartmentId: 'apt-2', createdAt: '2023-02-05T00:00:00.000Z' },

  // apt-3 — A103
  { id: 'own-3', firstName: 'يوسف', lastName: 'العلمي', nationalId: 'CD345678', phone: '0663456789', gender: 'MALE',   profileImage: undefined, isRepresentative: true,  apartmentId: 'apt-3', createdAt: '2023-02-10T00:00:00.000Z' },

  // apt-4 — B201 (2 owners)
  { id: 'own-4', firstName: 'خديجة', lastName: 'بنعلي',   nationalId: 'AB456789', phone: '0664567890', gender: 'FEMALE', profileImage: undefined, isRepresentative: true,  apartmentId: 'apt-4', createdAt: '2023-02-15T00:00:00.000Z' },
  { id: 'own-5', firstName: 'عمر',   lastName: 'الطاهري', nationalId: 'GH567890', phone: '0665678901', gender: 'MALE',   profileImage: undefined, isRepresentative: false, apartmentId: 'apt-4', createdAt: '2023-02-15T00:00:00.000Z' },

  // apt-5 — B202
  { id: 'own-6', firstName: 'حسن', lastName: 'الشرقاوي', nationalId: 'BE678901', phone: '0666789012', gender: 'MALE',   profileImage: undefined, isRepresentative: true,  apartmentId: 'apt-5', createdAt: '2023-02-20T00:00:00.000Z' },

  // apt-6 — B203
  { id: 'own-7', firstName: 'عائشة', lastName: 'اللمراني', nationalId: 'JK789012', phone: '0667890123', gender: 'FEMALE', profileImage: undefined, isRepresentative: true,  apartmentId: 'apt-6', createdAt: '2023-03-01T00:00:00.000Z' },

  // apt-7 — C301
  { id: 'own-8', firstName: 'رشيد', lastName: 'بوعزة', nationalId: 'LM890123', phone: '0668901234', gender: 'MALE',   profileImage: undefined, isRepresentative: true,  apartmentId: 'apt-7', createdAt: '2023-03-05T00:00:00.000Z' },

  // apt-8 — C302
  { id: 'own-9', firstName: 'نادية', lastName: 'التازي', nationalId: 'NP901234', phone: '0669012345', gender: 'FEMALE', profileImage: undefined, isRepresentative: true,  apartmentId: 'apt-8', createdAt: '2023-03-10T00:00:00.000Z' },
]

// helper: get owners for a given apartment
export const getOwnersByApartment = (apartmentId: string) =>
  mockOwners.filter(o => o.apartmentId === apartmentId)

// helper: get representative owner for a given apartment
export const getRepresentative = (apartmentId: string) =>
  mockOwners.find(o => o.apartmentId === apartmentId && o.isRepresentative)
