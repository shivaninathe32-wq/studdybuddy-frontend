import api from './client'

export const analyticsApi = {
  dailyProductivity: (params) => api.get('/analytics/daily-productivity', { params }),
  taskCompletion: (params) => api.get('/analytics/task-completion', { params }),
  weeklyProgress: () => api.get('/dashboard/weekly-progress'),
  subjectDistribution: () => api.get('/dashboard/subject-distribution'),
}
