import { useState, useEffect } from 'react';
import { supabase, type Round } from '../lib/supabase';
import { Music, BarChart3, Plus, Power, Trash2, Eye, EyeOff } from 'lucide-react';

type VoteCount = {
  verse_number: number;
  count: number;
};

type RoundWithVotes = Round & {
  votes: VoteCount[];
  totalVotes: number;
};

export default function AdminDashboard() {
  const [rounds, setRounds] = useState<RoundWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoundName, setNewRoundName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRounds();
  }, []);

  async function loadRounds() {
    try {
      const { data: roundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .order('created_at', { ascending: false });

      if (roundsError) throw roundsError;

      const roundsWithVotes = await Promise.all(
        (roundsData || []).map(async (round) => {
          const { data: votesData } = await supabase
            .from('votes')
            .select('verse_number')
            .eq('round_id', round.id);

          const voteCounts = [1, 2, 3].map(verseNumber => ({
            verse_number: verseNumber,
            count: (votesData || []).filter(v => v.verse_number === verseNumber).length,
          }));

          return {
            ...round,
            votes: voteCounts,
            totalVotes: votesData?.length || 0,
          };
        })
      );

      setRounds(roundsWithVotes);
    } catch (err) {
      console.error('Error loading rounds:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createRound() {
    if (!newRoundName.trim()) return;

    setCreating(true);
    try {
      const { error } = await supabase
        .from('rounds')
        .insert({
          name: newRoundName,
          is_active: false,
        });

      if (error) throw error;

      setNewRoundName('');
      loadRounds();
    } catch (err) {
      console.error('Error creating round:', err);
    } finally {
      setCreating(false);
    }
  }

  async function toggleRoundActive(roundId: string, currentlyActive: boolean) {
    try {
      if (!currentlyActive) {
        await supabase
          .from('rounds')
          .update({ is_active: false })
          .neq('id', roundId);
      }

      const { error } = await supabase
        .from('rounds')
        .update({ is_active: !currentlyActive })
        .eq('id', roundId);

      if (error) throw error;

      loadRounds();
    } catch (err) {
      console.error('Error toggling round:', err);
    }
  }

  async function deleteRound(roundId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette manche ?')) return;

    try {
      const { error } = await supabase
        .from('rounds')
        .delete()
        .eq('id', roundId);

      if (error) throw error;

      loadRounds();
    } catch (err) {
      console.error('Error deleting round:', err);
    }
  }

  function getVotePercentage(votes: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Music className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-5xl font-black text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400 text-lg">Gérez les manches et consultez les résultats</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-8 border-2 border-red-500/50">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="w-6 h-6" />
            Créer une nouvelle manche
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newRoundName}
              onChange={(e) => setNewRoundName(e.target.value)}
              placeholder="Nom de la manche (ex: Manche 1)"
              className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border-2 border-gray-600 focus:border-red-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && createRound()}
            />
            <button
              onClick={createRound}
              disabled={creating || !newRoundName.trim()}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Créer
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {rounds.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center border-2 border-gray-700">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl">Aucune manche créée</p>
            </div>
          ) : (
            rounds.map((round) => (
              <div
                key={round.id}
                className={`bg-gray-800 rounded-xl p-6 border-2 ${
                  round.is_active ? 'border-green-500' : 'border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-bold text-white">{round.name}</h3>
                    {round.is_active && (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRoundActive(round.id, round.is_active)}
                      className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${
                        round.is_active
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {round.is_active ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4" />
                          Activer
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteRound(round.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="text-gray-300 text-lg mb-2">
                    Total des votes: <span className="text-white font-bold text-2xl">{round.totalVotes}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {round.votes.map((vote) => {
                    const percentage = getVotePercentage(vote.count, round.totalVotes);
                    return (
                      <div key={vote.verse_number} className="bg-gray-700 rounded-lg p-6">
                        <div className="text-center mb-4">
                          <div className="text-5xl font-black text-red-500 mb-2">
                            {vote.verse_number}
                          </div>
                          <div className="text-sm text-gray-400 uppercase tracking-wider">
                            Couplet {vote.verse_number}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-black text-white mb-2">
                            {vote.count}
                          </div>
                          <div className="text-lg font-bold text-red-400">
                            {percentage}%
                          </div>
                        </div>
                        <div className="mt-4 bg-gray-600 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-red-500 h-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 text-gray-400 text-sm">
                  Créée le: {new Date(round.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
