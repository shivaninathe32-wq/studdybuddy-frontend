import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute } from '@/components/GuestRoute'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Dashboard from '@/pages/Dashboard'
import Subjects from '@/pages/Subjects'
import Planner from '@/pages/Planner'
import Tasks from '@/pages/Tasks'
import Assignments from '@/pages/Assignments'
import Analytics from '@/pages/Analytics'
import Notes from '@/pages/Notes'
import Pomodoro from '@/pages/Pomodoro'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="planner" element={<Planner />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notes" element={<Notes />} />
          <Route path="pomodoro" element={<Pomodoro />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
