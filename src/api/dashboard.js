import api from './client'

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  weeklyProgress: () => api.get('/dashboard/weekly-progress'),
  subjectDistribution: () => api.get('/dashboard/subject-distribution'),
}
