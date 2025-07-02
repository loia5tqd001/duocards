import { Route, Routes } from 'react-router-dom';
import AddOrEditCard from './screens/AddCard';
import ReviewCard from './screens/ReviewCard';
import Home from './screens/Home';
import AuthCallback from './pages/auth/callback';
import { useAuthSync } from './hooks/useAuthSync';
import Login from './screens/Login';
import Notification from './components/ui/Notification';

function App() {
  // Initialize auth and sync logic
  useAuthSync();

  return (
    <>
      <Notification />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddOrEditCard />} />
        <Route path="/edit/:id" element={<AddOrEditCard />} />
        <Route path="/review" element={<ReviewCard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </>
  );
}

export default App;
