import type { Apartment } from '@i9amati/shared'

export const mockApartments: Apartment[] = [
  // ── bld-1: البناية A (res-1) ──────────────────────────────────
  { id: 'apt-1', unitCode: 'A-101', mainPlotNumber: '38/163501', floor: 1, areaSqm: 85, status: 'OCCUPIED', usageType: 'RESIDENTIAL', percentageOfApartment: 8.3, percentageOfResidence: 4.2, buildingId: 'bld-1', residenceId: 'res-1', createdAt: '2023-02-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 'apt-2', unitCode: 'A-102', mainPlotNumber: '38/163502', floor: 1, areaSqm: 72, status: 'OCCUPIED', usageType: 'RESIDENTIAL', percentageOfApartment: 7.1, percentageOfResidence: 3.6, buildingId: 'bld-1', residenceId: 'res-1', createdAt: '2023-02-05T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 'apt-3', unitCode: 'A-103', mainPlotNumber: '38/163503', floor: 1, areaSqm: 95, status: 'VACANT', usageType: 'RESIDENTIAL', percentageOfApartment: 9.3, percentageOfResidence: 4.7, buildingId: 'bld-1', residenceId: 'res-1', createdAt: '2023-02-10T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 'apt-4', unitCode: 'A-201', mainPlotNumber: '38/163504', floor: 2, areaSqm: 110, status: 'OCCUPIED', usageType: 'RESIDENTIAL', percentageOfApartment: 10.8, percentageOfResidence: 5.4, buildingId: 'bld-1', residenceId: 'res-1', createdAt: '2023-02-15T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 'apt-5', unitCode: 'A-202', mainPlotNumber: '38/163505', floor: 2, areaSqm: 68, status: 'MAINTENANCE', usageType: 'RESIDENTIAL', percentageOfApartment: 6.7, percentageOfResidence: 3.3, buildingId: 'bld-1', residenceId: 'res-1', createdAt: '2023-02-20T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 'apt-6', unitCode: 'A-301', mainPlotNumber: '38/163506', floor: 3, areaSqm: 88, status: 'OCCUPIED', usageType: 'RESIDENTIAL', percentageOfApartment: 8.6, percentageOfResidence: 4.3, buildingId: 'bld-1', residenceId: 'res-1', createdAt: '2023-03-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },

  // ── bld-3: عمارة الأطلس (res-2 - standalone IMMEUBLE) ────────
  { id: 'apt-7', unitCode: 'AT-101', mainPlotNumber: '12/044201', floor: 1, areaSqm: 75, status: 'OCCUPIED', usageType: 'RESIDENTIAL', percentageOfApartment: 16.7, buildingId: 'bld-3', residenceId: 'res-2', createdAt: '2023-04-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 'apt-8', unitCode: 'AT-102', mainPlotNumber: '12/044202', floor: 1, areaSqm: 90, status: 'OCCUPIED', usageType: 'COMMERCIAL', percentageOfApartment: 20.0, buildingId: 'bld-3', residenceId: 'res-2', createdAt: '2023-04-05T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 'apt-9', unitCode: 'AT-201', mainPlotNumber: '12/044203', floor: 2, areaSqm: 80, status: 'VACANT', usageType: 'RESIDENTIAL', percentageOfApartment: 17.8, buildingId: 'bld-3', residenceId: 'res-2', createdAt: '2023-04-10T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
]

// helpers
export const getApartmentsByBuilding = (buildingId: string) => mockApartments.filter(a => a.buildingId === buildingId)
export const getApartmentsByResidence = (residenceId: string) => mockApartments.filter(a => a.residenceId === residenceId)
