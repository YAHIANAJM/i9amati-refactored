import { api } from './api'

export type ServiceContractStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED'

export interface ContractFile {
  id:          string
  name:        string
  size:        number | null
  url:         string | null
  uploaded_at: string
}

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
  files:        ContractFile[]
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
    name:          string
    type?:         string | null
    contact_info?: { phone?: string; email?: string } | null
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
    name:          string
    description?:  string | null
    amount:        number
    start_date?:   string | null
    end_date?:     string | null
    status?:       ServiceContractStatus
  }): Promise<ApiServiceContract> {
    return api.post(`/api/services/${serviceId}/contracts`, payload)
  },

  async updateContract(serviceId: string, contractId: string, payload: {
    name?:         string
    description?:  string | null
    amount?:       number
    amount_paid?:  number
    start_date?:   string | null
    end_date?:     string | null
    status?:       ServiceContractStatus
  }): Promise<ApiServiceContract> {
    return api.patch(`/api/services/${serviceId}/contracts/${contractId}`, payload)
  },

  async removeContract(serviceId: string, contractId: string): Promise<void> {
    return api.delete(`/api/services/${serviceId}/contracts/${contractId}`)
  },

  async recordPayment(serviceId: string, contractId: string, amount: number): Promise<ApiServiceContract> {
    return api.post(`/api/services/${serviceId}/contracts/${contractId}/pay`, { amount })
  },

  async attachFile(serviceId: string, contractId: string, file: File): Promise<ContractFile> {
    const { key } = await api.upload<{ url: string; key: string }>(
      '/api/upload?scope=documents',
      file,
    )
    return api.post(`/api/services/${serviceId}/contracts/${contractId}/files`, {
      name: file.name,
      key,
      size: file.size,
    })
  },

  async removeFile(serviceId: string, contractId: string, docId: string): Promise<void> {
    return api.delete(`/api/services/${serviceId}/contracts/${contractId}/files/${docId}`)
  },
}
