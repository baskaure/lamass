import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import VotingPage from './components/VotingPage';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        setIsAdmin(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAdmin(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Chargement...</div>
      </div>
    );
  }

  const currentPath = window.location.pathname;

  if (currentPath === '/admin') {
    if (!isAuthenticated) {
      return <Login onLoginSuccess={() => setIsAdmin(true)} />;
    }
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
          >
            Déconnexion
          </button>
        </div>
        <AdminDashboard />
      </div>
    );
  }

  return <VotingPage />;
}

export default App;
