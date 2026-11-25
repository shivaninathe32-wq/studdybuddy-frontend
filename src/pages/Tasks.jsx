import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { format, isBefore, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { CheckSquare, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { tasksApi } from '@/api/tasks'
import { subjectsApi } from '@/api/subjects'
import { getErrorMessage } from '@/lib/utils'
import { unwrapList } from '@/hooks/usePageList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'

const emptyForm = {
  title: '',
  description: '',
  subjectId: '',
  dueDateTime: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  estimatedDurationMinutes: 30,
  actualDurationMinutes: '',
}

const priorityVariant = { LOW: 'secondary', MEDIUM: 'default', HIGH: 'danger' }

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', priority: '', subjectId: '', q: '', sort: 'dueDateTime,asc' })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyForm })

  const load = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      )
      const [t, s] = await Promise.all([tasksApi.list(params), subjectsApi.list()])
      setTasks(unwrapList(t.data))
      setSubjects(unwrapList(s.data))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filters.status, filters.priority, filters.subjectId, filters.sort])

  const columns = useMemo(() => {
    const groups = { PENDING: [], IN_PROGRESS: [], COMPLETED: [] }
    tasks.forEach((t) => {
      const key = t.status || 'PENDING'
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })
    return groups
  }, [tasks])

  const progressPct = tasks.length
    ? Math.round((columns.COMPLETED.length / tasks.length) * 100)
    : 0

  const openCreate = () => {
    setEditing(null)
    reset(emptyForm)
    setOpen(true)
  }

  const openEdit = (task) => {
    setEditing(task)
    reset({
      title: task.title || '',
      description: task.description || '',
      subjectId: task.subjectId || task.subject?.id || '',
      dueDateTime: task.dueDateTime ? format(new Date(task.dueDateTime), "yyyy-MM-dd'T'HH:mm") : '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'PENDING',
      estimatedDurationMinutes: task.estimatedDurationMinutes ?? 30,
      actualDurationMinutes: task.actualDurationMinutes ?? '',
    })
    setOpen(true)
  }

  const onSubmit = async (values) => {
    setSaving(true)
    try {
      const payload = {
        title: values.title,
        description: values.description,
        subjectId: values.subjectId ? Number(values.subjectId) : null,
        dueDateTime: values.dueDateTime || null,
        priority: values.priority,
        status: values.status,
        estimatedDurationMinutes: values.estimatedDurationMinutes
          ? Number(values.estimatedDurationMinutes)
          : null,
        actualDurationMinutes: values.actualDurationMinutes
          ? Number(values.actualDurationMinutes)
          : null,
      }
      if (editing) await tasksApi.update(editing.id, payload)
      else await tasksApi.create(payload)
      toast.success(editing ? 'Task updated' : 'Task created')
      setOpen(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const completeTask = async (id) => {
    try {
      await tasksApi.complete(id)
      toast.success('Task completed')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const onDelete = async () => {
    setSaving(true)
    try {
      await tasksApi.remove(deleteId)
      toast.success('Task deleted')
      setDeleteId(null)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const isOverdue = (task) => {
    if (!task.dueDateTime || task.status === 'COMPLETED') return false
    try {
      return isBefore(parseISO(task.dueDateTime), new Date())
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-ink-muted">Kanban-style board with filters and progress.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">Overall progress</p>
            <p className="text-sm font-medium">{progressPct}%</p>
          </div>
          <Progress value={progressPct} />
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <Input
            className="pl-9"
            placeholder="Search tasks…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
        </Select>
        <Select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </Select>
        <Select value={filters.subjectId} onChange={(e) => setFilters((f) => ({ ...f, subjectId: e.target.value }))}>
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="Create a task or clear filters."
          actionLabel="Add task"
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ['PENDING', 'Pending'],
            ['IN_PROGRESS', 'In Progress'],
            ['COMPLETED', 'Completed'],
          ].map(([key, label]) => (
            <Card key={key} className="bg-surface-muted/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  {label}
                  <Badge variant="secondary">{columns[key]?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(columns[key] || []).map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-xl border bg-surface-elevated p-3 shadow-sm ${
                      isOverdue(task) ? 'border-red-300 dark:border-red-800' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{task.description}</p>
                      </div>
                      <Badge variant={priorityVariant[task.priority] || 'secondary'}>{task.priority}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                      {(task.subjectName || task.subject?.name) && (
                        <span>{task.subjectName || task.subject?.name}</span>
                      )}
                      {task.dueDateTime && (
                        <span className={isOverdue(task) ? 'font-medium text-red-600' : ''}>
                          Due {format(new Date(task.dueDateTime), 'MMM d, HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-1">
                      {task.status !== 'COMPLETED' && (
                        <Button size="sm" variant="secondary" onClick={() => completeTask(task.id)}>
                          Complete
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openEdit(task)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(task.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="relative max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit task' : 'New task'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register('title', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
                <Label>Due</Label>
                <Input type="datetime-local" {...register('dueDateTime')} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select {...register('priority')}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select {...register('status')}>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estimated minutes</Label>
                <Input type="number" min="0" {...register('estimatedDurationMinutes')} />
              </div>
              <div className="space-y-2">
                <Label>Actual minutes</Label>
                <Input type="number" min="0" {...register('actualDurationMinutes')} />
              </div>
            </div>
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
        title="Delete task?"
        description="This task will be permanently removed."
        confirmLabel="Delete"
        destructive
        loading={saving}
        onConfirm={onDelete}
      />
    </div>
  )
}
