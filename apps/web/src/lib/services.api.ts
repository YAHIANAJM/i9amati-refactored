import { api } from './api'

export type ServiceContractStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED'

export interface ApiServiceContract {
  id:           string
  service_id:   string
  name:         string
  description:  string | null
  amount:       number
  amount_paid:  number
  start_date:   string | null
  end_date:     string | null
  status:       ServiceContractStatus
}

export interface ApiService {
  id:           string
  name:         string
  slug:         string
  type:         string | null
  contact_info: { phone?: string; email?: string } | null
  contracts:    ApiServiceContract[]
}

export interface ServicesResponse {
  profileId:   string
  profileRole: string
  services:    ApiService[]
}

export const servicesApi = {
  async list(): Promise<ServicesResponse> {
    return api.get<ServicesResponse>('/api/services')
  },

  async create(payload: {
    name: string
    type?: string
    contact_info?: { phone?: string; email?: string }
  }): Promise<ApiService> {
    return api.post('/api/services', payload)
  },

  async update(serviceId: string, payload: {
    name?: string
    type?: string | null
    contact_info?: { phone?: string; email?: string } | null
  }): Promise<ApiService> {
    return api.patch(`/api/services/${serviceId}`, payload)
  },

  async remove(serviceId: string): Promise<void> {
    return api.delete(`/api/services/${serviceId}`)
  },

  async addContract(serviceId: string, payload: {
    name:        string
    description?: string
    amount:      number
    start_date?: string
    end_date?:   string
    status?:     ServiceContractStatus
  }): Promise<ApiServiceContract> {
    return api.post(`/api/services/${serviceId}/contracts`, payload)
  },

  async updateContract(serviceId: string, contractId: string, payload: {
    name?:        string
    description?: string | null
    amount?:      number
    start_date?:  string | null
    end_date?:    string | null
    status?:      ServiceContractStatus
  }): Promise<ApiServiceContract> {
    return api.patch(`/api/services/${serviceId}/contracts/${contractId}`, payload)
  },

  async removeContract(serviceId: string, contractId: string): Promise<void> {
    return api.delete(`/api/services/${serviceId}/contracts/${contractId}`)
  },

  async recordPayment(serviceId: string, contractId: string, amount: number): Promise<ApiServiceContract> {
    return api.post(`/api/services/${serviceId}/contracts/${contractId}/pay`, { amount })
  },
}
