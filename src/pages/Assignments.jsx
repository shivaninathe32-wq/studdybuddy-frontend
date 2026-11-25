import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { format, formatDistanceToNowStrict, isBefore, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { assignmentsApi } from '@/api/assignments'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'

const emptyForm = {
  title: '',
  description: '',
  subjectId: '',
  dueDateTime: '',
  priority: 'MEDIUM',
  submissionStatus: 'PENDING',
  submissionNotes: '',
}

function deriveStatus(item) {
  if (item.submissionStatus === 'SUBMITTED') return 'SUBMITTED'
  if (item.submissionStatus === 'OVERDUE') return 'OVERDUE'
  if (item.dueDateTime && isBefore(parseISO(item.dueDateTime), new Date()) && item.submissionStatus !== 'SUBMITTED') {
    return 'OVERDUE'
  }
  return item.submissionStatus || 'PENDING'
}

export default function Assignments() {
  const [items, setItems] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyForm })

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter === 'upcoming') params.filter = 'upcoming'
      if (filter === 'submitted') params.filter = 'submitted'
      if (filter === 'overdue') params.filter = 'overdue'
      const [a, s] = await Promise.all([assignmentsApi.list(params), subjectsApi.list()])
      setItems(unwrapList(a.data))
      setSubjects(unwrapList(s.data))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filter])

  const openCreate = () => {
    setEditing(null)
    reset({ ...emptyForm, subjectId: subjects[0]?.id ? String(subjects[0].id) : '' })
    setOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    reset({
      title: item.title || '',
      description: item.description || '',
      subjectId: String(item.subjectId || item.subject?.id || ''),
      dueDateTime: item.dueDateTime ? format(new Date(item.dueDateTime), "yyyy-MM-dd'T'HH:mm") : '',
      priority: item.priority || 'MEDIUM',
      submissionStatus: item.submissionStatus || 'PENDING',
      submissionNotes: item.submissionNotes || '',
    })
    setOpen(true)
  }

  const onSubmit = async (values) => {
    setSaving(true)
    try {
      const payload = {
        title: values.title,
        description: values.description,
        subjectId: Number(values.subjectId),
        dueDateTime: values.dueDateTime || null,
        priority: values.priority,
        submissionStatus: values.submissionStatus,
        submissionNotes: values.submissionNotes,
      }
      if (editing) await assignmentsApi.update(editing.id, payload)
      else await assignmentsApi.create(payload)
      toast.success(editing ? 'Assignment updated' : 'Assignment created')
      setOpen(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    setSaving(true)
    try {
      await assignmentsApi.remove(deleteId)
      toast.success('Assignment deleted')
      setDeleteId(null)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Assignments</h1>
          <p className="text-sm text-ink-muted">Track due dates, remaining time, and submissions.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add assignment
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments"
          description="Add coursework deadlines to stay ahead."
          actionLabel="Add assignment"
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const status = deriveStatus(item)
            const overdue = status === 'OVERDUE'
            let remaining = '—'
            if (item.dueDateTime) {
              try {
                remaining = isBefore(parseISO(item.dueDateTime), new Date())
                  ? `Overdue by ${formatDistanceToNowStrict(parseISO(item.dueDateTime))}`
                  : `${formatDistanceToNowStrict(parseISO(item.dueDateTime))} left`
              } catch {
                remaining = '—'
              }
            }
            return (
              <Card key={item.id} className={overdue ? 'border-red-300 dark:border-red-800' : ''}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <p className="mt-1 text-xs text-ink-subtle">
                      {item.subjectName || item.subject?.name || 'Subject'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-ink-muted">{item.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={status === 'SUBMITTED' ? 'success' : overdue ? 'danger' : 'warning'}>
                      {status}
                    </Badge>
                    <Badge variant="secondary">{item.priority}</Badge>
                    {item.dueDateTime && (
                      <Badge variant="outline">{format(new Date(item.dueDateTime), 'MMM d, HH:mm')}</Badge>
                    )}
                  </div>
                  <p className={`text-sm ${overdue ? 'text-red-600' : 'text-ink-muted'}`}>{remaining}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="relative max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit assignment' : 'New assignment'}</DialogTitle>
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
                <Select {...register('subjectId', { required: true })}>
                  <option value="">Select…</option>
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
                <Select {...register('submissionStatus')}>
                  <option value="PENDING">Pending</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="OVERDUE">Overdue</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Submission notes</Label>
              <Textarea {...register('submissionNotes')} rows={2} />
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
        title="Delete assignment?"
        description="This assignment will be permanently removed."
        confirmLabel="Delete"
        destructive
        loading={saving}
        onConfirm={onDelete}
      />
    </div>
  )
}
