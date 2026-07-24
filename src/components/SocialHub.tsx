import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Search,
  Users,
  UserPlus,
  UserMinus,
  Check,
  X,
  Clock3,
  RefreshCw,
} from 'lucide-react';

import chicoMascot from '../assets/images/chico_mascot_flat_vector_1784399850056.jpg';
import licoMascot from '../assets/images/lico_mascot_1784292046285.jpg';
import teddyMascot from '../assets/images/teddy_mascot_1784292056581.jpg';
import lunaMascot from '../assets/images/luna_mascot_1784292067117.jpg';

interface Props {
  currentUserName: string;
  currentAvatarUrl: string | null;
  currentMascot: string;
}

interface Person {
  id: string;
  name: string;
  state: string;
  country: string;
  avatarUrl: string | null;
  avatarMascot: string;
  relation?: 'friend' | 'follower' | 'following' | 'request';
  friendshipId?: string;
}

const mascotImages: Record<string, string> = {
  chico: chicoMascot,
  lico: licoMascot,
  teddy: teddyMascot,
  luna: lunaMascot,
};

export default function SocialHub(_: Props) {
  const [tab, setTab] =
    useState<'friends' | 'requests' | 'followers' | 'following' | 'search'>(
      'friends'
    );
  const [people, setPeople] = useState<Person[]>([]);
  const [allProfiles, setAllProfiles] = useState<Person[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const normalize = (profile: any): Person => ({
    id: profile.id,
    name: profile.name || 'Estudante FALLA',
    state: profile.state || '—',
    country: profile.country || '—',
    avatarUrl:
      profile.avatar_url ||
      (profile.avatar_type === 'photo' ? profile.avatar_value : null) ||
      null,
    avatarMascot:
      profile.avatar_mascot ||
      (profile.avatar_type === 'mascot' ? profile.avatar_value : null) ||
      'chico',
  });

  const avatar = (person: Person) => {
    if (person.avatarUrl) {
      return (
        <img
          src={person.avatarUrl}
          alt={person.name}
          className="w-full h-full object-cover"
        />
      );
    }

    const image = mascotImages[person.avatarMascot];

    return image ? (
      <img
        src={image}
        alt={person.name}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center">🎓</div>
    );
  };

  const load = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) throw new Error('Sessão não encontrada.');

      const userId = session.user.id;
      setCurrentUserId(userId);

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(
          'id, name, state, country, avatar_mascot, avatar_url, avatar_type, avatar_value'
        )
        .neq('id', userId)
        .order('name');

      if (profileError) throw profileError;

      const profileMap = new Map(
        (profiles || []).map((profile: any) => [
          profile.id,
          normalize(profile),
        ])
      );

      setAllProfiles(Array.from(profileMap.values()));

      const [{ data: follows }, { data: friendships }] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id, following_id')
          .or(`follower_id.eq.${userId},following_id.eq.${userId}`),
        supabase
          .from('friendships')
          .select('id, requester_id, addressee_id, status')
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      ]);

      let result: Person[] = [];

      if (tab === 'friends') {
        result = (friendships || [])
          .filter((row: any) => row.status === 'accepted')
          .map((row: any) => {
            const other =
              row.requester_id === userId
                ? row.addressee_id
                : row.requester_id;
            const person = profileMap.get(other);
            return person
              ? { ...person, relation: 'friend' as const, friendshipId: row.id }
              : null;
          })
          .filter(Boolean) as Person[];
      }

      if (tab === 'requests') {
        result = (friendships || [])
          .filter(
            (row: any) =>
              row.status === 'pending' && row.addressee_id === userId
          )
          .map((row: any) => {
            const person = profileMap.get(row.requester_id);
            return person
              ? {
                  ...person,
                  relation: 'request' as const,
                  friendshipId: row.id,
                }
              : null;
          })
          .filter(Boolean) as Person[];
      }

      if (tab === 'followers') {
        result = (follows || [])
          .filter((row: any) => row.following_id === userId)
          .map((row: any) => {
            const person = profileMap.get(row.follower_id);
            return person
              ? { ...person, relation: 'follower' as const }
              : null;
          })
          .filter(Boolean) as Person[];
      }

      if (tab === 'following') {
        result = (follows || [])
          .filter((row: any) => row.follower_id === userId)
          .map((row: any) => {
            const person = profileMap.get(row.following_id);
            return person
              ? { ...person, relation: 'following' as const }
              : null;
          })
          .filter(Boolean) as Person[];
      }

      if (tab === 'search') {
        result = Array.from(profileMap.values());
      }

      setPeople(result);
    } catch (error: any) {
      setMessage(error?.message || 'Erro ao carregar dados sociais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [tab]);

  const visiblePeople = useMemo(() => {
    const source = tab === 'search' ? allProfiles : people;
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return source;

    return source.filter(person =>
      `${person.name} ${person.state} ${person.country}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [allProfiles, people, query, tab]);

  const accept = async (person: Person) => {
    if (!person.friendshipId || !currentUserId) return;

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', person.friendshipId)
      .eq('addressee_id', currentUserId);

    if (error) setMessage(error.message);
    else void load();
  };

  const removeFriendship = async (person: Person) => {
    if (!person.friendshipId) return;

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', person.friendshipId);

    if (error) setMessage(error.message);
    else void load();
  };

  const unfollow = async (person: Person) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', person.id);

    if (error) setMessage(error.message);
    else void load();
  };

  const sendFriend = async (person: Person) => {
    if (!currentUserId) return;

    const { error } = await supabase.from('friendships').insert({
      requester_id: currentUserId,
      addressee_id: person.id,
      status: 'pending',
    });

    if (error) setMessage(error.message);
    else setMessage(`Solicitação enviada para ${person.name}.`);
  };

  const follow = async (person: Person) => {
    if (!currentUserId) return;

    const { error } = await supabase.from('follows').insert({
      follower_id: currentUserId,
      following_id: person.id,
    });

    if (error && error.code !== '23505') setMessage(error.message);
    else setMessage(`Agora você segue ${person.name}.`);
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden bg-white border-2 border-slate-200 rounded-3xl p-3 sm:p-5 space-y-4">
      <div className="flex items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 min-w-0">
        <div className="min-w-0">
          <h2 className="text-sm font-black uppercase flex items-center gap-2 min-w-0">
            <Users size={17} className="text-falla-green" />
            Amigos & Seguidores
          </h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
            Gerencie suas conexões no FALLA
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="w-9 h-9 rounded-xl border-2 border-slate-200 flex items-center justify-center"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 w-full min-w-0">
        {[
          ['friends', 'Amigos'],
          ['requests', 'Pedidos'],
          ['followers', 'Seguidores'],
          ['following', 'Seguindo'],
          ['search', 'Buscar'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id as any)}
            className={`min-w-0 rounded-lg px-2 py-2.5 text-[8px] sm:text-[8px] font-black uppercase leading-tight break-words ${
              tab === id ? 'bg-white shadow-xs' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative w-full min-w-0">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Pesquisar pelo nome, estado ou país..."
          className="block w-full min-w-0 max-w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-9 pr-3 py-3 text-xs font-bold outline-none"
        />
      </div>

      {message && (
        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 text-[10px] font-bold">
          {message}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Carregando...
        </div>
      ) : visiblePeople.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <span className="text-4xl">👥</span>
          <p className="text-xs font-black">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2 w-full min-w-0">
          {visiblePeople.map(person => (
            <div
              key={person.id}
              className="w-full min-w-0 rounded-2xl border-2 border-slate-150 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 overflow-hidden"
            >
              <div className="flex items-center gap-3 min-w-0 w-full sm:flex-1">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0">
                  {avatar(person)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black truncate max-w-full">{person.name}</p>
                  <p className="text-[8px] text-slate-400 font-bold truncate">
                    {person.state}, {person.country}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end shrink-0">
                {person.relation === 'request' && (
                  <>
                    <button
                      type="button"
                      onClick={() => void accept(person)}
                      className="w-9 h-9 rounded-xl bg-falla-green text-white flex items-center justify-center"
                      title="Aceitar"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeFriendship(person)}
                      className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center"
                      title="Recusar"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}

                {person.relation === 'friend' && (
                  <button
                    type="button"
                    onClick={() => void removeFriendship(person)}
                    className="flex-1 sm:flex-none min-h-9 rounded-xl bg-red-50 text-red-600 px-3 py-2 text-[8px] font-black uppercase"
                  >
                    Desfazer
                  </button>
                )}

                {person.relation === 'following' && (
                  <button
                    type="button"
                    onClick={() => void unfollow(person)}
                    className="flex-1 sm:flex-none min-h-9 rounded-xl bg-slate-100 text-slate-600 px-3 py-2 text-[8px] font-black uppercase flex items-center justify-center gap-1"
                  >
                    <UserMinus size={12} />
                    Deixar
                  </button>
                )}

                {(person.relation === 'follower' || tab === 'search') && (
                  <>
                    <button
                      type="button"
                      onClick={() => void follow(person)}
                      className="w-9 h-9 rounded-xl bg-falla-blue text-white flex items-center justify-center"
                      title="Seguir"
                    >
                      <UserPlus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendFriend(person)}
                      className="flex-1 sm:flex-none min-h-9 rounded-xl bg-falla-green text-white px-3 py-2 text-[8px] font-black uppercase"
                    >
                      Amizade
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
