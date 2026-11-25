import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { subjectsApi } from '@/api/subjects'
import { getErrorMessage, SUBJECT_COLORS, formatHours } from '@/lib/utils'
import { unwrapList } from '@/hooks/usePageList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'

const emptyForm = {
  name: '',
  code: '',
  description: '',
  targetHoursPerWeek: 5,
  color: SUBJECT_COLORS[0],
}

export default function Subjects() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, setValue, watch } = useForm({ defaultValues: emptyForm })
  const color = watch('color')

  const load = async (q = query) => {
    setLoading(true)
    try {
      const { data } = await subjectsApi.list(q ? { q } : undefined)
      setItems(unwrapList(data))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    )
  }, [items, query])

  const openCreate = () => {
    setEditing(null)
    reset({ ...emptyForm, color: SUBJECT_COLORS[items.length % SUBJECT_COLORS.length] })
    setOpen(true)
  }

  const openEdit = (subject) => {
    setEditing(subject)
    reset({
      name: subject.name || '',
      code: subject.code || '',
      description: subject.description || '',
      targetHoursPerWeek: subject.targetHoursPerWeek ?? 5,
      color: subject.color || SUBJECT_COLORS[0],
    })
    setOpen(true)
  }

  const onSubmit = async (values) => {
    setSaving(true)
    try {
      const payload = {
        ...values,
        targetHoursPerWeek: Number(values.targetHoursPerWeek) || 0,
      }
      if (editing) await subjectsApi.update(editing.id, payload)
      else await subjectsApi.create(payload)
      toast.success(editing ? 'Subject updated' : 'Subject created')
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
      await subjectsApi.remove(deleteId)
      toast.success('Subject deleted')
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
          <h1 className="font-display text-2xl font-semibold">Subjects</h1>
          <p className="text-sm text-ink-muted">Organize courses and track planned vs actual hours.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add subject
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <Input
          className="pl-9"
          placeholder="Search subjects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(e.currentTarget.value)}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Add your first subject to start planning study time."
          actionLabel="Add subject"
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((subject) => {
            const planned = Number(subject.targetHoursPerWeek ?? 0)
            const actual = Number(subject.actualHours ?? subject.actualHoursThisWeek ?? subject.hoursThisWeek ?? 0)
            const pct = planned > 0 ? Math.min(100, (actual / planned) * 100) : 0
            return (
              <Card key={subject.id} className="overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: subject.color || SUBJECT_COLORS[0] }} />
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{subject.name}</CardTitle>
                    {subject.code && (
                      <Badge variant="secondary" className="mt-2">
                        {subject.code}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(subject)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(subject.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-ink-muted">{subject.description || 'No description'}</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-ink-subtle">
                      <span>Planned {formatHours(planned)}/wk</span>
                      <span>Actual {formatHours(actual)}</span>
                    </div>
                    <Progress value={pct} indicatorClassName="bg-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="relative">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit subject' : 'New subject'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register('name', { required: true })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input {...register('code')} placeholder="CS101" />
              </div>
              <div className="space-y-2">
                <Label>Target hours / week</Label>
                <Input type="number" step="0.5" min="0" {...register('targetHoursPerWeek')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-ink' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setValue('color', c)}
                  />
                ))}
              </div>
              <input type="hidden" {...register('color')} />
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
        title="Delete subject?"
        description="This cannot be undone. Related sessions may fail if still linked."
        confirmLabel="Delete"
        destructive
        loading={saving}
        onConfirm={onDelete}
      />
    </div>
  )
}
