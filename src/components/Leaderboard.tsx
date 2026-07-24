import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Globe,
  MapPin,
  TrendingUp,
  RefreshCw,
  UserPlus,
  UserMinus,
  UserCheck,
  X,
  Check,
  Clock3,
  HeartHandshake,
} from 'lucide-react';

import chicoMascot from '../assets/images/chico_mascot_flat_vector_1784399850056.jpg';
import licoMascot from '../assets/images/lico_mascot_1784292046285.jpg';
import teddyMascot from '../assets/images/teddy_mascot_1784292056581.jpg';
import lunaMascot from '../assets/images/luna_mascot_1784292067117.jpg';

interface LeaderboardProps {
  userXp: number;
  userStreak: number;
  userState: string;
  userCountry: string;
}

interface Entry {
  id: string;
  name: string;
  xp: number;
  streak: number;
  state: string;
  country: string;
  avatarMascot: string;
  avatarUrl: string | null;
  isUser?: boolean;
}

type FriendshipStatus = 'none' | 'sent' | 'received' | 'friends';

interface SocialState {
  following: boolean;
  friendship: FriendshipStatus;
  friendshipId?: string;
}

const mascotImages: Record<string, string> = {
  chico: chicoMascot,
  lico: licoMascot,
  teddy: teddyMascot,
  luna: lunaMascot,
};

const emptySocial: SocialState = {
  following: false,
  friendship: 'none',
};

export default function Leaderboard({
  userXp,
  userStreak,
  userState,
  userCountry,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] =
    useState<'global' | 'regional' | 'pais'>('global');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [social, setSocial] = useState<Record<string, SocialState>>({});
  const [counts, setCounts] = useState<
    Record<string, { followers: number; following: number; friends: number }>
  >({});
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const renderAvatar = (entry: Entry, className: string) => {
    if (entry.avatarUrl) {
      return (
        <img
          src={entry.avatarUrl}
          alt={`Foto de ${entry.name}`}
          className={`${className} object-cover`}
          referrerPolicy="no-referrer"
        />
      );
    }

    const mascotImage = mascotImages[entry.avatarMascot];

    if (mascotImage) {
      return (
        <img
          src={mascotImage}
          alt={`Mascote de ${entry.name}`}
          className={`${className} object-cover`}
          referrerPolicy="no-referrer"
        />
      );
    }

    return (
      <div className={`${className} flex items-center justify-center text-xl`}>
        🎓
      </div>
    );
  };

  const loadSocial = async (userId: string) => {
    const [{ data: follows }, { data: friendships }] = await Promise.all([
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId),
      supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, status')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    ]);

    const next: Record<string, SocialState> = {};

    (follows || []).forEach((row: any) => {
      next[row.following_id] = {
        ...(next[row.following_id] || emptySocial),
        following: true,
      };
    });

    (friendships || []).forEach((row: any) => {
      const other =
        row.requester_id === userId ? row.addressee_id : row.requester_id;

      next[other] = {
        ...(next[other] || emptySocial),
        friendship:
          row.status === 'accepted'
            ? 'friends'
            : row.requester_id === userId
            ? 'sent'
            : 'received',
        friendshipId: row.id,
      };
    });

    setSocial(next);
  };

  const loadEntries = async () => {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id || null;
      setCurrentUserId(userId);

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, name, xp, streak, state, country, avatar_mascot, avatar_url, avatar_type, avatar_value'
        )
        .order('xp', { ascending: false });

      if (error) throw error;

      const mapped: Entry[] = (data || []).map((profile: any) => ({
        id: profile.id,
        name: profile.name || 'Estudante FALLA',
        xp: Number(profile.xp || 0),
        streak: Number(profile.streak || 0),
        state: profile.state || '—',
        country: profile.country || '—',
        avatarMascot:
          profile.avatar_mascot ||
          (profile.avatar_type === 'mascot' ? profile.avatar_value : null) ||
          'chico',
        avatarUrl:
          profile.avatar_url ||
          (profile.avatar_type === 'photo' ? profile.avatar_value : null) ||
          null,
        isUser: profile.id === userId,
      }));

      if (userId && !mapped.some(item => item.id === userId)) {
        mapped.push({
          id: userId,
          name: 'Você (Estudante)',
          xp: userXp,
          streak: userStreak,
          state: userState,
          country: userCountry,
          avatarMascot: 'chico',
          avatarUrl: null,
          isUser: true,
        });
      }

      mapped.sort((a, b) => b.xp - a.xp);
      setEntries(mapped);

      if (userId) await loadSocial(userId);
    } catch (error) {
      console.warn('Erro ao carregar o ranking:', error);
      setMessage(
        'Não foi possível carregar os perfis. Verifique o SQL do sistema social.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async (profileId: string) => {
    const [followers, following, requester, addressee] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileId),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileId),
      supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', profileId)
        .eq('status', 'accepted'),
      supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('addressee_id', profileId)
        .eq('status', 'accepted'),
    ]);

    setCounts(previous => ({
      ...previous,
      [profileId]: {
        followers: followers.count || 0,
        following: following.count || 0,
        friends: (requester.count || 0) + (addressee.count || 0),
      },
    }));
  };

  useEffect(() => {
    void loadEntries();
  }, [userXp, userStreak, userState, userCountry]);

  useEffect(() => {
    if (selected) void loadCounts(selected.id);
  }, [selected?.id]);

  const filtered = useMemo(
    () =>
      entries.filter(entry => {
        if (filterType === 'regional') {
          return (
            entry.state.toLowerCase() === userState.toLowerCase() ||
            entry.isUser
          );
        }

        if (filterType === 'pais') {
          return (
            entry.country
              .toLowerCase()
              .includes(userCountry.toLowerCase()) || entry.isUser
          );
        }

        return true;
      }),
    [entries, filterType, userCountry, userState]
  );

  const updateSocial = (profileId: string, update: Partial<SocialState>) => {
    setSocial(previous => ({
      ...previous,
      [profileId]: {
        ...(previous[profileId] || emptySocial),
        ...update,
      },
    }));
  };

  const toggleFollow = async (entry: Entry) => {
    if (!currentUserId) return;

    const state = social[entry.id] || emptySocial;
    setWorkingId(entry.id);

    try {
      if (state.following) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', entry.id);

        if (error) throw error;
        updateSocial(entry.id, { following: false });
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: entry.id,
        });

        if (error) throw error;
        updateSocial(entry.id, { following: true });
      }

      await loadCounts(entry.id);
    } catch (error: any) {
      setMessage(error?.message || 'Erro ao atualizar seguidor.');
    } finally {
      setWorkingId(null);
    }
  };

  const sendFriendRequest = async (entry: Entry) => {
    if (!currentUserId) return;
    setWorkingId(entry.id);

    try {
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: currentUserId,
          addressee_id: entry.id,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) throw error;

      updateSocial(entry.id, {
        friendship: 'sent',
        friendshipId: data.id,
      });
    } catch (error: any) {
      setMessage(error?.message || 'Erro ao enviar amizade.');
    } finally {
      setWorkingId(null);
    }
  };

  const acceptFriend = async (entry: Entry) => {
    const state = social[entry.id];
    if (!currentUserId || !state?.friendshipId) return;

    setWorkingId(entry.id);

    try {
      const { error } = await supabase
        .from('friendships')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.friendshipId)
        .eq('addressee_id', currentUserId);

      if (error) throw error;
      updateSocial(entry.id, { friendship: 'friends' });
      await loadCounts(entry.id);
    } catch (error: any) {
      setMessage(error?.message || 'Erro ao aceitar amizade.');
    } finally {
      setWorkingId(null);
    }
  };

  const removeFriendship = async (entry: Entry) => {
    const state = social[entry.id];
    if (!state?.friendshipId) return;

    setWorkingId(entry.id);

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', state.friendshipId);

      if (error) throw error;

      updateSocial(entry.id, {
        friendship: 'none',
        friendshipId: undefined,
      });

      await loadCounts(entry.id);
    } catch (error: any) {
      setMessage(error?.message || 'Erro ao remover amizade.');
    } finally {
      setWorkingId(null);
    }
  };

  const selectedState = selected
    ? social[selected.id] || emptySocial
    : emptySocial;
  const selectedCounts = selected
    ? counts[selected.id] || { followers: 0, following: 0, friends: 0 }
    : { followers: 0, following: 0, friends: 0 };

  return (
    <>
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase">
              🏆 Liga de Líderes FALLA
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
              Toque em um estudante para abrir o perfil social
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadEntries()}
            className="w-9 h-9 rounded-xl border-2 border-slate-200 flex items-center justify-center"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mb-4">
          {[
            ['global', 'Mundo', Globe],
            ['pais', 'País', MapPin],
            ['regional', 'Estado', TrendingUp],
          ].map(([id, label, Icon]: any) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilterType(id)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-black ${
                filterType === id ? 'bg-white shadow-xs' : 'text-slate-500'
              }`}
            >
              <Icon size={10} />
              {label}
            </button>
          ))}
        </div>

        {message && (
          <div className="mb-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-3 text-[10px] font-bold">
            {message}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Carregando ranking...
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filtered.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                disabled={entry.isUser}
                onClick={() => setSelected(entry)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 text-left ${
                  entry.isUser
                    ? 'bg-falla-blue/10 border-falla-blue'
                    : 'bg-white border-slate-150 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black">
                    {index + 1}
                  </span>

                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0">
                    {renderAvatar(entry, 'w-full h-full')}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black truncate">
                        {entry.name}
                      </span>
                      {entry.isUser && (
                        <span className="text-[7px] bg-falla-green text-white px-1.5 rounded-full font-black">
                          VOCÊ
                        </span>
                      )}
                    </div>
                    <p className="text-[8px] text-slate-400 font-bold truncate">
                      {entry.state}, {entry.country}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-black">{entry.xp} XP</p>
                  <p className="text-[8px] text-falla-orange font-black">
                    🔥 {entry.streak}d
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-3xl border-2 p-5 shadow-2xl space-y-5"
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200">
                  {renderAvatar(selected, 'w-full h-full')}
                </div>
                <div>
                  <h3 className="text-base font-black">{selected.name}</h3>
                  <p className="text-[9px] font-bold opacity-60">
                    {selected.state}, {selected.country}
                  </p>
                </div>
              </div>

              <button type="button" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                ['Seguidores', selectedCounts.followers],
                ['Seguindo', selectedCounts.following],
                ['Amigos', selectedCounts.friends],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border-2 p-3 text-center"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-bg)',
                  }}
                >
                  <strong className="block">{value}</strong>
                  <span className="text-[8px] font-black uppercase opacity-60">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={workingId === selected.id}
              onClick={() => void toggleFollow(selected)}
              className={`w-full rounded-2xl px-4 py-3 text-xs font-black uppercase flex items-center justify-center gap-2 ${
                selectedState.following
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-falla-blue text-white'
              }`}
            >
              {selectedState.following ? (
                <>
                  <UserMinus size={15} /> Deixar de seguir
                </>
              ) : (
                <>
                  <UserPlus size={15} /> Seguir
                </>
              )}
            </button>

            {selectedState.friendship === 'none' && (
              <button
                type="button"
                disabled={workingId === selected.id}
                onClick={() => void sendFriendRequest(selected)}
                className="w-full rounded-2xl bg-falla-green text-white px-4 py-3 text-xs font-black uppercase flex items-center justify-center gap-2"
              >
                <HeartHandshake size={15} />
                Adicionar amigo
              </button>
            )}

            {selectedState.friendship === 'sent' && (
              <button
                type="button"
                onClick={() => void removeFriendship(selected)}
                className="w-full rounded-2xl bg-slate-100 text-slate-600 px-4 py-3 text-xs font-black uppercase flex items-center justify-center gap-2"
              >
                <Clock3 size={15} />
                Cancelar solicitação
              </button>
            )}

            {selectedState.friendship === 'received' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void acceptFriend(selected)}
                  className="rounded-2xl bg-falla-green text-white px-3 py-3 text-[10px] font-black uppercase flex items-center justify-center gap-1"
                >
                  <Check size={14} /> Aceitar
                </button>
                <button
                  type="button"
                  onClick={() => void removeFriendship(selected)}
                  className="rounded-2xl bg-red-100 text-red-600 px-3 py-3 text-[10px] font-black uppercase flex items-center justify-center gap-1"
                >
                  <X size={14} /> Recusar
                </button>
              </div>
            )}

            {selectedState.friendship === 'friends' && (
              <button
                type="button"
                onClick={() => void removeFriendship(selected)}
                className="w-full rounded-2xl bg-emerald-50 text-emerald-700 px-4 py-3 text-xs font-black uppercase flex items-center justify-center gap-2"
              >
                <UserCheck size={15} />
                Desfazer amizade
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
