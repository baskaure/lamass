import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Music } from 'lucide-react';

type LoginProps = {
  onLoginSuccess: () => void;
};

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Music className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            RAP BATTLE
          </h1>
          <p className="text-gray-300 text-lg">Admin Dashboard</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 border-2 border-red-500/50">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Lock className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-white">Connexion Admin</h2>
          </div>

          {error && (
            <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-3 mb-6">
              <p className="text-red-200 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border-2 border-gray-600 focus:border-red-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border-2 border-gray-600 focus:border-red-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
