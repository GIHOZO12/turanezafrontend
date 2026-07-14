import React, { useCallback, useEffect, useState } from 'react';
import SuperAdminShell from '../components/SuperAdminShell';
import { fetchSuperAdminChats, fetchSuperAdminMe, postGroupAnnouncement } from '../api/superadmin';
import { useNavigate } from 'react-router-dom';

const SuperAdminChatsPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [query, setQuery] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchSuperAdminMe();
      const params = new URLSearchParams();
      if (groupId) params.set('group', groupId);
      if (query) params.set('q', query);
      const data = await fetchSuperAdminChats(params.toString() ? `?${params.toString()}` : '');
      setMessages(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message || 'Unable to load chats.');
      navigate('/super-admin/login', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [groupId, navigate, query]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePostAnnouncement = async () => {
    if (!groupId) {
      setError('Enter a group ID to post an announcement.');
      return;
    }
    if (!announcement.trim()) {
      setError('Announcement message cannot be empty.');
      return;
    }
    setPosting(true);
    setError(null);
    try {
      await postGroupAnnouncement(groupId, { body: announcement.trim() });
      setAnnouncement('');
      await load();
    } catch (err) {
      setError(err.message || 'Unable to post announcement.');
    } finally {
      setPosting(false);
    }
  };

  const messageType = (body) => {
    if (!body) return 'NORMAL';
    if (body.startsWith('[OFFICIAL]')) return 'OFFICIAL_ANNOUNCEMENT';
    return 'NORMAL';
  };

  return (
    <SuperAdminShell title="Chats" subtitle="Super Admin">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Global chat visibility</h2>
          <p className="mt-2 text-sm text-slate-500">
            Super Admin can read any group chat without being a member. Official announcements are posted through
            this panel and appear with a special badge.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full max-w-[200px] rounded-pill border border-slate-200 px-4 py-2 text-xs"
              placeholder="Group ID"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full max-w-sm rounded-pill border border-slate-200 px-4 py-2 text-xs"
              placeholder="Search chat text..."
            />
            <button
              type="button"
              onClick={load}
              className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/90"
            >
              Search
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Post official announcement</h2>
          <p className="mt-2 text-sm text-slate-500">
            This posts an official update into the group chat. It is highlighted as a Super Admin announcement.
          </p>
          <textarea
            className="mt-4 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            rows={4}
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="Write the official update..."
          />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Group ID: {groupId || 'Not selected'}</span>
            <button
              type="button"
              onClick={handlePostAnnouncement}
              disabled={posting}
              className="rounded-pill bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {posting ? 'Posting...' : 'Post announcement'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-slate-900">Messages</h3>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-10 text-sm text-slate-600">Loading chats...</div>
      ) : (
        <div className="mt-4 space-y-3">
          {messages.length ? (
            messages.map((msg) => (
              <div key={msg.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{msg.group_name}</p>
                    <p className="text-xs text-slate-500">
                      {msg.sender_name || 'System'} → {msg.recipient_name || 'Group'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-pill px-3 py-1 text-[10px] font-semibold ${
                        messageType(msg.body) === 'OFFICIAL_ANNOUNCEMENT'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {messageType(msg.body) === 'OFFICIAL_ANNOUNCEMENT' ? 'Official • Super Admin' : 'Member'}
                    </span>
                    <p className="text-xs text-slate-400">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{msg.body}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No messages match the filters.</p>
          )}
        </div>
      )}
    </SuperAdminShell>
  );
};

export default SuperAdminChatsPage;
