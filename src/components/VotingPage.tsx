import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateFingerprint } from '../utils/fingerprint';
import { Music, CheckCircle2, XCircle } from 'lucide-react';

export default function VotingPage() {
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [error, setError] = useState(null);

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

  async function handleVote(verseNumber) {
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
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-600/10 flex items-center justify-center mx-auto mb-6">
            <Music className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Aucune manche active</h1>
          <p className="text-white/50 text-base">Revenez bientôt pour voter sur le prochain battle</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-8 pb-6 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-8 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-wide">RAMASS TA PROD</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            {round.name}
          </h1>
          <p className="text-lg sm:text-xl text-white/50 font-medium">Votez pour votre couplet préféré</p>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          
          {/* Error message */}
          {error && (
            <div className="mb-6 p-5 rounded-3xl bg-red-600/10 border border-red-600/20 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 pt-1.5">
                  <p className="text-sm font-semibold text-white mb-0.5">Erreur</p>
                  <p className="text-sm text-white/70">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success state */}
          {hasVoted ? (
            <div className="rounded-[32px] bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 p-8 sm:p-12 text-center backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-500">
              <div className="relative inline-flex mb-8">
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h3 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">Vote enregistré</h3>
              <p className="text-white/60 text-base mb-6">
                Vous avez voté pour le
              </p>
              
              <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-600/30">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-lg">
                  {selectedVerse}
                </div>
                <span className="font-bold text-lg">Couplet {selectedVerse}</span>
              </div>
              
              <p className="text-white/40 text-sm mt-8 font-medium">Merci de votre participation</p>
            </div>
          ) : (
            <>
              {/* Voting cards */}
              <div className="grid grid-cols-1 gap-4 mb-6">
                {[1, 2, 3].map((verseNumber) => (
                  <button
                    key={verseNumber}
                    onClick={() => handleVote(verseNumber)}
                    disabled={voting}
                    className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 p-6 transition-all duration-500 active:scale-[0.97] hover:border-red-600/50 hover:shadow-2xl hover:shadow-red-600/20 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {/* Animated gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 via-red-600/0 to-red-600/0 opacity-0 group-hover:from-red-600/10 group-hover:via-red-600/5 group-hover:to-transparent group-hover:opacity-100 transition-all duration-700" />
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-600/30 rounded-full blur-3xl" />
                    </div>
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        {/* Number badge */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-red-600/40 rounded-[20px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] bg-gradient-to-br from-red-600 via-red-600 to-red-700 flex items-center justify-center font-black text-3xl sm:text-4xl shadow-xl shadow-red-600/40 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                            {verseNumber}
                          </div>
                        </div>
                        
                        <div className="text-left">
                          <p className="text-xl sm:text-2xl font-bold tracking-tight mb-1 transition-colors duration-300 group-hover:text-red-400">
                            Couplet {verseNumber}
                          </p>
                          <p className="text-white/40 text-sm font-medium group-hover:text-white/60 transition-colors duration-300">
                            Appuyez pour voter
                          </p>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <div className="hidden sm:block">
                        <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center transition-all duration-500 group-hover:border-red-600/40 group-hover:bg-red-600/10 group-hover:scale-110">
                          <svg className="w-5 h-5 text-white/30 transition-all duration-500 group-hover:text-red-500 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Info footer */}
              <div className="text-center pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                  <p className="text-white/50 text-xs font-medium">
                    Un seul vote par manche
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom safe area */}
      <div className="h-12" />
    </div>
  );
}