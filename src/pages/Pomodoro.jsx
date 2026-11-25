import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { pomodoroApi } from '@/api/pomodoro'
import { subjectsApi } from '@/api/subjects'
import { tasksApi } from '@/api/tasks'
import { getErrorMessage } from '@/lib/utils'
import { unwrapList } from '@/hooks/usePageList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

const STORAGE_KEY = 'studyflow_pomodoro_ui'
const COMPLETED_KEY = 'studyflow_pomodoro_saved'

function loadState() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

function saveState(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function wasSaved(clientSessionId) {
  try {
    const set = JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]')
    return set.includes(clientSessionId)
  } catch {
    return false
  }
}

function markSaved(clientSessionId) {
  try {
    const set = JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]')
    if (!set.includes(clientSessionId)) {
      set.push(clientSessionId)
      localStorage.setItem(COMPLETED_KEY, JSON.stringify(set.slice(-50)))
    }
  } catch {
    /* ignore */
  }
}

function createClientId() {
  return `pomo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export default function Pomodoro() {
  const saved = loadState()
  const [focusMin, setFocusMin] = useState(saved?.focusMin ?? 25)
  const [shortMin, setShortMin] = useState(saved?.shortMin ?? 5)
  const [longMin, setLongMin] = useState(saved?.longMin ?? 15)
  const [mode, setMode] = useState(saved?.mode ?? 'FOCUS')
  const [secondsLeft, setSecondsLeft] = useState(saved?.secondsLeft ?? 25 * 60)
  const [running, setRunning] = useState(false)
  const [cycles, setCycles] = useState(saved?.cycles ?? 0)
  const [muted, setMuted] = useState(saved?.muted ?? false)
  const [subjectId, setSubjectId] = useState(saved?.subjectId ?? '')
  const [taskId, setTaskId] = useState(saved?.taskId ?? '')
  const [subjects, setSubjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [summary, setSummary] = useState(null)
  const [clientSessionId, setClientSessionId] = useState(saved?.clientSessionId ?? createClientId())
  const [startedAt, setStartedAt] = useState(saved?.startedAt ?? null)
  const tickRef = useRef(null)
  const completingRef = useRef(false)

  const totalSeconds = useMemo(() => {
    if (mode === 'SHORT_BREAK') return shortMin * 60
    if (mode === 'LONG_BREAK') return longMin * 60
    return focusMin * 60
  }, [mode, focusMin, shortMin, longMin])

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0

  useEffect(() => {
    ;(async () => {
      try {
        const [s, t, sum] = await Promise.all([
          subjectsApi.list(),
          tasksApi.list({ status: 'PENDING' }),
          pomodoroApi.summary().catch(() => ({ data: null })),
        ])
        setSubjects(unwrapList(s.data))
        setTasks(unwrapList(t.data))
        setSummary(sum.data)
      } catch (err) {
        toast.error(getErrorMessage(err))
      }
    })()
  }, [])

  useEffect(() => {
    saveState({
      focusMin,
      shortMin,
      longMin,
      mode,
      secondsLeft,
      cycles,
      muted,
      subjectId,
      taskId,
      clientSessionId,
      startedAt,
      running: false,
    })
  }, [focusMin, shortMin, longMin, mode, secondsLeft, cycles, muted, subjectId, taskId, clientSessionId, startedAt])

  const playChime = useCallback(() => {
    if (muted) return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.value = 0.05
      osc.start()
      setTimeout(() => {
        osc.stop()
        ctx.close()
      }, 350)
    } catch {
      /* ignore */
    }
  }, [muted])

  const persistCompletion = useCallback(
    async (completedMode, planned, actual) => {
      if (completedMode !== 'FOCUS') return
      if (wasSaved(clientSessionId) || completingRef.current) return
      completingRef.current = true
      try {
        await pomodoroApi.createSession({
          mode: 'FOCUS',
          plannedDurationMinutes: planned,
          actualDurationMinutes: actual,
          subjectId: subjectId ? Number(subjectId) : null,
          taskId: taskId ? Number(taskId) : null,
          clientSessionId,
        })
        markSaved(clientSessionId)
        const { data } = await pomodoroApi.summary().catch(() => ({ data: null }))
        if (data) setSummary(data)
        toast.success('Focus session saved')
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not save pomodoro session'))
      } finally {
        completingRef.current = false
      }
    },
    [clientSessionId, subjectId, taskId]
  )

  const advance = useCallback(async () => {
    playChime()
    const planned = Math.round(totalSeconds / 60)
    const actual = Math.max(1, Math.round((totalSeconds - Math.max(0, secondsLeft)) / 60) || planned)
    const completedMode = mode

    if (completedMode === 'FOCUS') {
      await persistCompletion(completedMode, planned, actual)
      const nextCycles = cycles + 1
      setCycles(nextCycles)
      if (nextCycles % 4 === 0) {
        setMode('LONG_BREAK')
        setSecondsLeft(longMin * 60)
      } else {
        setMode('SHORT_BREAK')
        setSecondsLeft(shortMin * 60)
      }
    } else {
      setMode('FOCUS')
      setSecondsLeft(focusMin * 60)
    }
    setClientSessionId(createClientId())
    setStartedAt(null)
    setRunning(false)
  }, [playChime, totalSeconds, secondsLeft, mode, persistCompletion, cycles, longMin, shortMin, focusMin])

  useEffect(() => {
    if (!running) {
      if (tickRef.current) clearInterval(tickRef.current)
      return undefined
    }
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current)
          setTimeout(() => advance(), 0)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [running, advance])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  const radius = 96
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const applyDurations = () => {
    if (running) return
    if (mode === 'FOCUS') setSecondsLeft(focusMin * 60)
    if (mode === 'SHORT_BREAK') setSecondsLeft(shortMin * 60)
    if (mode === 'LONG_BREAK') setSecondsLeft(longMin * 60)
    setClientSessionId(createClientId())
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Pomodoro</h1>
        <p className="text-sm text-ink-muted">Focus cycles with long break after every 4 sessions.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <div className="flex gap-2">
            {['FOCUS', 'SHORT_BREAK', 'LONG_BREAK'].map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? 'default' : 'outline'}
                disabled={running}
                onClick={() => {
                  setMode(m)
                  setSecondsLeft(
                    (m === 'FOCUS' ? focusMin : m === 'SHORT_BREAK' ? shortMin : longMin) * 60
                  )
                  setClientSessionId(createClientId())
                }}
              >
                {m === 'FOCUS' ? 'Focus' : m === 'SHORT_BREAK' ? 'Short break' : 'Long break'}
              </Button>
            ))}
          </div>

          <div className="relative h-56 w-56">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r={radius} strokeWidth="10" className="fill-none stroke-brand-100 dark:stroke-brand-950" />
              <circle
                cx="110"
                cy="110"
                r={radius}
                strokeWidth="10"
                strokeLinecap="round"
                className="fill-none stroke-brand-500 transition-[stroke-dashoffset] duration-300"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-5xl font-semibold tracking-tight">
                {mm}:{ss}
              </p>
              <Badge className="mt-2" variant="secondary">
                Cycle {cycles % 4}/4 · Total {cycles}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {!running ? (
              <Button
                onClick={() => {
                  setRunning(true)
                  setStartedAt(startedAt || Date.now())
                }}
              >
                <Play className="h-4 w-4" /> {startedAt ? 'Resume' : 'Start'}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setRunning(false)}>
                <Pause className="h-4 w-4" /> Pause
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setRunning(false)
                setSecondsLeft(totalSeconds)
                setStartedAt(null)
                setClientSessionId(createClientId())
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button variant="ghost" onClick={() => setMuted((m) => !m)}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {muted ? 'Muted' : 'Sound on'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
            <CardDescription>Durations in minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Focus</Label>
                <Input
                  type="number"
                  min="1"
                  value={focusMin}
                  disabled={running}
                  onChange={(e) => setFocusMin(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Short</Label>
                <Input
                  type="number"
                  min="1"
                  value={shortMin}
                  disabled={running}
                  onChange={(e) => setShortMin(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Long</Label>
                <Input
                  type="number"
                  min="1"
                  value={longMin}
                  disabled={running}
                  onChange={(e) => setLongMin(Number(e.target.value) || 1)}
                />
              </div>
            </div>
            <Button variant="outline" disabled={running} onClick={applyDurations}>
              Apply durations
            </Button>
            <div className="flex items-center justify-between">
              <Label htmlFor="mute">Mute sound</Label>
              <Switch id="mute" checked={muted} onCheckedChange={setMuted} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Associate</CardTitle>
            <CardDescription>Optional subject / task for focus logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={running}>
                <option value="">None</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Task</Label>
              <Select value={taskId} onChange={(e) => setTaskId(e.target.value)} disabled={running}>
                <option value="">None</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </div>
            {summary && (
              <p className="text-sm text-ink-muted">
                Summary: {summary.totalSessions ?? summary.completedFocusSessions ?? '—'} focus sessions ·{' '}
                {summary.totalFocusMinutes ?? summary.totalMinutes ?? '—'} min
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
