import { useMemo, useState, useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SkillSwapPage from './pages/SkillSwapPage.jsx';
import UserProfile from './components/UserProfile.jsx';

const STORAGE_KEY = 'skillswap.current_user';
const DARK_KEY = 'skillswap.dark_mode';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ProtectedRoute({ currentUser, children }) {
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(DARK_KEY) === 'true');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem(DARK_KEY, String(next));
      return next;
    });
  };

  const defaultTerm = useMemo(() => {
    const v = import.meta.env.VITE_UF_DEFAULT_TERM;
    return typeof v === 'string' && v.trim() ? v.trim() : '2261';
  }, []);

  const setUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  };

  const clearUser = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <BrowserRouter>
      <div className="min-vh-100 d-flex flex-column">
        <Navbar currentUser={currentUser} onLogout={clearUser} darkMode={darkMode} onToggleDark={toggleDark} />
        <main className="container py-3 flex-grow-1">
          <Routes>
            <Route
              path="/login"
              element={
                currentUser ? (
                  <Navigate to="/skill-swap" replace />
                ) : (
                  <LoginPage onLogin={setUser} />
                )
              }
            />
            <Route
              path="/signup"
              element={
                currentUser ? (
                  <Navigate to="/skill-swap" replace />
                ) : (
                  <SignupPage onSignup={setUser} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute currentUser={currentUser}>
                  <DashboardPage currentUser={currentUser} defaultTerm={defaultTerm} />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/skill-swap"
              element={(
                <ProtectedRoute currentUser={currentUser}>
                  <SkillSwapPage currentUser={currentUser} defaultTerm={defaultTerm} />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/user/:userId"
              element={(
                <ProtectedRoute currentUser={currentUser}>
                  <UserProfile currentUser={currentUser} />
                </ProtectedRoute>
              )}
            />
            
            <Route
              path="*"
              element={<Navigate to={currentUser ? '/skill-swap' : '/login'} replace />}
            />

          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}