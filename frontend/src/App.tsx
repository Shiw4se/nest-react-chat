import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { JoinForm } from './features/JoinForm';
import { Dashboard } from './features/Dashboard';

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-slate-900">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
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
