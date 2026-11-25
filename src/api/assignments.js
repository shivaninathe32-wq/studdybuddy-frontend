import api from './client'

export const assignmentsApi = {
  list: (params) => api.get('/assignments', { params }),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  remove: (id) => api.delete(`/assignments/${id}`),
}
