import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../hooks/AppContext';
import { api, fmt } from '../lib/api';

const QUICK_PROMPTS = [
  "When should I increase weight?",
  "Should I eat before training?",
  "My chest feels like it never grows. Why?",
  "How much sleep do I need to build muscle?",
  "Is creatine worth taking?",
];

export default function CoachPanel({ onOpenUpgrade }) {
  const { userProfile, userSubscription, setUserSubscription, userPlan, appLanguage, showToast } = useApp();
  const [view, setView]             = useState('chat'); // chat | history
  const [messages, setMessages]     = useState([]);    // [{role,content,id}]
  const [input, setInput]           = useState('');
  const [sending, setSending]       = useState(false);
  const [convMessages, setConvMessages] = useState([]); // raw API messages
  const [convId, setConvId]         = useState(null);
  const [convTitle, setConvTitle]   = useState('Your AI Coach');
  const [history, setHistory]       = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [checkinState, setCheckinState] = useState(null); // null | {feeling,difficulty,notes,summary}
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const autoSaveTimer = useRef(null);

  const name = userProfile?.name || 'there';

  // Init greeting
  useEffect(() => {
    const greeting = `Hey ${name}! I'm your AI coach. I know your programme, your history, and your goals. Ask me anything.`;
    setMessages([{ role: 'ai', content: greeting, id: 'init' }]);
  }, [name]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const scheduleAutoSave = useCallback(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!convMessages.length) return;
      const firstUser = convMessages.find(m => m.role === 'user');
      const title = firstUser ? firstUser.content.slice(0, 50) : 'Conversation';
      const res = await api('/api/conversations', 'POST', { id: convId, title, messages: convMessages });
      if (res?.conversation && !convId) setConvId(res.conversation.id);
    }, 3000);
  }, [convId, convMessages]);

  async function sendMsg(text) {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: msg, id: Date.now() }];
    setMessages(newMessages);
    setSending(true);

    const newConvMessages = [...convMessages, { role: 'user', content: msg, timestamp: Date.now() }];
    setConvMessages(newConvMessages);

    // Typing indicator
    const typingId = 'typing-' + Date.now();
    setMessages(prev => [...prev, { role: 'typing', content: '', id: typingId }]);

    const res = await api('/api/chat', 'POST', {
      messages: newConvMessages.map(m => ({ role: m.role, content: m.content })),
      language: appLanguage,
    });

    // Remove typing
    setMessages(prev => prev.filter(m => m.id !== typingId));
    setSending(false);

    if (res?.error === 'message_limit_reached') {
      setMessages(prev => prev.filter(m => m.role !== 'user' || m.id !== Date.now()));
      setConvMessages(prev => prev.slice(0, -1));
      onOpenUpgrade?.('steel');
      return;
    }

    if (res?.reply) {
      const updatedConv = [...newConvMessages, { role: 'assistant', content: res.reply, timestamp: Date.now() }];
      setConvMessages(updatedConv);
      setMessages(prev => [...prev, { role: 'ai', content: res.reply, id: 'ai-' + Date.now() }]);
      scheduleAutoSave();

      // Increment usage optimistically
      if (userSubscription && !userSubscription.isExempt && !userSubscription.hasUnlimitedCoach) {
        setUserSubscription(prev => ({ ...prev, coachUsage: (prev?.coachUsage || 0) + 1 }));
        setTimeout(async () => {
          const sub = await api('/api/subscription');
          if (sub) setUserSubscription(sub);
        }, 3500);
      }
    } else {
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection error — check your internet connection.', id: 'err-' + Date.now() }]);
    }
  }

  function newConversation() {
    setConvId(null);
    setConvMessages([]);
    setConvTitle('Your AI Coach');
    const greeting = `Hey ${name}! I'm your AI coach. Ask me anything about your training.`;
    setMessages([{ role: 'ai', content: greeting, id: 'init-' + Date.now() }]);
    setView('chat');
  }

  async function loadHistory() {
    setHistoryLoading(true);
    const res = await api('/api/conversations');
    setHistory(res?.conversations || []);
    setHistoryLoading(false);
  }

  async function loadConversation(id, title) {
    const res = await api(`/api/conversations/${id}`);
    if (!res?.conversation) { showToast('Failed to load', 'error'); return; }
    const conv = res.conversation;
    setConvId(conv.id);
    setConvMessages(conv.messages || []);
    setConvTitle(conv.title || 'Conversation');
    setMessages((conv.messages || []).map((m, i) => ({
      role: m.role === 'user' ? 'user' : 'ai',
      content: m.content,
      id: `loaded-${i}`,
    })));
    setView('chat');
  }

  async function deleteConversation(e, id) {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    await api(`/api/conversations/${id}`, 'DELETE');
    if (convId === id) newConversation();
    loadHistory();
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  }

  const sub = userSubscription || {};
  const showCounter = !sub.isExempt && !sub.hasUnlimitedCoach;

  return (
    <div id="panel-coach" className="panel active" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Sub-tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div id="tab-chat" className={`chat-tab${view === 'chat' ? ' active' : ''}`} onClick={() => setView('chat')}>💬 Chat</div>
          <div id="tab-history" className={`chat-tab${view === 'history' ? ' active' : ''}`} onClick={() => { setView('history'); loadHistory(); }}>🕐 History</div>
          <button
            className="new-chat-btn"
            onClick={newConversation}
            style={{ marginLeft: 'auto', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 8, padding: '6px 12px', fontFamily: "'DM Mono', monospace", fontSize: 10, cursor: 'pointer', margin: '6px 10px 6px auto', letterSpacing: 1 }}
          >+ New</button>
        </div>

        {/* CHAT VIEW */}
        {view === 'chat' && (
          <div id="view-chat" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Header */}
            <div className="chat-header" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontSize: 28 }}>🤖</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div id="chatTitle" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 1 }}>{convTitle}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }}></span>
                  ONLINE · Claude
                </div>
              </div>
              {showCounter && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', textAlign: 'right' }}>
                  <span style={{ color: 'var(--text)' }}>{sub.coachUsage || 0}</span>/{sub.coachLimit || 20}
                  <div style={{ fontSize: 9 }}>MSGS</div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div id="chatMessages" className="scroll-content" style={{ flex: 1, padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map(msg => {
                if (msg.role === 'typing') {
                  return (
                    <div key={msg.id} className="message" style={{ display: 'flex', gap: 8 }}>
                      <div style={{ fontSize: 20 }}>🤖</div>
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 1, marginBottom: 4 }}>AI COACH</div>
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                          {[0,1,2].map(i => (
                            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', animation: `bounce 1.2s ${i * 0.2}s infinite` }}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ background: 'rgba(232,255,61,0.08)', border: '1px solid rgba(232,255,61,0.2)', borderRadius: 12, padding: '10px 12px', fontSize: 13, lineHeight: 1.55, color: 'var(--text)', maxWidth: '80%' }}>
                        {msg.content}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className="message" style={{ display: 'flex', gap: 8 }}>
                    <div style={{ fontSize: 20, flexShrink: 0 }}>🤖</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 1, marginBottom: 4 }}>AI COACH · NOW</div>
                      <div
                        className="msg-bubble"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', fontSize: 13, lineHeight: 1.55, color: 'var(--text)' }}
                        dangerouslySetInnerHTML={{ __html: fmt(msg.content) }}
                      />
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="chat-input-area" style={{ borderTop: '1px solid var(--border)', padding: '10px 14px 12px', flexShrink: 0 }}>
              <div className="quick-prompts" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 8, paddingBottom: 2, scrollbarWidth: 'none' }}>
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} className="quick-btn" onClick={() => sendMsg(p)}
                    style={{ flexShrink: 0, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 20, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                    {p.length > 22 ? p.slice(0, 22) + '...' : p}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  id="chatInput"
                  ref={inputRef}
                  className="chat-input"
                  placeholder="Ask your coach..."
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: 14, resize: 'none', outline: 'none', minHeight: 40 }}
                />
                <button
                  id="sendBtn"
                  onClick={() => sendMsg()}
                  disabled={sending || !input.trim()}
                  style={{ background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: 10, width: 40, height: 40, fontSize: 18, fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sending || !input.trim() ? 0.5 : 1 }}
                >↑</button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY VIEW */}
        {view === 'history' && (
          <div id="view-history" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>PAST CONVERSATIONS</div>
            <div id="conversationList" className="scroll-content" style={{ flex: 1, padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {historyLoading ? (
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
              ) : history.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>No past conversations yet.<br/>Start chatting to save history.</div>
              ) : (
                history.map(c => (
                  <div
                    key={c.id}
                    onClick={() => loadConversation(c.id, c.title)}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || 'Untitled'}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                        {new Date(c.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <button
                      onClick={e => deleteConversation(e, c.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
                    >✕</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
