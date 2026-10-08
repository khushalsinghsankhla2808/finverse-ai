import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Brain,
  Lightbulb,
  AlertTriangle,
  Trophy,
} from 'lucide-react';

import aiService from '@/services/aiService';
import { useToast } from '@/hooks/useToast';
import PageTransition from '@/components/common/PageTransition';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  sessionTitle: string;
  messages: Message[];
  updatedAt: string;
}

export const AIAssistantPage: React.FC = () => {
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    const initPage = async () => {
      const results = await Promise.allSettled([
        aiService.getSuggestions(),
        aiService.getHistory(),
        aiService.getInsights(),
      ]);

      const sugResult = results[0];
      const histResult = results[1];
      const insResult = results[2];

      if (sugResult.status === 'fulfilled') {
        setSuggestions(sugResult.value.data || []);
      }

      if (histResult.status === 'fulfilled') {
        const loadedSessions = (histResult.value.data || []).map((s: any) => ({
          id: s._id,
          sessionTitle: s.sessionTitle,
          messages: (s.messages || []).map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          updatedAt: s.updatedAt,
        }));
        setSessions(loadedSessions);

        if (loadedSessions.length > 0) {
          setActiveSessionId(loadedSessions[0].id);
          setMessages(loadedSessions[0].messages);
        }
      }

      if (insResult.status === 'fulfilled') {
        setInsights(insResult.value.data || []);
      }
    };
    initPage();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  const handleCreateNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setInputValue('');
  };

  const handleClearHistory = async () => {
    try {
      await aiService.clearHistory();
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
      showToast('Chat history cleared successfully', 'success');
    } catch (err) {
      showToast('Failed to clear chat log history', 'error');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await aiService.chat(text, activeSessionId || undefined);
      const aiMsg: Message = {
        role: 'assistant',
        content: res.data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (!activeSessionId) {
        setActiveSessionId(res.data.sessionId);
        setSessions((prev) => [
          {
            id: res.data.sessionId,
            sessionTitle: res.data.sessionTitle,
            messages: [userMsg, aiMsg],
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: [...s.messages, userMsg, aiMsg],
                  updatedAt: new Date().toISOString(),
                }
              : s
          )
        );
      }
    } catch (err) {
      showToast('Failed to fetch AI response', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-surface-sunken border border-line text-primary rounded-[var(--radius-control)]">
              <Bot size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-sans font-bold text-ink tracking-tight">FinVerse AI Assistant</h1>
              <p className="text-xs text-ink-muted font-medium">Ask questions about your spending, budgets and goals.</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-ink-subtle bg-surface-sunken border border-line px-3 py-1 rounded-[var(--radius-control)]">
            AI-generated output. Not financial advice.
          </span>
        </div>

        {/* Workspace Panels */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel: Chats List & Insights */}
          <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
            {/* Conversations manager */}
            <div className="card p-4 flex flex-col min-h-0 flex-1">
              <div className="flex justify-between items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Conversations</span>
                <button
                  onClick={handleClearHistory}
                  className="p-1 text-ink-subtle hover:text-loss transition-all cursor-pointer"
                  title="Clear all sessions"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <button
                onClick={handleCreateNewChat}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-[var(--radius-control)] border border-dashed border-line bg-surface-sunken hover:border-primary text-xs text-ink font-semibold cursor-pointer mb-3 transition-all"
              >
                <Plus size={14} /> New Chat
              </button>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {sessions.length === 0 ? (
                  <span className="text-[11px] text-ink-subtle block text-center py-4">No recent chats</span>
                ) : (
                  sessions.map((s) => {
                    const isActive = s.id === activeSessionId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSession(s.id)}
                        className={`w-full text-left p-2.5 rounded-[var(--radius-control)] text-xs font-medium truncate cursor-pointer transition-all border ${
                          isActive
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-sunken border-line text-ink-muted hover:text-ink'
                        }`}
                      >
                        {s.sessionTitle}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Smart Insights summary */}
            <div className="card p-4 flex flex-col min-h-0 flex-1 max-h-[240px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">AI Spending Insights</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px]">
                {insights.length === 0 ? (
                  <span className="text-ink-subtle block text-center py-3">Generating insights...</span>
                ) : (
                  insights.map((ins, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-surface-sunken rounded-[var(--radius-control)] border border-line flex items-start gap-2.5"
                    >
                      <div className="mt-0.5 shrink-0 text-primary">
                        {ins.type === 'warning' ? <AlertTriangle size={15} className="text-warning" /> : ins.type === 'achievement' ? <Trophy size={15} className="amount-gain" /> : <Lightbulb size={15} className="text-primary" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-ink">{ins.title}</h4>
                        <p className="text-ink-muted mt-0.5 leading-tight">{ins.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <span className="text-[10px] text-ink-subtle mt-2 font-medium block border-t border-line pt-1">
                AI-generated output. Not financial advice.
              </span>
            </div>
          </div>

          {/* Right Panel: Chat Thread Window */}
          <div className="lg:col-span-3 card p-0 flex flex-col min-h-0 justify-between">
            {/* Suggested prompts bar */}
            {messages.length === 0 && (
              <div className="p-4 border-b border-line">
                <span className="text-[9px] font-bold text-ink-subtle uppercase tracking-wider block mb-2">Suggested Queries</span>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 4).map((sug) => (
                    <button
                      key={sug}
                      onClick={() => handleSendMessage(sug)}
                      className="px-3 py-1.5 rounded-[var(--radius-control)] bg-surface-sunken border border-line hover:border-primary text-[10px] text-ink-muted font-semibold hover:text-ink cursor-pointer transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto select-none opacity-60">
                  <Brain size={48} className="text-primary" />
                  <div>
                    <h3 className="font-bold text-ink text-sm">FinVerse Financial Assistant</h3>
                    <p className="text-xs text-ink-muted mt-1 leading-normal">
                      Ask about monthly spending trends, budget limits, or investment projections. AI-generated output for informational purposes only.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={i}
                      className={`flex gap-3 max-w-[85%] ${
                        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      <div className={`p-2 rounded-[var(--radius-control)] shrink-0 w-8 h-8 flex items-center justify-center text-xs border ${
                        isUser
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface-sunken border-line text-ink'
                      }`}>
                        {isUser ? <User size={14} /> : <Bot size={14} />}
                      </div>

                      <div className={`rounded-[var(--radius-card)] px-4 py-2.5 text-xs border ${
                        isUser
                          ? 'bg-[var(--sapphire)] border-[var(--sapphire)] text-white font-medium'
                          : 'bg-surface border-line text-ink leading-relaxed'
                      }`}>
                        {isUser ? (
                          msg.content
                        ) : (
                          <div>
                            <ReactMarkdown
                              components={{
                                h1: (props) => <h1 className="text-sm font-bold text-ink mt-3 mb-1" {...props} />,
                                h2: (props) => <h2 className="text-sm font-bold text-ink mt-2.5 mb-1" {...props} />,
                                h3: (props) => <h3 className="text-xs font-bold text-ink-muted mt-2 mb-1" {...props} />,
                                p: (props) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                ul: (props) => <ul className="list-disc pl-4 mb-2 space-y-1 text-ink-muted" {...props} />,
                                ol: (props) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-ink-muted" {...props} />,
                                li: (props) => <li className="pl-0.5" {...props} />,
                                strong: (props) => <strong className="font-bold text-primary" {...props} />,
                                code: (props) => <code className="bg-surface-sunken border border-line px-1 py-0.5 rounded font-mono text-[10px]" {...props} />,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                            <span className="block mt-2 text-[9px] text-ink-subtle border-t border-line pt-1">
                              AI-generated output. Not financial advice.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Loader */}
              {isLoading && (
                <div className="flex gap-3 mr-auto max-w-[85%]">
                  <div className="p-2 rounded-[var(--radius-control)] shrink-0 w-8 h-8 flex items-center justify-center text-xs border bg-surface-sunken border-line text-ink">
                    <Bot size={14} />
                  </div>
                  <div className="rounded-[var(--radius-card)] px-4 py-2.5 text-xs border bg-surface border-line text-ink-subtle flex items-center gap-1.5 select-none">
                    <span className="w-1.5 h-1.5 bg-primary rounded-[var(--radius-control)] animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-[var(--radius-control)] animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-[var(--radius-control)] animate-pulse" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <div className="p-4 border-t border-line bg-surface-sunken rounded-b-[var(--radius-card)]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask questions about your spending, budgets and goals..."
                  value={inputValue}
                  disabled={isLoading}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="input flex-1"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="btn btn-primary shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AIAssistantPage;
