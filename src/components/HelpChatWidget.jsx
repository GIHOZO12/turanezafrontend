import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendHelpChatMessage } from '../api/support';

const ChatIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path
      d="M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4-.8L3 20l1.2-3.6A7.9 7.9 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91A9.86 9.86 0 0 0 12.04 2zm5.8 14.15c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.13.11-1.82-.12-.42-.14-.96-.32-1.65-.62-2.9-1.25-4.79-4.17-4.94-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.28.57-.35.76-.35h.55c.18 0 .41-.07.64.49.24.58.81 2.02.88 2.16.07.14.11.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.28.71 1.17 1.53 1.89 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.18-.28.36-.23.6-.14.24.09 1.55.73 1.82.87.27.14.44.2.51.31.07.11.07.65-.17 1.33z" />
  </svg>
);

// Company WhatsApp line (also shown in the landing page's Contact section).
// Pre-filled with a greeting so staff immediately know the chat came from
// the app/website rather than an organic WhatsApp contact.
const WHATSAPP_PREFILL = "Hello, I'm messaging from the Turaneza App (turanezapp.rw).";
const WHATSAPP_LINK = `https://wa.me/250794199534?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;



const HelpChatWidget = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm the TURANEZA assistant. Ask me anything about plots, groups, or investments." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const history = messages.map((m) => ({ role: m.from === 'user' ? 'user' : 'model', text: m.text }));
    setMessages((prev) => [...prev, { from: 'user', text: trimmed }]);
    setInput('');
    setSending(true);

    try {
      const response = await sendHelpChatMessage(trimmed, history);
      setMessages((prev) => [...prev, { from: 'bot', text: response.reply }]);
    } catch (error) {
      const requiresLogin = error.status === 401 || error.status === 403;
   
      const text = requiresLogin
        ? 'Please log in to chat with the assistant.'
        : error.payload?.detail || 'Sorry, the assistant is unavailable right now.';
      setMessages((prev) => [...prev, { from: 'bot', text, isError: true, link: requiresLogin ? '/auth' : null }]);
    } finally {
      setSending(false);
    }
  };

  const chatMessages = useMemo(
    () =>
      messages.map((m, idx) => (
        <div
          key={idx}
          className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
            m.from === 'user' ? 'ml-auto bg-primary text-white' : m.isError ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-800'
          }`}
        >
          <p className="whitespace-pre-wrap">{m.text}</p>
          {m.link ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(m.link);
              }}
              className="mt-1 text-xs font-semibold text-primary underline"
            >
              Log in
            </button>
          ) : null}
        </div>
      )),
    [messages, navigate],
  );

  return (
    <div className="fixed bottom-3 right-3 z-50 sm:bottom-4 sm:right-4">
      {/* AI assistant temporarily disabled — commented out, not deleted, so
      it's a one-line uncomment to bring back.
      {open ? (
        <div className="mb-3 flex max-h-[min(32rem,calc(100vh-6rem))] w-[calc(100vw-1.5rem)] max-w-80 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex flex-shrink-0 items-center justify-between rounded-t-3xl bg-primary px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">TURANEZA Assistant</p>
              <p className="text-[11px] text-white/80">Ask about plots, groups & investments</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close help chat"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold hover:bg-white/30"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-white px-4 py-3">
            {chatMessages}
            {sending ? <div className="max-w-[90%] rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500">Typing...</div> : null}
          </div>
          <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3">
            {messages.length <= 1 ? (
              <div className="mb-2 flex flex-wrap gap-2" />
            ) : null}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                placeholder="Ask a question..."
                disabled={sending}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleSend(input)}
                disabled={sending}
                className="flex-shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
      */}

      <div className="flex flex-col items-end gap-3">
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:brightness-95 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3"
        >
          <WhatsAppIcon className="h-5 w-5 sm:hidden" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>

        {/* AI assistant toggle button — commented out alongside the panel above.
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-primary/90 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3"
          aria-label="Open help chat"
        >
          <ChatIcon className="h-5 w-5 sm:hidden" />
          <span className="hidden sm:inline">Help</span>
        </button>
        */}
      </div>
    </div>
  );
};

export default HelpChatWidget;
