import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { BarChart3 } from 'lucide-react'
import { analyticsApi } from '@/api/analytics'
import { getErrorMessage } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4']

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [weekly, setWeekly] = useState([])
  const [subjects, setSubjects] = useState([])
  const [daily, setDaily] = useState([])
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [w, s, d, t] = await Promise.allSettled([
          analyticsApi.weeklyProgress(),
          analyticsApi.subjectDistribution(),
          analyticsApi.dailyProductivity(),
          analyticsApi.taskCompletion(),
        ])

        if (w.status === 'fulfilled') {
          const data = w.value.data
          const list = Array.isArray(data) ? data : data?.days || data?.items || []
          setWeekly(
            list.map((item) => ({
              name: item.day || item.label || item.date || item.name,
              hours: Number(item.hours ?? item.value ?? item.totalHours ?? 0),
            }))
          )
        }

        if (s.status === 'fulfilled') {
          const data = s.value.data
          const list = Array.isArray(data) ? data : data?.items || []
          setSubjects(
            list.map((item) => ({
              name: item.subjectName || item.name || 'Subject',
              value: Number(item.hours ?? item.value ?? 0),
            }))
          )
        }

        if (d.status === 'fulfilled') {
          const data = d.value.data
          const list = Array.isArray(data) ? data : data?.days || data?.items || []
          setDaily(
            list.map((item) => ({
              name: item.day || item.date || item.label || item.name,
              productivity: Number(item.productivity ?? item.hours ?? item.value ?? 0),
            }))
          )
        } else if (w.status === 'fulfilled') {
          // fallback: reuse weekly as productivity line if analytics endpoint missing
          const data = w.value.data
          const list = Array.isArray(data) ? data : data?.days || data?.items || []
          setDaily(
            list.map((item) => ({
              name: item.day || item.label || item.date || item.name,
              productivity: Number(item.hours ?? item.value ?? 0),
            }))
          )
        }

        if (t.status === 'fulfilled') {
          const data = t.value.data
          if (Array.isArray(data)) {
            setTasks(
              data.map((item) => ({
                name: item.label || item.status || item.name,
                count: Number(item.count ?? item.value ?? 0),
              }))
            )
          } else {
            setTasks([
              { name: 'Completed', count: Number(data.completed ?? data.completedTasks ?? 0) },
              { name: 'Pending', count: Number(data.pending ?? data.pendingTasks ?? 0) },
            ])
          }
        }

        const failed = [w, s, d, t].filter((r) => r.status === 'rejected')
        if (failed.length === 4) {
          toast.error(getErrorMessage(failed[0].reason))
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  const empty =
    weekly.length === 0 && subjects.length === 0 && daily.length === 0 && tasks.every((t) => !t.count)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-ink-muted">Insights from your real study activity.</p>
      </div>

      {empty ? (
        <EmptyState
          icon={BarChart3}
          title="Not enough data yet"
          description="Complete sessions and tasks to unlock charts."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly study hours</CardTitle>
              <CardDescription>Bar chart of the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#7C3AED" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subject distribution</CardTitle>
              <CardDescription>Hours by subject</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={subjects} dataKey="value" nameKey="name" outerRadius={90} label>
                    {subjects.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily productivity</CardTitle>
              <CardDescription>Trend line of focus over time</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="productivity" stroke="#6366F1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed vs pending tasks</CardTitle>
              <CardDescription>Task completion snapshot</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasks}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
