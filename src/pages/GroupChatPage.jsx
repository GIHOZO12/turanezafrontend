import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { fetchGroupById, fetchGroupMessages, fetchMemberships, sendGroupMessage } from '../api/groups';
import InvestorLayout, { InvestorContext } from '../components/InvestorLayout';
import { formatFlexibleCurrency } from '../utils/currency';

const POLL_INTERVAL_MS = 12000;

const normaliseList = (payload) => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
};

const formatUsdValue = (value) => formatFlexibleCurrency(value);

const formatTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const GroupChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId } = useParams();
  const numericGroupId = Number(groupId);
  const { user } = useContext(InvestorContext);
  const currentUserId = user?.id || null;

  const [group, setGroup] = useState(null);
  const [roster, setRoster] = useState([]);
  const [messages, setMessages] = useState([]);
  const initialRecipientId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const target = Number(params.get('recipient'));
    return Number.isFinite(target) ? target : null;
  }, [location.search]);

  const [selectedRecipientId, setSelectedRecipientId] = useState(initialRecipientId);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const messagesEndRef = useRef(null);

  const memberProfile = useMemo(
    () => roster.find((entry) => entry.user?.id === currentUserId) || null,
    [currentUserId, roster],
  );

  const selectedRecipient = useMemo(
    () => roster.find((entry) => entry.user?.id === selectedRecipientId) || null,
    [roster, selectedRecipientId],
  );

  const isGroupChat = !selectedRecipientId;
  const groupCode = useMemo(
    () => (group ? group.reference_code || String(group.id || '').padStart(5, '0') : '00000'),
    [group],
  );
  const conversationLabel = isGroupChat
    ? `#${groupCode} · ${group?.name || 'Group'}`
    : selectedRecipient?.user?.full_name || selectedRecipient?.user?.email || 'Direct chat';

  const canPost = Boolean(user);

  const loadGroupContext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupData, rosterData] = await Promise.all([
        fetchGroupById(groupId),
        fetchMemberships({ group: groupId }),
      ]);
      setGroup(groupData);
      setRoster(normaliseList(rosterData));
    } catch (err) {
      setError(err.message || 'Unable to load group chat right now.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadMessages = useCallback(
    async ({ showSpinner = true, recipientId = selectedRecipientId } = {}) => {
      const resolvedGroupId = group?.id || numericGroupId;
      if (!resolvedGroupId) {
        return;
      }
      if (showSpinner) {
        setRefreshing(true);
      }
      try {
        const params = { group: resolvedGroupId };
        if (recipientId) {
          params.recipient = recipientId;
        }
        const response = await fetchGroupMessages(params);
        setMessages(normaliseList(response));
      } catch (err) {
        setError(err.message || 'Unable to sync chat messages.');
      } finally {
        setRefreshing(false);
      }
    },
    [group?.id, numericGroupId, selectedRecipientId],
  );

  useEffect(() => {
    if (!groupId) {
      return;
    }
    const initialise = async () => {
      await loadGroupContext();
      await loadMessages();
    };
    initialise();
  }, [groupId, loadGroupContext, loadMessages]);

  useEffect(() => {
    setSelectedRecipientId(initialRecipientId);
  }, [initialRecipientId]);

  useEffect(() => {
    if (!groupId || loading) {
      return;
    }
    loadMessages();
  }, [selectedRecipientId, groupId, loadMessages, loading]);

  useEffect(() => {
    if (!groupId) {
      return () => {};
    }
    const intervalId = setInterval(() => {
      loadMessages({ showSpinner: false });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [groupId, loadMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!groupId || typeof window === 'undefined') {
      return undefined;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const wsUrl = `${protocol}://${host}/ws/groups/${groupId}/chat/`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setSocketConnected(true);
    };
    socket.onclose = () => {
      setSocketConnected(false);
    };
    socket.onerror = () => {
      setSocketConnected(false);
    };
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === 'error') {
          setError(data.message || 'Unable to send message right now.');
          return;
        }
        if (data?.type !== 'chat.message') {
          return;
        }
        const incoming = data.payload;
        if (!incoming?.id) {
          return;
        }
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === incoming.id)) {
            return prev;
          }
          const isDirect = Boolean(incoming.recipient);
          if (selectedRecipientId) {
            if (!isDirect) {
              return prev;
            }
            const otherId = incoming.sender?.id === currentUserId ? incoming.recipient?.id : incoming.sender?.id;
            if (`${otherId}` !== `${selectedRecipientId}`) {
              return prev;
            }
          } else if (isDirect) {
            return prev;
          }
          return [...prev, incoming];
        });
      } catch (err) {
        // Ignore invalid frames.
      }
    };

    return () => {
      socket.close();
    };
  }, [groupId, selectedRecipientId, currentUserId]);

  const handleSendMessage = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (!messageText.trim()) {
      return;
    }
    const resolvedGroupId = group?.id || numericGroupId;
    if (!resolvedGroupId) {
      setError('Unable to send message right now.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const trimmedMessage = messageText.trim();
      const payload = {
        group: resolvedGroupId,
        body: trimmedMessage,
      };
      if (selectedRecipientId) {
        payload.recipient_id = selectedRecipientId;
      }
      if (socketConnected && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            action: 'send',
            body: trimmedMessage,
            recipient_id: selectedRecipientId || null,
          }),
        );
        setMessageText('');
      } else {
        const newMessage = await sendGroupMessage(payload);
        setMessageText('');
        if (newMessage?.id) {
          setMessages((prev) => [...prev, newMessage]);
        }
        await loadMessages({ showSpinner: false });
      }
    } catch (err) {
      setError(err.message || 'Unable to send message right now.');
    } finally {
      setSending(false);
    }
  };

  const handleSelectRecipient = (recipientId) => {
    setSelectedRecipientId(recipientId);
  };

  const handleReturnToGroup = () => {
    navigate(`/groups/${groupId}`);
  };

  const availableMembers = roster.filter((entry) => entry.user?.id !== currentUserId);
  const minTicketLabel = useMemo(() => formatUsdValue(group?.min_investment), [group?.min_investment]);

  if (loading) {
    return (
      <InvestorLayout active="groups">
        <div className="flex min-h-[60vh] items-center justify-center rounded-3xl bg-porcelain text-slate-600">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-card">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="text-sm font-medium">Connecting to group chat...</p>
          </div>
        </div>
      </InvestorLayout>
    );
  }

  if (error && !group) {
    return (
      <InvestorLayout active="groups">
        <div className="flex min-h-[60vh] items-center justify-center rounded-3xl bg-porcelain text-slate-600">
          <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
            <p className="text-base font-semibold text-slate-900">Chat unavailable</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={handleReturnToGroup}
              className="mt-4 inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
            >
              Back to group
            </button>
          </div>
        </div>
      </InvestorLayout>
    );
  }

  return (
    <InvestorLayout active="groups">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="flex min-h-[70vh] rounded-3xl border border-white/40 bg-porcelain text-slate-900">
      <aside className="hidden w-80 flex-shrink-0 flex-col border-r border-white/40 bg-white/80 backdrop-blur md:flex">
        <div className="border-b border-white/40 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Group</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            #{groupCode} · {group?.name}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {group?.members_count ?? 0} members • Min ticket {minTicketLabel}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <button
            type="button"
            onClick={() => handleSelectRecipient(null)}
            className={clsx(
              'flex w-full flex-col rounded-2xl px-4 py-3 text-left transition duration-150 ease-in-out',
              isGroupChat ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-100',
            )}
          >
            <span className="text-sm font-semibold">Group chat</span>
            <span className="text-xs text-slate-500">Visible to every member</span>
          </button>

          <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Direct messages</p>
          <div className="mt-2 space-y-2">
            {availableMembers.length === 0 ? (
              <p className="px-2 text-xs text-slate-400">Invite more investors to unlock private chats.</p>
            ) : (
              availableMembers.map((entry) => {
                const active = selectedRecipientId === entry.user?.id;
                return (
                  <button
                    type="button"
                    key={entry.id}
                    onClick={() => handleSelectRecipient(entry.user?.id)}
                    className={clsx(
                      'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition duration-150 ease-in-out',
                      active ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-100',
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {entry.user?.full_name || entry.user?.email || 'Member'}
                      </p>
                      <p className="text-xs text-slate-500">{entry.user?.email}</p>
                    </div>
                    {entry.role === 'admin' ? (
                      <span className="rounded-pill bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary">
                        Admin
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="border-t border-white/40 px-4 py-4">
          <button
            type="button"
            onClick={handleReturnToGroup}
            className="flex w-full items-center justify-center rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary/60 hover:text-primary"
          >
            ← Back to overview
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col bg-porcelain">
        <header className="border-b border-white/40 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              {isGroupChat ? 'Group chat' : 'Direct message'}
            </p>
            <h1 className="text-xl font-semibold text-slate-900">{conversationLabel}</h1>
              <p className="text-xs text-slate-500">
                {isGroupChat
                  ? 'Broadcast announcements, share files, and align everyone in one feed.'
                  : 'Private conversation between you and the selected investor.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to={`/groups/${groupId}`}
                className="rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary/60 hover:text-primary"
              >
                View group
              </Link>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mx-4 mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 sm:mx-6">
            {error}
          </div>
        ) : null}

        <div className="flex flex-1 flex-col px-4 pb-4 pt-2 sm:px-6">
          <div className="relative flex-1 overflow-y-auto rounded-3xl bg-white p-4 shadow-inner">
            {refreshing ? (
              <div className="absolute right-4 top-4 text-xs text-slate-400">Syncing…</div>
            ) : null}
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
                <p>{isGroupChat ? 'No updates yet. Lead the discussion!' : 'Say hello to start this private chat.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMine = message.sender?.id === currentUserId;
                  return (
                    <div key={message.id} className={clsx('flex flex-col', isMine ? 'items-end' : 'items-start')}>
                      {!isMine ? (
                        <p className="mb-1 text-xs font-semibold text-slate-500">
                          {message.sender?.full_name || message.sender?.email || 'Member'}
                        </p>
                      ) : null}
                      <div
                        className={clsx(
                          'max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-card',
                          isMine ? 'bg-primary text-white' : 'bg-slate-100 text-slate-900',
                        )}
                      >
                        <p>{message.body}</p>
                        <div className={clsx('mt-1 text-[10px]', isMine ? 'text-white/70' : 'text-slate-500')}>
                          {message.is_direct && !isGroupChat ? 'Direct • ' : null}
                          {formatTimestamp(message.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form
            onSubmit={handleSendMessage}
            className="mt-4 flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-card sm:flex-row sm:items-center"
          >
            <textarea
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={
                isGroupChat
                  ? 'Share an update with every investor...'
                  : `Message ${selectedRecipient?.user?.full_name || 'this investor'}...`
              }
              rows={2}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
              <button
                type="submit"
                disabled={sending || !messageText.trim()}
                className={clsx(
                  'rounded-pill px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out',
                  sending || !messageText.trim()
                    ? 'cursor-not-allowed bg-primary'
                    : canPost
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-primary text-slate-500',
                )}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
          </form>
        </div>
      </main>
    </div>
  </div>
  </InvestorLayout>
  );
};

export default GroupChatPage;
