import { useAuthStore } from './store/useAuthStore';
import { JoinForm } from './features/JoinForm';
import { ChatRoom } from './features/ChatRoom'; 

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-slate-900">
      {!user ? <JoinForm /> : <ChatRoom />}
    </div>
  );
}

export default App;