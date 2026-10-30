import { type LoginInput, loginSchema } from '@expense-tracker/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { AuthLayout } from '@/components/auth/auth-layout';
import { FormField } from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/hooks/use-auth';

const DEMO_ACCOUNT = { email: 'demo@example.com', password: 'password123' };

export function LoginPage() {
  const login = useLogin();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => login.mutate(values));

  return (
    <AuthLayout title="Welcome back!" description="Welcome back! Please enter your details.">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        {login.error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {login.error.message}
          </p>
        )}
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <Button type="submit" size="lg" disabled={login.isPending}>
          {login.isPending && <Loader2 className="animate-spin" />}
          Log in
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={login.isPending}
          onClick={() => login.mutate(DEMO_ACCOUNT)}
        >
          Try the demo account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don’t have an account?{' '}
        <Link to="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
