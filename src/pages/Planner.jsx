import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { toast } from 'sonner'
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { studySessionsApi } from '@/api/studySessions'
import { subjectsApi } from '@/api/subjects'
import { getErrorMessage } from '@/lib/utils'
import { unwrapList } from '@/hooks/usePageList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'

const emptyForm = {
  subjectId: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '09:00',
  endTime: '10:00',
  studyGoal: '',
  notes: '',
  completed: false,
}

export default function Planner() {
  const [view, setView] = useState('weekly')
  const [anchor, setAnchor] = useState(new Date())
  const [sessions, setSessions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyForm })

  const range = useMemo(() => {
    if (view === 'daily') {
      return { from: format(anchor, 'yyyy-MM-dd'), to: format(anchor, 'yyyy-MM-dd') }
    }
    if (view === 'monthly') {
      return {
        from: format(startOfMonth(anchor), 'yyyy-MM-dd'),
        to: format(endOfMonth(anchor), 'yyyy-MM-dd'),
      }
    }
    const start = startOfWeek(anchor, { weekStartsOn: 1 })
    const end = endOfWeek(anchor, { weekStartsOn: 1 })
    return { from: format(start, 'yyyy-MM-dd'), to: format(end, 'yyyy-MM-dd') }
  }, [view, anchor])

  const load = async () => {
    setLoading(true)
    try {
      const [sess, subs] = await Promise.all([
        studySessionsApi.list({ from: range.from, to: range.to, date: view === 'daily' ? range.from : undefined }),
        subjectsApi.list(),
      ])
      setSessions(unwrapList(sess.data))
      setSubjects(unwrapList(subs.data))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [range.from, range.to, view])

  const shift = (dir) => {
    if (view === 'daily') setAnchor((d) => addDays(d, dir))
    else if (view === 'monthly') setAnchor((d) => addDays(startOfMonth(d), dir * 32))
    else setAnchor((d) => addDays(d, dir * 7))
  }

  const openCreate = (dateStr) => {
    setEditing(null)
    reset({
      ...emptyForm,
      date: dateStr || format(anchor, 'yyyy-MM-dd'),
      subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
    })
    setOpen(true)
  }

  const openEdit = (session) => {
    setEditing(session)
    reset({
      subjectId: String(session.subjectId || session.subject?.id || ''),
      date: session.date?.slice?.(0, 10) || session.date,
      startTime: (session.startTime || '').slice(0, 5),
      endTime: (session.endTime || '').slice(0, 5),
      studyGoal: session.studyGoal || '',
      notes: session.notes || '',
      completed: Boolean(session.completed),
    })
    setOpen(true)
  }

  const onSubmit = async (values) => {
    setSaving(true)
    try {
      const payload = {
        subjectId: Number(values.subjectId),
        date: values.date,
        startTime: values.startTime.length === 5 ? `${values.startTime}:00` : values.startTime,
        endTime: values.endTime.length === 5 ? `${values.endTime}:00` : values.endTime,
        studyGoal: values.studyGoal,
        notes: values.notes,
        completed: Boolean(values.completed),
      }
      if (editing) await studySessionsApi.update(editing.id, payload)
      else await studySessionsApi.create(payload)
      toast.success(editing ? 'Session updated' : 'Session created')
      setOpen(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save session (check overlaps)'))
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    setSaving(true)
    try {
      await studySessionsApi.remove(deleteId)
      toast.success('Session deleted')
      setDeleteId(null)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const days = useMemo(() => {
    if (view === 'daily') return [anchor]
    if (view === 'monthly') {
      const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 })
      const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 })
      const list = []
      for (let d = start; d <= end; d = addDays(d, 1)) list.push(d)
      return list
    }
    const start = startOfWeek(anchor, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [view, anchor])

  const sessionsFor = (day) =>
    sessions.filter((s) => {
      const raw = s.date
      const d = typeof raw === 'string' ? parseISO(raw.slice(0, 10)) : new Date(raw)
      return isSameDay(d, day)
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Planner</h1>
          <p className="text-sm text-ink-muted">Schedule study sessions without overlaps.</p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="h-4 w-4" /> Add session
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setAnchor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="min-w-[140px] text-sm font-medium">
            {view === 'monthly'
              ? format(anchor, 'MMMM yyyy')
              : view === 'daily'
                ? format(anchor, 'MMM d, yyyy')
                : `${format(days[0], 'MMM d')} – ${format(days[days.length - 1], 'MMM d')}`}
          </p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-80" />
      ) : sessions.length === 0 && view === 'daily' ? (
        <EmptyState
          icon={CalendarDays}
          title="No sessions today"
          description="Add a study block to get started."
          actionLabel="Add session"
          onAction={() => openCreate()}
        />
      ) : (
        <div
          className={
            view === 'monthly'
              ? 'grid grid-cols-7 gap-2'
              : view === 'weekly'
                ? 'grid gap-3 md:grid-cols-7'
                : 'space-y-3'
          }
        >
          {view === 'monthly' &&
            ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="px-1 text-center text-xs font-medium text-ink-subtle">
                {d}
              </div>
            ))}
          {days.map((day) => {
            const daySessions = sessionsFor(day)
            const inMonth = isSameMonth(day, anchor)
            return (
              <Card
                key={day.toISOString()}
                className={`${view === 'monthly' ? 'min-h-[96px]' : ''} ${!inMonth && view === 'monthly' ? 'opacity-40' : ''}`}
              >
                <CardHeader className="flex-row items-center justify-between space-y-0 p-3 pb-1">
                  <CardTitle className="text-sm font-medium">{format(day, view === 'monthly' ? 'd' : 'EEE d')}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCreate(format(day, 'yyyy-MM-dd'))}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-1.5 p-3 pt-1">
                  {daySessions.length === 0 && view !== 'monthly' && (
                    <p className="text-xs text-ink-subtle">No sessions</p>
                  )}
                  {daySessions.map((s) => (
                    <div
                      key={s.id}
                      className="group rounded-lg border border-border bg-surface-muted/70 p-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <p className="font-medium text-ink">
                            {s.subjectName || s.subject?.name || 'Session'}
                          </p>
                          <p className="text-ink-subtle">
                            {(s.startTime || '').toString().slice(0, 5)}–{(s.endTime || '').toString().slice(0, 5)}
                          </p>
                          {s.completed && <Badge variant="success" className="mt-1">Done</Badge>}
                        </div>
                        <div className="flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                          <button type="button" onClick={() => openEdit(s)} className="p-1 text-ink-muted hover:text-ink">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => setDeleteId(s.id)} className="p-1 text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="relative max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit session' : 'New study session'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select {...register('subjectId', { required: true })}>
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...register('date', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="time" {...register('startTime', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input type="time" {...register('endTime', { required: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Study goal</Label>
              <Input {...register('studyGoal')} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea {...register('notes')} rows={3} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('completed')} className="rounded border-border" />
              Mark completed
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete session?"
        description="This study block will be removed from your planner."
        confirmLabel="Delete"
        destructive
        loading={saving}
        onConfirm={onDelete}
      />
    </div>
  )
}
