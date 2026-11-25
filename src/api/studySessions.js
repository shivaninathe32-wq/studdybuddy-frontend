import api from './client'

export const studySessionsApi = {
  list: (params) => api.get('/study-sessions', { params }),
  create: (data) => api.post('/study-sessions', data),
  update: (id, data) => api.put(`/study-sessions/${id}`, data),
  remove: (id) => api.delete(`/study-sessions/${id}`),
}
