import { useState, useEffect } from 'react';
import { supabase, type Round } from '../lib/supabase';
import { generateFingerprint } from '../utils/fingerprint';
import { Music, CheckCircle2, XCircle } from 'lucide-react';

export default function VotingPage() {
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveRound();
  }, []);

  async function loadActiveRound() {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      setRound(data);

      if (data) {
        const fingerprint = generateFingerprint();
        const localStorageKey = `voted_round_${data.id}`;
        const hasVotedLocally = localStorage.getItem(localStorageKey) === 'true';

        if (hasVotedLocally) {
          setHasVoted(true);
        } else {
          const { data: existingVote } = await supabase
            .from('votes')
            .select('verse_number')
            .eq('round_id', data.id)
            .eq('voter_fingerprint', fingerprint)
            .maybeSingle();

          if (existingVote) {
            setHasVoted(true);
            setSelectedVerse(existingVote.verse_number);
            localStorage.setItem(localStorageKey, 'true');
          }
        }
      }
    } catch (err) {
      console.error('Error loading round:', err);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(verseNumber: number) {
    if (!round || hasVoted) return;

    setVoting(true);
    setError(null);

    try {
      const fingerprint = generateFingerprint();

      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          round_id: round.id,
          verse_number: verseNumber,
          voter_fingerprint: fingerprint,
        });

      if (voteError) {
        if (voteError.code === '23505') {
          setError('Vous avez déjà voté pour cette manche');
          setHasVoted(true);
        } else {
          throw voteError;
        }
      } else {
        setHasVoted(true);
        setSelectedVerse(verseNumber);
        localStorage.setItem(`voted_round_${round.id}`, 'true');
      }
    } catch (err) {
      console.error('Error voting:', err);
      setError('Erreur lors du vote');
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-2xl">Chargement...</div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center px-4">
        <div className="text-center">
          <Music className="w-24 h-24 text-red-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Aucune manche active</h1>
          <p className="text-gray-300 text-xl">Revenez bientôt pour voter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <Music className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
            RAP BATTLE
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-red-500 mb-2">
            {round.name}
          </h2>
          <p className="text-gray-300 text-lg">Votez pour votre couplet préféré</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        )}

        {hasVoted ? (
          <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">Vote enregistré !</h3>
            <p className="text-gray-300 text-lg">
              Vous avez voté pour le <span className="text-green-400 font-bold">Couplet {selectedVerse}</span>
            </p>
            <p className="text-gray-400 mt-4">Merci de votre participation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((verseNumber) => (
              <button
                key={verseNumber}
                onClick={() => handleVote(verseNumber)}
                disabled={voting}
                className="group relative bg-gradient-to-br from-gray-800 to-gray-900 hover:from-red-600 hover:to-red-800 border-4 border-red-500 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="text-center">
                  <div className="text-7xl font-black text-white mb-4 group-hover:scale-110 transition-transform">
                    {verseNumber}
                  </div>
                  <div className="text-xl font-bold text-red-500 group-hover:text-white transition-colors uppercase tracking-wider">
                    Couplet {verseNumber}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!hasVoted && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Vous ne pouvez voter qu'une seule fois par manche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
