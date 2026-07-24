import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCheck,
  ChevronLeft,
  Bell,
  MessageCircle,
  Minus,
  Move,
  RefreshCw,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

import chicoMascot from '../assets/images/chico_mascot_flat_vector_1784399850056.jpg';
import licoMascot from '../assets/images/lico_mascot_1784292046285.jpg';
import teddyMascot from '../assets/images/teddy_mascot_1784292056581.jpg';
import lunaMascot from '../assets/images/luna_mascot_1784292067117.jpg';

interface FloatingFriendsChatProps {
  currentUserName: string;
  currentAvatarUrl: string | null;
  currentMascot: string;
}

interface FriendProfile {
  id: string;
  name: string;
  state: string;
  country: string;
  avatarUrl: string | null;
  avatarMascot: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

const mascotImages: Record<string, string> = {
  chico: chicoMascot,
  lico: licoMascot,
  teddy: teddyMascot,
  luna: lunaMascot,
};

export default function FloatingFriendsChat({
  currentUserName,
  currentAvatarUrl,
  currentMascot,
}: FloatingFriendsChatProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [activeFriend, setActiveFriend] = useState<FriendProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByFriend, setUnreadByFriend] = useState<Record<string, number>>({});
  const [openConversationIds, setOpenConversationIds] = useState<Set<string>>(
    new Set()
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
  );
  const [chatButtonPosition, setChatButtonPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
    moved: false,
  });
  const friendsRef = useRef<FriendProfile[]>([]);
  const activeFriendRef = useRef<FriendProfile | null>(null);
  const isOpenRef = useRef(false);

  const renderAvatar = (
    avatarUrl: string | null,
    avatarMascot: string,
    name: string,
    className = 'w-full h-full'
  ) => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={`Foto de ${name}`}
          className={`${className} object-cover`}
          referrerPolicy="no-referrer"
        />
      );
    }

    const image = mascotImages[avatarMascot];

    if (image) {
      return (
        <img
          src={image}
          alt={`Mascote de ${name}`}
          className={`${className} object-cover`}
          referrerPolicy="no-referrer"
        />
      );
    }

    return (
      <div className={`${className} flex items-center justify-center`}>
        🎓
      </div>
    );
  };

  const normalizeProfile = (profile: any): FriendProfile => ({
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

  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

  useEffect(() => {
    activeFriendRef.current = activeFriend;
  }, [activeFriend]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const clampButtonPosition = (x: number, y: number) => {
    const buttonSize = 56;
    const margin = 12;
    const bottomReserved = 90;
    const maxX = Math.max(margin, window.innerWidth - buttonSize - margin);
    const maxY = Math.max(
      margin,
      window.innerHeight - buttonSize - bottomReserved
    );

    return {
      x: Math.min(Math.max(x, margin), maxX),
      y: Math.min(Math.max(y, margin), maxY),
    };
  };

  useEffect(() => {
    const saved = localStorage.getItem('falla_chat_button_position');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChatButtonPosition(clampButtonPosition(parsed.x, parsed.y));
      } catch {
        setChatButtonPosition(
          clampButtonPosition(window.innerWidth - 72, window.innerHeight - 170)
        );
      }
    } else {
      setChatButtonPosition(
        clampButtonPosition(window.innerWidth - 72, window.innerHeight - 170)
      );
    }

    const handleResize = () => {
      setChatButtonPosition(previous =>
        previous
          ? clampButtonPosition(previous.x, previous.y)
          : clampButtonPosition(
              window.innerWidth - 72,
              window.innerHeight - 170
            )
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const requestDeviceNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setErrorMessage(
        'Este aparelho ou navegador não oferece notificações do sistema.'
      );
      return false;
    }

    try {
      const permission =
        Notification.permission === 'default'
          ? await Notification.requestPermission()
          : Notification.permission;

      const enabled = permission === 'granted';
      setNotificationsEnabled(enabled);

      if (!enabled) {
        setErrorMessage(
          'Ative as notificações do FALLA nas configurações do navegador ou aparelho.'
        );
      }

      return enabled;
    } catch (error: any) {
      setErrorMessage(
        `Não foi possível ativar as notificações: ${
          error?.message || error
        }`
      );
      return false;
    }
  };

  const showDeviceNotification = async (
    senderName: string,
    messageContent: string
  ) => {
    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    ) {
      return;
    }

    const title = `Nova mensagem de ${senderName}`;
    const options: NotificationOptions = {
      body:
        messageContent.length > 120
          ? `${messageContent.slice(0, 117)}...`
          : messageContent,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `falla-chat-${senderName}`,
      renotify: true,
      data: {
        type: 'falla-chat',
      },
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
    } catch (error) {
      console.warn('Não foi possível exibir a notificação do chat:', error);
    }
  };

  const loadConversationIndicators = async (
    resolvedUserId?: string | null
  ) => {
    const userId = resolvedUserId || currentUserId || (await loadSession());
    if (!userId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, read_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.warn('Erro ao carregar indicadores de conversa:', error);
      return;
    }

    const openIds = new Set<string>();
    const unreadMap: Record<string, number> = {};

    (data || []).forEach((message: any) => {
      const otherId =
        message.sender_id === userId
          ? message.receiver_id
          : message.sender_id;

      openIds.add(otherId);

      if (message.receiver_id === userId && !message.read_at) {
        unreadMap[otherId] = (unreadMap[otherId] || 0) + 1;
      }
    });

    setOpenConversationIds(openIds);
    setUnreadByFriend(unreadMap);
    setUnreadCount(
      Object.values(unreadMap).reduce((total, value) => total + value, 0)
    );
  };

  const handleChatButtonPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (!chatButtonPosition) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - chatButtonPosition.x,
      offsetY: event.clientY - chatButtonPosition.y,
      moved: false,
    };
  };

  const handleChatButtonPointerMove = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;

    const next = clampButtonPosition(
      event.clientX - dragStateRef.current.offsetX,
      event.clientY - dragStateRef.current.offsetY
    );

    if (
      !chatButtonPosition ||
      Math.abs(next.x - chatButtonPosition.x) > 2 ||
      Math.abs(next.y - chatButtonPosition.y) > 2
    ) {
      dragStateRef.current.moved = true;
    }

    setChatButtonPosition(next);
  };

  const handleChatButtonPointerUp = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture(event.pointerId);

    if (chatButtonPosition) {
      localStorage.setItem(
        'falla_chat_button_position',
        JSON.stringify(chatButtonPosition)
      );
    }

    dragStateRef.current.pointerId = -1;
  };

  const loadSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const id = session?.user?.id || null;
    setCurrentUserId(id);
    return id;
  };

  const loadFriends = async (resolvedUserId?: string | null) => {
    const userId = resolvedUserId || currentUserId || (await loadSession());
    if (!userId) return;

    setLoadingFriends(true);
    setErrorMessage(null);

    try {
      const { data: friendshipRows, error: friendshipsError } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (friendshipsError) throw friendshipsError;

      const friendIds = (friendshipRows || []).map((row: any) =>
        row.requester_id === userId ? row.addressee_id : row.requester_id
      );

      if (friendIds.length === 0) {
        setFriends([]);
        setActiveFriend(null);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(
          'id, name, state, country, avatar_mascot, avatar_url, avatar_type, avatar_value'
        )
        .in('id', friendIds)
        .order('name');

      if (profilesError) throw profilesError;

      const normalized = (profiles || []).map(normalizeProfile);
      setFriends(normalized);

      if (
        activeFriend &&
        !normalized.some(friend => friend.id === activeFriend.id)
      ) {
        setActiveFriend(null);
      }
    } catch (error: any) {
      setErrorMessage(
        `Não foi possível carregar seus amigos: ${error?.message || error}`
      );
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadUnreadCount = async (resolvedUserId?: string | null) => {
    const userId = resolvedUserId || currentUserId || (await loadSession());
    if (!userId) return;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .is('read_at', null);

    if (!error) setUnreadCount(count || 0);
  };

  const loadMessages = async (friend: FriendProfile) => {
    if (!currentUserId) return;

    setLoadingMessages(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, created_at, read_at')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: true })
        .limit(250);

      if (error) throw error;

      setMessages((data || []) as ChatMessage[]);

      const unreadIds = (data || [])
        .filter(
          (message: any) =>
            message.receiver_id === currentUserId && !message.read_at
        )
        .map((message: any) => message.id);

      if (unreadIds.length > 0) {
        const { error: readError } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds)
          .eq('receiver_id', currentUserId);

        if (!readError) {
          setMessages(previous =>
            previous.map(message =>
              unreadIds.includes(message.id)
                ? { ...message, read_at: new Date().toISOString() }
                : message
            )
          );
          setUnreadByFriend(previous => ({
            ...previous,
            [friend.id]: 0,
          }));
          void loadUnreadCount(currentUserId);
          void loadConversationIndicators(currentUserId);
        }
      }
    } catch (error: any) {
      setErrorMessage(
        `Não foi possível carregar a conversa: ${error?.message || error}`
      );
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const id = await loadSession();
      if (id) {
        await Promise.all([
          loadFriends(id),
          loadUnreadCount(id),
          loadConversationIndicators(id),
        ]);
      }
    };

    void initialize();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`floating_chat_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        payload => {
          const incoming = payload.new as ChatMessage;

          const sender = friendsRef.current.find(
            friend => friend.id === incoming.sender_id
          );
          const conversationIsVisible =
            activeFriendRef.current?.id === incoming.sender_id &&
            isOpenRef.current &&
            !isMinimized;

          setOpenConversationIds(previous => {
            const next = new Set(previous);
            next.add(incoming.sender_id);
            return next;
          });

          if (conversationIsVisible) {
            setMessages(previous =>
              previous.some(message => message.id === incoming.id)
                ? previous
                : [...previous, incoming]
            );

            void supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', incoming.id)
              .eq('receiver_id', currentUserId);
          } else {
            setUnreadCount(previous => previous + 1);
            setUnreadByFriend(previous => ({
              ...previous,
              [incoming.sender_id]:
                (previous[incoming.sender_id] || 0) + 1,
            }));

            void showDeviceNotification(
              sender?.name || 'um amigo',
              incoming.content
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUserId}`,
        },
        payload => {
          const outgoing = payload.new as ChatMessage;

          if (activeFriend?.id === outgoing.receiver_id) {
            setMessages(previous =>
              previous.some(message => message.id === outgoing.id)
                ? previous
                : [...previous, outgoing]
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, activeFriend?.id, isOpen, isMinimized]);

  useEffect(() => {
    if (activeFriend && isOpen) {
      void loadMessages(activeFriend);
    }
  }, [activeFriend?.id, isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeFriend?.id]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    const content = draft.trim();
    if (!content || !activeFriend || !currentUserId || sending) return;

    if (content.length > 1500) {
      setErrorMessage('A mensagem pode ter no máximo 1.500 caracteres.');
      return;
    }

    setSending(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: activeFriend.id,
          content,
        })
        .select('id, sender_id, receiver_id, content, created_at, read_at')
        .single();

      if (error) throw error;

      setMessages(previous =>
        previous.some(message => message.id === data.id)
          ? previous
          : [...previous, data as ChatMessage]
      );
      setOpenConversationIds(previous => {
        const next = new Set(previous);
        next.add(activeFriend.id);
        return next;
      });
      setDraft('');
    } catch (error: any) {
      setErrorMessage(
        `Não foi possível enviar: ${error?.message || error}`
      );
    } finally {
      setSending(false);
    }
  };

  const filteredFriends = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return friends;

    return friends.filter(friend =>
      `${friend.name} ${friend.state} ${friend.country}`
        .toLowerCase()
        .includes(term)
    );
  }, [friends, search]);

  const openChat = () => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }

    setIsOpen(true);
    setIsMinimized(false);

    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      void requestDeviceNotifications();
    }

    if (currentUserId) {
      void loadFriends(currentUserId);
      void loadUnreadCount(currentUserId);
      void loadConversationIndicators(currentUserId);
    }
  };

  const getChatPanelPosition = () => {
    const panelWidth = Math.min(390, window.innerWidth - 24);
    const estimatedPanelHeight = isMinimized
      ? 64
      : Math.min(560, window.innerHeight * 0.72);
    const margin = 12;
    const buttonSize = 56;

    const buttonX =
      chatButtonPosition?.x ?? window.innerWidth - buttonSize - margin;
    const buttonY =
      chatButtonPosition?.y ?? window.innerHeight - buttonSize - 110;

    let left = buttonX + buttonSize - panelWidth;
    left = Math.max(
      margin,
      Math.min(left, window.innerWidth - panelWidth - margin)
    );

    const spaceAbove = buttonY - margin;
    const spaceBelow =
      window.innerHeight - (buttonY + buttonSize) - margin - 76;

    let top: number;

    if (spaceAbove >= estimatedPanelHeight) {
      top = buttonY - estimatedPanelHeight - 10;
    } else if (spaceBelow >= estimatedPanelHeight) {
      top = buttonY + buttonSize + 10;
    } else {
      top = Math.max(
        margin,
        Math.min(
          buttonY - estimatedPanelHeight / 2,
          window.innerHeight - estimatedPanelHeight - 88
        )
      );
    }

    return {
      left,
      top,
      width: panelWidth,
      maxHeight: Math.min(560, window.innerHeight - top - 88),
    };
  };

  const chatPanelPosition = getChatPanelPosition();

  return (
    <>
      <motion.button
        type="button"
        onClick={openChat}
        onPointerDown={handleChatButtonPointerDown}
        onPointerMove={handleChatButtonPointerMove}
        onPointerUp={handleChatButtonPointerUp}
        onPointerCancel={handleChatButtonPointerUp}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        className="fixed z-[65] w-14 h-14 rounded-full border-4 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
        style={{
          left: chatButtonPosition?.x ?? undefined,
          top: chatButtonPosition?.y ?? undefined,
          visibility: chatButtonPosition ? 'visible' : 'hidden',
          backgroundColor: 'var(--theme-primary)',
          borderColor: 'var(--theme-card-bg)',
          color: '#FFFFFF',
          boxShadow:
            '0 14px 35px color-mix(in srgb, var(--theme-primary) 40%, transparent)',
        }}
        aria-label="Abrir ou mover o chat com amigos"
        title="Clique para abrir ou arraste para mover"
      >
        <MessageCircle size={25} strokeWidth={2.7} />
        <span
          className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-primary)',
            color: 'var(--theme-primary)',
          }}
        >
          <Move size={10} />
        </span>

        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full border-2 text-[9px] font-black flex items-center justify-center"
            style={{
              backgroundColor: 'var(--color-falla-red)',
              borderColor: 'var(--theme-card-bg)',
              color: '#FFFFFF',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 64 : undefined,
            }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            className="fixed z-[70] rounded-3xl border-2 shadow-2xl overflow-hidden flex flex-col"
            style={{
              left: chatPanelPosition.left,
              top: chatPanelPosition.top,
              width: chatPanelPosition.width,
              maxHeight: chatPanelPosition.maxHeight,
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
              boxShadow:
                '0 24px 70px color-mix(in srgb, var(--theme-primary) 22%, rgba(15,23,42,.28))',
            }}
          >
            <header
              className="h-16 shrink-0 flex items-center justify-between px-4 border-b-2"
              style={{
                background:
                  'linear-gradient(135deg, var(--theme-primary-light), var(--theme-card-bg))',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {activeFriend && !isMinimized ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFriend(null);
                      setMessages([]);
                    }}
                    className="w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'var(--theme-card-bg)',
                      borderColor: 'var(--theme-border)',
                    }}
                    title="Voltar às conversas"
                  >
                    <ChevronLeft size={16} />
                  </button>
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'var(--theme-primary)',
                      color: '#FFFFFF',
                    }}
                  >
                    <MessageCircle size={18} />
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="text-xs font-black uppercase truncate">
                    {activeFriend
                      ? activeFriend.name
                      : isMinimized
                      ? 'Chat minimizado'
                      : 'Chat com amigos'}
                  </h3>
                  <p className="text-[8px] font-bold uppercase opacity-60 truncate">
                    {activeFriend
                      ? 'Somente amigos podem conversar'
                      : `${openConversationIds.size} ${
                          openConversationIds.size === 1
                            ? 'conversa aberta'
                            : 'conversas abertas'
                        } • ${friends.length} ${
                          friends.length === 1
                            ? 'amigo'
                            : 'amigos'
                        }`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void requestDeviceNotifications()}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-75 relative"
                  title={
                    notificationsEnabled
                      ? 'Notificações do aparelho ativadas'
                      : 'Ativar notificações do aparelho'
                  }
                >
                  <Bell size={15} />
                  <span
                    className="absolute right-1 top-1 w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: notificationsEnabled
                        ? 'var(--theme-success)'
                        : 'var(--color-falla-red)',
                    }}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setIsMinimized(previous => !previous)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-75"
                  title={isMinimized ? 'Restaurar chat' : 'Minimizar chat'}
                >
                  <Minus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsMinimized(false);
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-75"
                  title="Fechar chat"
                >
                  <X size={17} />
                </button>
              </div>
            </header>

            {!isMinimized && (
              <>
                {errorMessage && (
                  <div
                    className="mx-3 mt-3 rounded-2xl border-2 p-3 text-[9px] font-bold"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                {!activeFriend ? (
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="p-3 flex gap-2">
                      <div className="relative flex-1">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                        />
                        <input
                          value={search}
                          onChange={event => setSearch(event.target.value)}
                          placeholder="Pesquisar amigo..."
                          className="w-full rounded-2xl border-2 pl-9 pr-3 py-2.5 text-[10px] font-bold outline-none"
                          style={{
                            backgroundColor: 'var(--theme-bg)',
                            borderColor: 'var(--theme-border)',
                            color: 'var(--theme-text)',
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => void loadFriends()}
                        className="w-10 rounded-2xl border-2 flex items-center justify-center"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)',
                        }}
                        title="Atualizar amigos"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
                      {loadingFriends ? (
                        <div className="py-12 text-center text-[10px] font-bold opacity-60">
                          Carregando amigos...
                        </div>
                      ) : filteredFriends.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                          <div
                            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
                            style={{
                              backgroundColor: 'var(--theme-primary-light)',
                              color: 'var(--theme-primary)',
                            }}
                          >
                            <Users size={25} />
                          </div>
                          <div>
                            <p className="text-xs font-black">
                              Nenhum amigo disponível
                            </p>
                            <p className="text-[9px] font-bold opacity-60 mt-1">
                              Aceite uma amizade para liberar o chat.
                            </p>
                          </div>
                        </div>
                      ) : (
                        filteredFriends.map(friend => (
                          <button
                            type="button"
                            key={friend.id}
                            onClick={() => setActiveFriend(friend)}
                            className="w-full rounded-2xl border-2 p-3 flex items-center gap-3 text-left transition-transform active:scale-[0.98]"
                            style={{
                              backgroundColor: 'var(--theme-bg)',
                              borderColor: 'var(--theme-border)',
                            }}
                          >
                            <div className="w-11 h-11 rounded-full overflow-hidden border-2 shrink-0"
                              style={{
                                borderColor: 'var(--theme-border)',
                                backgroundColor: 'var(--theme-card-bg)',
                              }}
                            >
                              {renderAvatar(
                                friend.avatarUrl,
                                friend.avatarMascot,
                                friend.name
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black truncate">
                                {friend.name}
                              </p>
                              <p className="text-[8px] font-bold opacity-55 truncate">
                                {friend.state}, {friend.country}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {openConversationIds.has(friend.id) && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                                  style={{
                                    backgroundColor: 'var(--theme-success)',
                                    boxShadow:
                                      '0 0 0 4px color-mix(in srgb, var(--theme-success) 18%, transparent)',
                                  }}
                                  title="Conversa aberta"
                                />
                              )}

                              {(unreadByFriend[friend.id] || 0) > 0 && (
                                <span
                                  className="min-w-5 h-5 px-1 rounded-full text-[8px] font-black flex items-center justify-center"
                                  style={{
                                    backgroundColor: 'var(--color-falla-red)',
                                    color: '#FFFFFF',
                                  }}
                                >
                                  {unreadByFriend[friend.id] > 99
                                    ? '99+'
                                    : unreadByFriend[friend.id]}
                                </span>
                              )}

                              <MessageCircle
                                size={16}
                                style={{ color: 'var(--theme-primary)' }}
                              />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div
                      className="px-3 py-2 border-b text-[8px] font-black uppercase flex items-center justify-center gap-1.5"
                      style={{
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-muted)',
                      }}
                    >
                      <CheckCheck size={12} />
                      Conversa protegida: apenas amigos aceitos
                    </div>

                    <div
                      className="flex-1 min-h-[230px] max-h-[430px] overflow-y-auto p-3 space-y-2"
                      style={{ backgroundColor: 'var(--theme-bg)' }}
                    >
                      {loadingMessages ? (
                        <div className="py-12 text-center text-[10px] font-bold opacity-60">
                          Carregando mensagens...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-3xl">👋</p>
                          <p className="text-xs font-black mt-2">
                            Comece a conversa
                          </p>
                          <p className="text-[9px] font-bold opacity-55 mt-1">
                            Diga olá para {activeFriend.name}.
                          </p>
                        </div>
                      ) : (
                        messages.map(message => {
                          const mine = message.sender_id === currentUserId;

                          return (
                            <div
                              key={message.id}
                              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className="max-w-[82%] rounded-2xl px-3 py-2 shadow-xs"
                                style={{
                                  backgroundColor: mine
                                    ? 'var(--theme-primary)'
                                    : 'var(--theme-card-bg)',
                                  color: mine ? '#FFFFFF' : 'var(--theme-text)',
                                  border: mine
                                    ? 'none'
                                    : '1px solid var(--theme-border)',
                                  borderBottomRightRadius: mine ? 5 : 16,
                                  borderBottomLeftRadius: mine ? 16 : 5,
                                }}
                              >
                                <p className="text-[10px] font-bold whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                                <div
                                  className={`mt-1 flex items-center gap-1 text-[7px] font-bold ${
                                    mine ? 'justify-end' : 'justify-start'
                                  }`}
                                  style={{ opacity: 0.68 }}
                                >
                                  {new Date(message.created_at).toLocaleTimeString(
                                    'pt-BR',
                                    {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )}
                                  {mine && (
                                    <CheckCheck
                                      size={10}
                                      style={{
                                        opacity: message.read_at ? 1 : 0.55,
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={bottomRef} />
                    </div>

                    <form
                      onSubmit={sendMessage}
                      className="p-3 border-t-2 flex items-end gap-2"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <div className="flex-1">
                        <textarea
                          value={draft}
                          onChange={event => setDraft(event.target.value)}
                          onKeyDown={event => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                              event.preventDefault();
                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                          maxLength={1500}
                          rows={1}
                          placeholder={`Mensagem para ${activeFriend.name}...`}
                          className="w-full min-h-11 max-h-28 resize-none rounded-2xl border-2 px-3 py-3 text-[10px] font-bold outline-none"
                          style={{
                            backgroundColor: 'var(--theme-bg)',
                            borderColor: 'var(--theme-border)',
                            color: 'var(--theme-text)',
                          }}
                        />
                        <p className="text-[7px] font-bold opacity-45 text-right pr-1">
                          {draft.length}/1500
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={!draft.trim() || sending}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-40 active:scale-95"
                        style={{
                          backgroundColor: 'var(--theme-primary)',
                          color: '#FFFFFF',
                          boxShadow:
                            '0 7px 16px color-mix(in srgb, var(--theme-primary) 28%, transparent)',
                        }}
                        title="Enviar mensagem"
                      >
                        <Send size={17} />
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
