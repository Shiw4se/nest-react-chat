import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { JoinForm } from './features/JoinForm';
import { Dashboard } from './features/Dashboard';
import { useApplyTheme } from './hooks/useApplyTheme';

function App() {
  const user = useAuthStore((state) => state.user);
  useApplyTheme();

  return (
    <div className="min-h-dvh bg-slate-900">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-slate-800)',
            color: 'var(--color-slate-50)',
            border: '1px solid var(--color-slate-700)',
          },
          error: {
            style: {
              border: '1px solid #ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {!user ? <JoinForm /> : <Dashboard />}
    </div>
  );
}

export default App;
