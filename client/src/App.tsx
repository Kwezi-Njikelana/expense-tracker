import { createBrowserRouter, RouterProvider } from 'react-router';
import { GuestOnly, RequireAuth } from '@/components/auth/route-guards';
import { FullPageSpinner } from '@/components/full-page-spinner';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/pages/login-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { RegisterPage } from '@/pages/register-page';

const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/',
    element: <RequireAuth />,
    HydrateFallback: FullPageSpinner,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Lazy-loaded so the charting library isn't in the login bundle.
          {
            index: true,
            lazy: () => import('@/pages/dashboard-page').then((m) => ({ Component: m.DashboardPage })),
          },
          {
            path: 'transactions',
            lazy: () => import('@/pages/transactions-page').then((m) => ({ Component: m.TransactionsPage })),
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
