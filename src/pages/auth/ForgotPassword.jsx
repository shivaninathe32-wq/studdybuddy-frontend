import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { GraduationCap, KeyRound } from 'lucide-react'
import { authApi } from '@/api/auth'
import { getErrorMessage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } })

  const onSubmit = async (values) => {
    setSubmitting(true)
    setInfo(null)
    try {
      const { data } = await authApi.forgotPassword(values)
      const message =
        typeof data === 'string'
          ? data
          : data?.message || 'If that email exists, a reset token was generated.'
      setInfo(message)
      toast.success('Request submitted')
      if (data?.token || data?.resetToken) {
        setInfo(`${message} Demo token: ${data.token || data.resetToken}`)
      } else {
        setInfo(
          `${message} Email is not sent unless SMTP is configured — check the backend server logs for the reset token.`
        )
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-glow px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </Link>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We’ll generate a reset token for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
          {info && (
            <div className="mt-4 flex gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-100">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{info}</p>
            </div>
          )}
          <p className="mt-4 text-center text-sm text-ink-muted">
            <Link to="/login" className="font-medium text-brand-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
