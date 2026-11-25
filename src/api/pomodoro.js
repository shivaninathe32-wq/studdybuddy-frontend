import api from './client'

export const pomodoroApi = {
  listSessions: (params) => api.get('/pomodoro/sessions', { params }),
  createSession: (data) => api.post('/pomodoro/sessions', data),
  summary: () => api.get('/pomodoro/summary'),
}
