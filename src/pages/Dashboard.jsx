import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  BookOpen,
  Clock,
  CheckCircle2,
  ListTodo,
  Timer,
  Plus,
  CalendarDays,
  Activity,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { dashboardApi } from '@/api/dashboard'
import { tasksApi } from '@/api/tasks'
import { subjectsApi } from '@/api/subjects'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage, formatHours } from '@/lib/utils'
import { unwrapList } from '@/hooks/usePageList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/EmptyState'

const PIE_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6']

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [weekly, setWeekly] = useState([])
  const [distribution, setDistribution] = useState([])
  const [subjects, setSubjects] = useState([])
  const [quickOpen, setQuickOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { title: '', subjectId: '', priority: 'MEDIUM' },
  })

  const load = async () => {
    setLoading(true)
    try {
      const [s, w, d, sub] = await Promise.all([
        dashboardApi.summary(),
        dashboardApi.weeklyProgress(),
        dashboardApi.subjectDistribution(),
        subjectsApi.list(),
      ])
      setSummary(s.data)
      const weeklyData = Array.isArray(w.data) ? w.data : w.data?.days || w.data?.items || []
      setWeekly(
        weeklyData.map((item) => ({
          name: item.day || item.label || item.date || item.name,
          hours: Number(item.hours ?? item.value ?? item.totalHours ?? 0),
        }))
      )
      const dist = Array.isArray(d.data) ? d.data : d.data?.items || []
      setDistribution(
        dist.map((item) => ({
          name: item.subjectName || item.name || item.subject || 'Subject',
          value: Number(item.hours ?? item.value ?? item.totalHours ?? 0),
        }))
      )
      setSubjects(unwrapList(sub.data))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onQuickAdd = async (values) => {
    setSaving(true)
    try {
      await tasksApi.create({
        title: values.title,
        priority: values.priority,
        subjectId: values.subjectId ? Number(values.subjectId) : null,
        status: 'PENDING',
      })
      toast.success('Task added')
      setQuickOpen(false)
      reset()
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  const name = summary?.fullName || user?.fullName || 'there'
  const dateLabel = summary?.date
    ? format(new Date(summary.date), 'EEEE, MMMM d')
    : format(new Date(), 'EEEE, MMMM d')
  const goal = Number(summary?.dailyStudyGoal ?? summary?.dailyGoal ?? 0)
  const todayHours = Number(summary?.todayStudyHours ?? 0)
  const goalPct = goal > 0 ? Math.min(100, (todayHours / goal) * 100) : 0
  const upcoming = summary?.upcomingDeadlines || []
  const schedule = summary?.todaySchedule || []
  const activity = summary?.recentActivity || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Welcome back, {name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-ink-muted">{dateLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setQuickOpen(true)}>
            <Plus className="h-4 w-4" /> Quick Add Task
          </Button>
          <Button onClick={() => navigate('/app/pomodoro')}>
            <Timer className="h-4 w-4" /> Start Pomodoro
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Subjects" value={summary?.totalSubjects ?? 0} />
        <StatCard icon={Clock} label="Today’s hours" value={formatHours(todayHours)} />
        <StatCard icon={ListTodo} label="Pending tasks" value={summary?.pendingTasks ?? 0} />
        <StatCard icon={CheckCircle2} label="Completed" value={summary?.completedTasks ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily study goal</CardTitle>
          <CardDescription>
            {formatHours(todayHours)} of {goal ? formatHours(goal) : '—'} today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={goalPct} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly progress</CardTitle>
            <CardDescription>Study hours over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {weekly.length === 0 ? (
              <EmptyState title="No weekly data yet" description="Complete study sessions to see progress." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#7C3AED" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject distribution</CardTitle>
            <CardDescription>Hours by subject</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {distribution.length === 0 ? (
              <EmptyState title="No distribution yet" description="Log sessions against subjects." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {distribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-600" /> Today’s schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedule.length === 0 ? (
              <p className="text-sm text-ink-muted">No sessions scheduled today.</p>
            ) : (
              schedule.map((item, idx) => (
                <div key={item.id || idx} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium">{item.subjectName || item.subject?.name || item.title}</p>
                  <p className="text-xs text-ink-subtle">
                    {item.startTime || item.start} – {item.endTime || item.end}
                  </p>
                </div>
              ))
            )}
            <Link to="/app/planner" className="block">
              <Button variant="outline" className="w-full">
                Open planner
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink-muted">You’re clear for now.</p>
            ) : (
              upcoming.slice(0, 6).map((item, idx) => (
                <div key={item.id || idx} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-ink-subtle">{item.subjectName || item.type || 'Deadline'}</p>
                  </div>
                  <Badge variant="warning">
                    {item.dueDateTime
                      ? format(new Date(item.dueDateTime), 'MMM d')
                      : item.dueDate || 'Soon'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-600" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.length === 0 ? (
              <p className="text-sm text-ink-muted">Activity will show up as you study.</p>
            ) : (
              activity.slice(0, 6).map((item, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium">{item.message || item.description || item.action}</p>
                  <p className="text-xs text-ink-subtle">
                    {item.timestamp || item.createdAt
                      ? format(new Date(item.timestamp || item.createdAt), 'MMM d, HH:mm')
                      : ''}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent onClose={() => setQuickOpen(false)} className="relative">
          <DialogHeader>
            <DialogTitle>Quick add task</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit(onQuickAdd)}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register('title', { required: true })} placeholder="Review chapter 4" />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select {...register('subjectId')}>
                <option value="">None</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select {...register('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuickOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-ink-subtle">{label}</p>
          <p className="font-display text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
