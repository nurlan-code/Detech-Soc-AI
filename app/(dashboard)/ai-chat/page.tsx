"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/shared/Header";
import { aiChatApi } from "@/lib/api";
import { ChatMessage } from "@/types";
import {
  Send, Bot, User, Loader2, Trash2, Zap, Shield,
  FileSearch, AlertTriangle, Network, BookOpen, Cpu,
  Plus, MessageSquare, Clock, ChevronLeft, ChevronRight,
  Coins, Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
import { formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";
import { useCreditsStore } from "@/store/creditsStore";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: AlertTriangle, text: "How do I respond to a ransomware attack?",  color: "text-red-400",    bg: "bg-red-500/8 border-red-500/15" },
  { icon: FileSearch,    text: "Analyze IOC: 185.220.101.47",               color: "text-blue-400",   bg: "bg-blue-500/8 border-blue-500/15" },
  { icon: Network,       text: "What are signs of lateral movement?",        color: "text-purple-400", bg: "bg-purple-500/8 border-purple-500/15" },
  { icon: Shield,        text: "Create a malware containment playbook",      color: "text-green-400",  bg: "bg-green-500/8 border-green-500/15" },
  { icon: BookOpen,      text: "Explain MITRE ATT&CK tactics and techniques",color: "text-orange-400", bg: "bg-orange-500/8 border-orange-500/15" },
  { icon: Cpu,           text: "How to detect Kerberoasting attacks?",       color: "text-cyan-400",   bg: "bg-cyan-500/8 border-cyan-500/15" },
];

const COST_PER_MESSAGE = 5; // credits per AI message

// ─── Helper ───────────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-blue-400/70 rounded-full"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function titleFromMsg(content: string) {
  return content.length > 42 ? content.slice(0, 42) + "…" : content;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY = "soc-chat-history";

function loadHistory(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(convos: Conversation[]) {
  try {
    // keep last 30 conversations
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convos.slice(0, 30)));
  } catch {}
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { credits, spendCredits } = useCreditsStore();

  // Load history on mount
  useEffect(() => {
    setConversations(loadHistory());
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Persist conversations whenever they change
  useEffect(() => {
    if (conversations.length) saveHistory(conversations);
  }, [conversations]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, []);

  const loadConversation = useCallback((convo: Conversation) => {
    setActiveId(convo.id);
    setMessages(convo.messages);
    setInput("");
  }, []);

  const deleteConversation = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveHistory(next);
      return next;
    });
    if (activeId === id) startNewChat();
    toast.success("Conversation deleted");
  }, [activeId, startNewChat]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    if (credits < COST_PER_MESSAGE) {
      toast.error(`Not enough credits! Need ${COST_PER_MESSAGE} credits per message.`, { icon: "⚡" });
      return;
    }

    const userMsg: ChatMessage = { role: "user", content, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await (aiChatApi as { chat: (msgs: ChatMessage[]) => Promise<{ data: { response: string } }> }).chat(newMessages);
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: res.data.response,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      // Spend credits
      spendCredits(COST_PER_MESSAGE);

      // Persist conversation
      const now = new Date().toISOString();
      if (activeId) {
        setConversations((prev) =>
          prev.map((c) => c.id === activeId ? { ...c, messages: finalMessages, updatedAt: now } : c)
        );
      } else {
        const newConvo: Conversation = {
          id: genId(),
          title: titleFromMsg(content),
          messages: finalMessages,
          createdAt: now,
          updatedAt: now,
        };
        setActiveId(newConvo.id);
        setConversations((prev) => [newConvo, ...prev]);
      }
    } catch {
      toast.error("AI response failed");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const activeConvo = conversations.find((c) => c.id === activeId);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header title="AI Security Assistant" />

      <div className="flex-1 flex overflow-hidden">
        {/* ── History Sidebar ─────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {historyOpen && (
            <motion.aside
              key="history"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex-shrink-0 border-r border-soc-border bg-soc-surface overflow-hidden"
            >
              <div className="w-60 h-full flex flex-col">
                {/* Header */}
                <div className="p-3 border-b border-soc-border">
                  <motion.button
                    onClick={startNewChat}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-400 rounded-xl text-sm font-medium transition-colors"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="w-4 h-4" />
                    New Chat
                  </motion.button>
                </div>

                {/* Credits mini widget */}
                <div className="px-3 py-2 border-b border-soc-border">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs text-gray-400">{credits.toLocaleString()} credits</span>
                    <span className="text-[10px] text-gray-600 ml-auto">{COST_PER_MESSAGE}/msg</span>
                  </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <MessageSquare className="w-8 h-8 text-gray-700 mb-2" />
                      <p className="text-xs text-gray-600">No conversations yet</p>
                      <p className="text-[10px] text-gray-700 mt-1">Start chatting to build history</p>
                    </div>
                  ) : (
                    conversations.map((convo) => (
                      <motion.div
                        key={convo.id}
                        onClick={() => loadConversation(convo)}
                        className={cn(
                          "group flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-all text-sm",
                          activeId === convo.id
                            ? "bg-blue-600/15 border border-blue-500/20 text-blue-300"
                            : "hover:bg-white/5 border border-transparent text-gray-400 hover:text-gray-200"
                        )}
                        whileHover={{ x: 1 }}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-60" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium leading-tight">{convo.title}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-2.5 h-2.5 opacity-40" />
                            <p className="text-[10px] opacity-40">{formatRelativeTime(convo.updatedAt)}</p>
                            <span className="text-[10px] opacity-30 ml-auto">{convo.messages.length / 2 | 0} msg</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteConversation(convo.id, e)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Toggle Button ───────────────────────────────────────────────── */}
        <div className="relative flex-shrink-0 flex items-start pt-3">
          <motion.button
            onClick={() => setHistoryOpen((v) => !v)}
            className="w-5 h-8 flex items-center justify-center bg-soc-surface border border-soc-border hover:border-blue-500/30 text-gray-600 hover:text-blue-400 rounded-r-lg transition-colors -ml-px z-10"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            title={historyOpen ? "Hide history" : "Show history"}
          >
            {historyOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </motion.button>
        </div>

        {/* ── Main Chat Area ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Active conversation title */}
          {activeConvo && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-soc-border bg-soc-surface/50">
              <MessageSquare className="w-3.5 h-3.5 text-gray-600" />
              <p className="text-xs text-gray-500 truncate">{activeConvo.title}</p>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-600">
                <Coins className="w-3 h-3 text-yellow-500/70" />
                {credits.toLocaleString()}
              </span>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="max-w-2xl mx-auto pt-6"
                >
                  {/* Hero */}
                  <div className="text-center mb-8">
                    <motion.div
                      className="w-20 h-20 rounded-3xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mx-auto mb-5 relative overflow-hidden"
                      animate={{ boxShadow: ["0 0 0 rgba(59,130,246,0)", "0 0 30px rgba(59,130,246,0.2)", "0 0 0 rgba(59,130,246,0)"] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      {/* Scan line */}
                      <motion.div
                        className="absolute inset-x-0 h-px bg-blue-400/30"
                        animate={{ top: ["0%", "100%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      />
                      <Bot className="w-9 h-9 text-blue-400" />
                    </motion.div>
                    <h2 className="text-2xl font-black text-white mb-2">SOC AI Assistant</h2>
                    <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                      Powered by Claude. Ask about threat analysis, incident response, IOC investigation,
                      MITRE ATT&CK, vulnerability management, or security best practices.
                    </p>
                    <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                      <Coins className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs text-yellow-400/80">{credits.toLocaleString()} credits available · {COST_PER_MESSAGE} per message</span>
                    </div>
                  </div>

                  {/* Suggestion chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUGGESTIONS.map(({ icon: Icon, text, color, bg }, i) => (
                      <motion.button
                        key={text}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.07 }}
                        onClick={() => sendMessage(text)}
                        className={`flex items-center gap-3 px-4 py-3 border rounded-xl text-left text-sm text-gray-300 hover:text-white transition-all group ${bg}`}
                        whileHover={{ scale: 1.01, y: -1 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                        <span className="truncate">{text}</span>
                      </motion.button>
                    ))}
                  </div>

                  <p className="text-center text-xs text-gray-700 mt-6">
                    Demo mode · responses are AI-generated security guidance
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                style={{ maxWidth: "min(760px, 92%)" }}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${msg.role === "user" ? "bg-blue-600" : "bg-soc-card border border-blue-500/25"}`}>
                  {msg.role === "user"
                    ? <User className="w-4 h-4 text-white" />
                    : <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}>
                        <Bot className="w-4 h-4 text-blue-400" />
                      </motion.div>
                  }
                </div>

                {/* Bubble */}
                <div className={`rounded-2xl px-4 py-3 shadow-lg ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-soc-card border border-soc-border text-gray-300 rounded-tl-sm"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed
                      prose-p:text-gray-300 prose-headings:text-gray-100 prose-headings:font-bold
                      prose-code:text-blue-300 prose-code:bg-soc-dark prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                      prose-pre:bg-soc-dark prose-pre:border prose-pre:border-soc-border prose-pre:rounded-xl
                      prose-strong:text-gray-100 prose-li:text-gray-300 prose-a:text-blue-400
                      prose-table:text-xs prose-th:text-gray-300 prose-td:text-gray-400 prose-td:border-soc-border prose-th:border-soc-border
                    ">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                  <div className={`flex items-center gap-2 mt-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.timestamp && (
                      <p className={`text-[10px] ${msg.role === "user" ? "text-blue-200/60" : "text-gray-600"}`}>
                        {formatRelativeTime(msg.timestamp)}
                      </p>
                    )}
                    {msg.role === "assistant" && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-700">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 mr-auto"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-soc-card border border-blue-500/25 flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Zap className="w-4 h-4 text-blue-400" />
                  </motion.div>
                </div>
                <div className="bg-soc-card border border-soc-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <TypingDots />
                  <p className="text-xs text-gray-600 mt-1">AI is analyzing… <span className="text-yellow-600">-{COST_PER_MESSAGE} credits</span></p>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-soc-border p-4 bg-soc-surface">
            <div className="max-w-4xl mx-auto flex items-end gap-2">
              {messages.length > 0 && (
                <motion.button
                  onClick={startNewChat}
                  className="p-2 text-gray-700 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors flex-shrink-0"
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  title="New conversation"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              )}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={onInputChange}
                  onKeyDown={onKeyDown}
                  placeholder="Ask about threats, incidents, IOC analysis, playbooks... (Enter to send)"
                  rows={1}
                  className="w-full px-4 py-3 bg-soc-dark border border-soc-border rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none transition-colors"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
              </div>
              <motion.button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </motion.button>
            </div>
            <p className="text-[10px] text-gray-700 text-center mt-2">
              Shift+Enter for new line · Enter to send · {COST_PER_MESSAGE} credits per message
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
