import { Brand } from '@/components/brand';
import { MarbleTexture } from './marble-texture';

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden p-4 sm:p-8">
      <MarbleTexture className="-z-10" />

      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-card p-2 shadow-2xl shadow-black/40 lg:min-h-[600px] lg:grid-cols-2">
        <aside className="relative isolate hidden overflow-hidden rounded-2xl p-10 text-white lg:flex lg:flex-col">
          <MarbleTexture seed={11} className="-z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
          <Brand className="[&>span]:bg-white/15 [&>span]:backdrop-blur" />
          <div className="mt-auto space-y-4">
            <h2 className="text-4xl leading-[1.05] font-bold tracking-tight uppercase">
              Know where
              <br />
              every rand
              <br />
              goes.
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-white/80">
              Track your spending, see it broken down by category and month, and spot where your money really goes.
            </p>
            <p className="text-sm text-white/80">Your budget, finally under control.</p>
          </div>
        </aside>

        <main className="flex flex-col px-6 py-8 sm:px-12 lg:py-10">
          <Brand className="lg:hidden" />
          <div className="m-auto w-full max-w-sm py-8">
            <div className="mb-8 space-y-2">
              <h1 className="text-2xl font-bold tracking-tight uppercase">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
