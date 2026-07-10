import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Brain,
} from 'lucide-react';

import aiService from '@/services/aiService';
import { useToast } from '@/hooks/useToast';
import { useCurrencyStore } from '@/stores/currencyStore';
import PageTransition from '@/components/common/PageTransition';

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

// Simple Helper to highlight Currency values (e.g. ₹5,000) in gold
const renderHighlightedContent = (text: string, currencySymbol: string) => {
  // Regex to match Rupee symbol followed by numbers and comma formatting
  const parts = text.split(new RegExp(`(\\\${currencySymbol}\\d+(?:,\\d+)*(?:\\.\\d+)?)`, 'g'));
  return parts.map((part, i) => {
    if (part.startsWith(currencySymbol)) {
      return (
        <span key={i} className="text-yellow-500 font-bold font-mono">
          {part}
        </span>
      );
    }
    return part;
  });
};

export const AIAssistantPage: React.FC = () => {
  const { showToast } = useToast();
  const { activeCurrency } = useCurrencyStore();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  // Load suggestions & history on mount
  useEffect(() => {
    const initPage = async () => {
      try {
        const [sugRes, histRes, insRes] = await Promise.all([
          aiService.getSuggestions(),
          aiService.getHistory(),
          aiService.getInsights(),
        ]);

        setSuggestions(sugRes.data || []);
        
        const loadedSessions = (histRes.data || []).map((s: any) => ({
          id: s._id,
          sessionTitle: s.sessionTitle,
          messages: s.messages.map((m: any) => ({
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

        setInsights(insRes.data || []);
      } catch (err) {
        showToast('Failed to load assistant details', 'error');
      }
    };
    initPage();
  }, [showToast]);

  // Scroll to bottom on message updates
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

    // Optimistic user bubble append
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
      
      // Update session references
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
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-primary/10 border border-purple-primary/20 text-purple-primary rounded-xl">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">FinVerse AI Assistant</h1>
            <p className="text-xs text-white/50 font-medium">Your personal generative financial consultant</p>
          </div>
        </div>

        {/* Workspace Panels */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel: Chats List & Insights */}
          <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
            {/* Chats Session manager */}
            <div className="glassmorphism bg-bg-surface/30 p-4 border border-white/8 rounded-2xl flex flex-col min-h-0 flex-1">
              <div className="flex justify-between items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Conversations</span>
                <button
                  onClick={handleClearHistory}
                  className="p-1 text-white/30 hover:text-red-negative transition-all cursor-pointer"
                  title="Clear all sessions"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <button
                onClick={handleCreateNewChat}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-white/10 hover:border-purple-primary bg-white/2 hover:bg-white/5 text-xs text-white/80 font-semibold cursor-pointer mb-3 transition-all"
              >
                <Plus size={14} /> New Chat
              </button>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {sessions.length === 0 ? (
                  <span className="text-[11px] text-white/30 block text-center py-4">No recent chats</span>
                ) : (
                  sessions.map((s) => {
                    const isActive = s.id === activeSessionId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSession(s.id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-medium truncate cursor-pointer transition-all border ${
                          isActive
                            ? 'bg-purple-primary/10 border-purple-primary/30 text-white'
                            : 'bg-white/2 border-white/5 text-white/60 hover:bg-white/4'
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
            <div className="glassmorphism bg-bg-surface/30 p-4 border border-white/8 rounded-2xl flex flex-col min-h-0 flex-1 max-h-[220px]">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">AI Spending Insights</span>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px]">
                {insights.length === 0 ? (
                  <span className="text-white/30 block text-center py-3">Generating insights...</span>
                ) : (
                  insights.map((ins, i) => (
                    <div
                      key={i}
                      className="p-2 bg-white/2 hover:bg-white/4 rounded-xl border border-white/5 flex items-start gap-2.5"
                    >
                      <span className="mt-0.5">
                        {ins.type === 'warning' ? '⚠️' : ins.type === 'achievement' ? '🏆' : '💡'}
                      </span>
                      <div>
                        <h4 className="font-bold text-white/90">{ins.title}</h4>
                        <p className="text-white/60 mt-0.5 leading-tight">{ins.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Chat Thread Window */}
          <div className="lg:col-span-3 glassmorphism bg-bg-surface/30 border border-white/8 rounded-2xl flex flex-col min-h-0 justify-between">
            {/* Suggested prompts bar (only if new session) */}
            {messages.length === 0 && (
              <div className="p-4 border-b border-white/5">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-2">Predefined AI Queries Suggestions</span>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 4).map((sug) => (
                    <button
                      key={sug}
                      onClick={() => handleSendMessage(sug)}
                      className="px-3 py-1.5 rounded-full bg-white/3 border border-white/5 hover:border-purple-primary text-[10px] text-white/70 font-semibold hover:text-white cursor-pointer transition-all"
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
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto select-none opacity-40">
                  <Brain size={48} className="text-purple-primary" />
                  <div>
                    <h3 className="font-bold text-white text-sm">FinVerse Financial Assistant</h3>
                    <p className="text-xs text-white/60 mt-1 leading-normal">
                      Ask me about monthly spending trends, budget limits, or investment returns projection. Try submitting questions below.
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
                      <div className={`p-2 rounded-xl shrink-0 w-8 h-8 flex items-center justify-center text-xs border ${
                        isUser
                          ? 'bg-purple-primary/10 border-purple-primary/20 text-purple-primary'
                          : 'bg-white/5 border-white/10 text-white/85'
                      }`}>
                        {isUser ? <User size={14} /> : <Bot size={14} />}
                      </div>

                      <div className={`rounded-2xl px-4 py-2.5 text-xs border shadow-xs ${
                        isUser
                          ? 'bg-purple-primary border-purple-primary/40 text-white rounded-tr-none'
                          : 'bg-bg-surface/50 border-white/5 text-white/90 rounded-tl-none leading-relaxed'
                      }`}>
                        {isUser ? msg.content : renderHighlightedContent(msg.content, activeCurrency.symbol)}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Loader */}
              {isLoading && (
                <div className="flex gap-3 mr-auto max-w-[85%]">
                  <div className="p-2 rounded-xl shrink-0 w-8 h-8 flex items-center justify-center text-xs border bg-white/5 border-white/10 text-white/85">
                    <Bot size={14} />
                  </div>
                  <div className="rounded-2xl px-4 py-2.5 text-xs border bg-bg-surface/50 border-white/5 text-white/50 rounded-tl-none flex items-center gap-1.5 select-none">
                    <span className="w-1.5 h-1.5 bg-purple-primary rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-purple-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-purple-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <div className="p-4 border-t border-white/5 bg-bg-surface/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-xl px-4 py-2 focus-within:border-purple-primary transition-all"
              >
                <input
                  type="text"
                  placeholder="Ask FinVerse AI..."
                  value={inputValue}
                  disabled={isLoading}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-hidden focus:ring-0 focus:border-transparent py-1 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="p-1.5 rounded-lg bg-purple-primary text-white hover:bg-purple-primary/95 transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-purple-primary disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={12} />
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
