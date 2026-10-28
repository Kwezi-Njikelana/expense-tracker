import { type RegisterInput, registerSchema } from '@expense-tracker/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { AuthLayout } from '@/components/auth/auth-layout';
import { FormField } from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { useRegister } from '@/hooks/use-auth';

export function RegisterPage() {
  const register = useRegister();
  const form = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => register.mutate(values));

  return (
    <AuthLayout title="Create your account" description="Start tracking your spending in under a minute.">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        {register.error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {register.error.message}
          </p>
        )}
        <FormField id="name" label="Name" autoComplete="name" error={errors.name?.message} {...form.register('name')} />
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <Button type="submit" size="lg" disabled={register.isPending}>
          {register.isPending && <Loader2 className="animate-spin" />}
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
