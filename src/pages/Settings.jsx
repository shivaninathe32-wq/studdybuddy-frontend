import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Moon, Sun, User } from 'lucide-react'
import { profileApi } from '@/api/profile'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { getErrorMessage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export default function Settings() {
  const { refreshUser } = useAuth()
  const { isDark, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const profileForm = useForm({
    defaultValues: { fullName: '', educationLevel: '', email: '' },
  })
  const passwordForm = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await profileApi.get()
        profileForm.reset({
          fullName: data.fullName || '',
          educationLevel: data.educationLevel || '',
          email: data.email || '',
        })
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const onSaveProfile = async (values) => {
    setSavingProfile(true)
    try {
      await profileApi.update({
        fullName: values.fullName,
        educationLevel: values.educationLevel || null,
      })
      await refreshUser()
      toast.success('Profile updated')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSavingProfile(false)
    }
  }

  const onChangePassword = async (values) => {
    setSavingPassword(true)
    try {
      await profileApi.update({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      passwordForm.reset()
      toast.success('Password changed')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-ink-muted">Profile, password, and appearance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-brand-600" /> Profile
          </CardTitle>
          <CardDescription>Update how you appear across StudyFlow.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={profileForm.handleSubmit(onSaveProfile)}>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...profileForm.register('email')} disabled />
            </div>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input {...profileForm.register('fullName', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Education level</Label>
              <Select {...profileForm.register('educationLevel')}>
                <option value="">Select…</option>
                <option value="High School">High School</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Graduate">Graduate</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={passwordForm.handleSubmit(onChangePassword)}>
            <div className="space-y-2">
              <Label>Current password</Label>
              <Input type="password" {...passwordForm.register('currentPassword', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>New password</Label>
              <Input
                type="password"
                {...passwordForm.register('newPassword', {
                  required: true,
                  minLength: { value: 6, message: 'Min 6 characters' },
                })}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirm new password</Label>
              <Input
                type="password"
                {...passwordForm.register('confirmPassword', {
                  required: true,
                  validate: (v) => v === passwordForm.watch('newPassword') || 'Passwords do not match',
                })}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Light and dark mode preference is saved on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <div>
                <p className="text-sm font-medium">Dark mode</p>
                <p className="text-xs text-ink-subtle">Use a dimmer palette for late-night study</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')} />
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-ink-subtle">Theme preference key: studyflow_theme</p>
        </CardContent>
      </Card>
    </div>
  )
}
