import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Pin, Plus, Search, StickyNote, Trash2 } from 'lucide-react'
import { notesApi } from '@/api/notes'
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
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [subjectFilter, setSubjectFilter] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle')
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef(null)
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: { title: '', content: '', subjectId: '', pinned: false },
  })

  const selected = notes.find((n) => n.id === selectedId) || null
  const title = watch('title')
  const content = watch('content')
  const subjectId = watch('subjectId')
  const pinned = watch('pinned')

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (query) params.q = query
      if (pinnedOnly) params.pinned = true
      if (subjectFilter) params.subjectId = subjectFilter
      const [n, s] = await Promise.all([notesApi.list(params), subjectsApi.list()])
      const list = unwrapList(n.data).sort((a, b) => Number(b.pinned) - Number(a.pinned))
      setNotes(list)
      setSubjects(unwrapList(s.data))
      if (list.length && !selectedId) {
        setSelectedId(list[0].id)
        hydrate(list[0])
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const hydrate = (note) => {
    reset({
      title: note?.title || '',
      content: note?.content || '',
      subjectId: note?.subjectId || note?.subject?.id || '',
      pinned: Boolean(note?.pinned),
    })
    setSaveStatus('idle')
  }

  useEffect(() => {
    load()
  }, [pinnedOnly, subjectFilter])

  useEffect(() => {
    if (!selectedId) return undefined
    if (timerRef.current) clearTimeout(timerRef.current)
    setSaveStatus('pending')
    timerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving')
        await notesApi.update(selectedId, {
          title: title || 'Untitled',
          content,
          subjectId: subjectId ? Number(subjectId) : null,
          pinned: Boolean(pinned),
        })
        setNotes((prev) =>
          prev.map((n) =>
            n.id === selectedId
              ? {
                  ...n,
                  title: title || 'Untitled',
                  content,
                  subjectId: subjectId ? Number(subjectId) : null,
                  pinned: Boolean(pinned),
                }
              : n
          )
        )
        setSaveStatus('saved')
      } catch (err) {
        setSaveStatus('error')
        toast.error(getErrorMessage(err, 'Autosave failed'))
      }
    }, 700)
    return () => clearTimeout(timerRef.current)
  }, [title, content, subjectId, pinned, selectedId])

  const createNote = async () => {
    try {
      const { data } = await notesApi.create({
        title: 'Untitled note',
        content: '',
        pinned: false,
      })
      toast.success('Note created')
      await load()
      if (data?.id) {
        setSelectedId(data.id)
        hydrate(data)
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const onDelete = async () => {
    setSaving(true)
    try {
      await notesApi.remove(deleteId)
      toast.success('Note deleted')
      if (selectedId === deleteId) {
        setSelectedId(null)
        reset({ title: '', content: '', subjectId: '', pinned: false })
      }
      setDeleteId(null)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const statusLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? 'Saved'
        : saveStatus === 'pending'
          ? 'Unsaved changes'
          : saveStatus === 'error'
            ? 'Save failed'
            : ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notes</h1>
          <p className="text-sm text-ink-muted">Capture ideas with autosave and pins.</p>
        </div>
        <Button onClick={createNote}>
          <Plus className="h-4 w-4" /> New note
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <Input
            className="pl-9"
            placeholder="Search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={pinnedOnly}
          onChange={(e) => setPinnedOnly(e.target.checked)}
          className="rounded border-border"
        />
        Pinned only
      </label>

      {loading ? (
        <Skeleton className="h-96" />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Create a note and it will autosave as you type."
          actionLabel="New note"
          onAction={createNote}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card className="max-h-[70vh] overflow-y-auto">
            <CardContent className="space-y-1 p-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(note.id)
                    hydrate(note)
                  }}
                  className={`flex w-full flex-col rounded-xl px-3 py-2 text-left transition-colors ${
                    selectedId === note.id ? 'bg-brand-100 dark:bg-brand-900/40' : 'hover:bg-surface-muted'
                  }`}
                >
                  <span className="flex items-center gap-1 text-sm font-medium">
                    {note.pinned && <Pin className="h-3 w-3 text-brand-600" />}
                    {note.title || 'Untitled'}
                  </span>
                  <span className="truncate text-xs text-ink-subtle">{note.content || 'Empty note'}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Editor</CardTitle>
                <p className="text-xs text-ink-subtle">{statusLabel}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={pinned ? 'secondary' : 'outline'}
                  size="sm"
                  type="button"
                  onClick={() => setValue('pinned', !pinned)}
                >
                  <Pin className="h-3.5 w-3.5" /> {pinned ? 'Pinned' : 'Pin'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(selectedId)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selected ? (
                <form className="space-y-4" onSubmit={handleSubmit(() => {})}>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input {...register('title')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject (optional)</Label>
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
                    <Label>Content</Label>
                    <Textarea {...register('content')} rows={14} className="min-h-[280px]" />
                  </div>
                  {selected.updatedAt && (
                    <Badge variant="outline">
                      Updated {format(new Date(selected.updatedAt), 'MMM d, HH:mm')}
                    </Badge>
                  )}
                </form>
              ) : (
                <p className="text-sm text-ink-muted">Select a note to edit.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete note?"
        description="This note will be permanently removed."
        confirmLabel="Delete"
        destructive
        loading={saving}
        onConfirm={onDelete}
      />
    </div>
  )
}
