import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Key,
  MessageCircle,
  Star,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useGetMyAgents } from "../hooks/useQueries";
import {
  type AgentChatMessage,
  type Match,
  getAgentMessages,
  getGroqApiKey,
  getMatches,
  respondToMatch,
  runGroqAgentChat,
  saveGroqApiKey,
} from "../utils/matchingStore";
import AgentAvatar from "./AgentAvatar";

// ─── GroqApiKeyInput ───────────────────────────────────────────────────────────

interface GroqApiKeyInputProps {
  onSave: (key: string) => void;
  onCancel?: () => void;
}

function GroqApiKeyInput({ onSave, onCancel }: GroqApiKeyInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    saveGroqApiKey(value.trim());
    onSave(value.trim());
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-4 bg-noir-900 border border-neon-cyan/20 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-neon-cyan" />
          <span className="font-mono text-xs text-neon-cyan tracking-wider">
            GROQ API ANAHTARI (Gerçek AI Sohbet)
          </span>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            data-ocid="groq.input"
            type="password"
            placeholder="gsk_..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 font-mono text-xs bg-noir-800 border-neon-cyan/30 text-gray-200 placeholder-gray-600 focus:border-neon-cyan/60 focus:ring-neon-cyan/20 h-9"
          />
          <Button
            data-ocid="groq.save_button"
            type="submit"
            disabled={!value.trim()}
            className="h-9 px-4 font-mono text-xs bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/20 hover:border-neon-cyan disabled:opacity-40"
            variant="outline"
          >
            KAYDET & BAŞLAT
          </Button>
          {onCancel && (
            <Button
              data-ocid="groq.cancel_button"
              type="button"
              onClick={onCancel}
              variant="ghost"
              className="h-9 px-3 font-mono text-xs text-gray-500 hover:text-gray-300"
            >
              İPTAL
            </Button>
          )}
        </form>
        <a
          href="https://console.groq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 font-mono text-xs text-gray-600 hover:text-neon-cyan transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          console.groq.com'dan ücretsiz API anahtarı al
        </a>
      </div>
    </motion.div>
  );
}

// ─── CompatibilityGauge ────────────────────────────────────────────────────────

function CompatibilityGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#00f5ff" : score >= 60 ? "#ffd700" : "#ff4444";
  const label = score >= 80 ? "MÜKEMMEL" : score >= 60 ? "İYİ" : "DÜŞÜK";

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
          role="img"
          aria-label={`Compatibility score: ${score}%`}
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
              transition: "stroke-dashoffset 1s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-bold text-xl" style={{ color }}>
            {score}%
          </span>
        </div>
      </div>
      <span className="font-mono text-xs tracking-widest" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// ─── ChatBubble ────────────────────────────────────────────────────────────────

function ChatBubble({
  msg,
  isLeft,
  seed,
}: {
  msg: AgentChatMessage;
  isLeft: boolean;
  seed: string;
}) {
  const time = new Date(msg.timestamp).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`flex items-end gap-2 ${isLeft ? "" : "flex-row-reverse"}`}
    >
      <AgentAvatar seed={seed} size={28} className="shrink-0" />
      <div className={`max-w-xs lg:max-w-md ${isLeft ? "" : ""}`}>
        <div
          className={`px-4 py-3 font-mono text-sm leading-relaxed ${
            isLeft
              ? "bg-noir-700 border border-neon-cyan/20 text-gray-300"
              : "bg-noir-800 border border-neon-magenta/20 text-gray-300"
          }`}
          style={{
            boxShadow: isLeft
              ? "0 0 10px rgba(0,245,255,0.05)"
              : "0 0 10px rgba(255,0,170,0.05)",
          }}
        >
          <p
            className={`text-xs font-bold mb-1 ${isLeft ? "text-neon-cyan" : "text-neon-magenta"}`}
          >
            {msg.senderName}
          </p>
          {msg.content}
        </div>
        <p
          className={`font-mono text-xs text-gray-700 mt-1 ${isLeft ? "pl-2" : "pr-2 text-right"}`}
        >
          {time}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MatchDetailPage() {
  const { id } = useParams({ from: "/match/$id" });
  const { data: myAgents, isLoading: agentsLoading } = useGetMyAgents();
  const [isRunningChat, setIsRunningChat] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<AgentChatMessage[]>(
    [],
  );
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [savedApiKey, setSavedApiKey] = useState<string>(() => getGroqApiKey());
  const [usedGroq, setUsedGroq] = useState(false);
  const revealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const myAgentIds = useMemo(
    () => (myAgents ?? []).map((a) => a.id),
    [myAgents],
  );

  const refresh = useCallback(() => {
    if (myAgentIds.length === 0) return;
    const all = getMatches(myAgentIds);
    setMatch(all.find((m) => m.id === id) ?? null);
    const msgs = id ? getAgentMessages(id) : [];
    setMessages(msgs);
    setVisibleMessages(msgs); // show all immediately on reload
  }, [id, myAgentIds]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-scroll to bottom when visible messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers scroll
  useEffect(() => {
    const el = document.getElementById("agent-chat-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleMessages]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      for (const t of revealTimersRef.current) clearTimeout(t);
    };
  }, []);

  function revealMessagesProgressively(msgs: AgentChatMessage[]) {
    for (const t of revealTimersRef.current) clearTimeout(t);
    revealTimersRef.current = [];
    setVisibleMessages([]);

    msgs.forEach((msg, i) => {
      const t = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, msg]);
      }, i * 600);
      revealTimersRef.current.push(t);
    });
  }

  async function handleRunChat(apiKey?: string) {
    if (!match) return;
    const key = apiKey ?? savedApiKey;
    setIsRunningChat(true);
    setShowApiKeyInput(false);

    try {
      const result = await runGroqAgentChat(match, key || undefined);

      // Update match in state
      const all = getMatches(myAgentIds);
      setMatch(all.find((m) => m.id === id) ?? null);
      setMessages(result.messages);
      setUsedGroq(result.usedGroq);

      // Progressive reveal
      revealMessagesProgressively(result.messages);

      toast.success(
        `Sohbet tamamlandı! Uyum skoru: ${result.score}% ${result.score >= 80 ? "🔥" : ""}${result.usedGroq ? " 🤖 Groq AI" : " (Simüle)"}`,
      );
    } catch {
      toast.error("Sohbet başlatılamadı. Tekrar deneyin.");
      refresh();
    } finally {
      setIsRunningChat(false);
    }
  }

  function handleGroqKeySave(key: string) {
    setSavedApiKey(key);
    handleRunChat(key);
  }

  function handleStartChat() {
    const key = getGroqApiKey();
    if (key) {
      handleRunChat(key);
    } else {
      setShowApiKeyInput(true);
    }
  }

  function handleRespond(accept: boolean) {
    if (!match) return;
    const isAgent1 = match.agent1Id === match.myAgentId;
    respondToMatch(match.id, match.myAgentId, isAgent1, accept);
    refresh();
    if (accept) {
      toast.success(
        "Kabul edildi! Karşı taraf da kabul ederse sohbet açılır. 🎉",
      );
    } else {
      toast.error("Eşleşme reddedildi.");
    }
  }

  const isPerfectMatch = (match?.compatibilityScore ?? 0) >= 80;
  const isAgent1 = match ? match.agent1Id === match.myAgentId : false;
  const myDecision = match
    ? isAgent1
      ? match.agent1Accepted
      : match.agent2Accepted
    : null;
  const canRespond = match?.status === "notified" && myDecision === null;
  const isHumanAccepted = match?.status === "humanAccepted";

  if (agentsLoading) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 py-8 space-y-6"
        data-ocid="match.loading_state"
      >
        <Skeleton className="h-8 w-32 bg-gray-800" />
        <Skeleton className="h-40 w-full bg-gray-800" />
        <Skeleton className="h-96 w-full bg-gray-800" />
      </div>
    );
  }

  if (!match) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 py-16 text-center"
        data-ocid="match.error_state"
      >
        <p className="font-mono text-gray-500">Eşleşme bulunamadı.</p>
        <Link
          to="/notifications"
          className="block mt-4 font-mono text-neon-cyan text-sm hover:underline"
        >
          ← Bildirimlere Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        to="/notifications"
        data-ocid="match.link"
        className="inline-flex items-center gap-2 font-mono text-sm text-gray-500 hover:text-neon-cyan transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        BİLDİRİMLER
      </Link>

      {/* Perfect Match Banner */}
      <AnimatePresence>
        {isPerfectMatch && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 border-2 border-neon-magenta/60 bg-neon-magenta/10 flex items-center justify-center gap-3 shadow-neon-magenta"
          >
            <Star className="w-5 h-5 text-neon-magenta animate-pulse" />
            <span className="font-mono font-bold text-neon-magenta tracking-widest glow-magenta">
              MÜKEMMEL EŞLEŞME! 🔥
            </span>
            <Star className="w-5 h-5 text-neon-magenta animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agents header */}
      <div className="bg-noir-800 border border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-center gap-6">
          {/* Agent 1 */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div
                className={`absolute -inset-2 rounded-full blur-md ${isPerfectMatch ? "bg-neon-cyan/30" : "bg-neon-cyan/10"}`}
              />
              <AgentAvatar
                seed={match.agent1Seed}
                size={72}
                className="relative"
              />
            </div>
            <span className="font-mono font-bold text-sm text-neon-cyan tracking-wide">
              {match.agent1Name}
            </span>
          </div>

          {/* VS + Score */}
          <div className="flex flex-col items-center gap-3">
            <div className="font-mono text-xs text-gray-600 tracking-widest">
              VS
            </div>
            <CompatibilityGauge score={match.compatibilityScore} />
          </div>

          {/* Agent 2 */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div
                className={`absolute -inset-2 rounded-full blur-md ${isPerfectMatch ? "bg-neon-magenta/30" : "bg-neon-magenta/10"}`}
              />
              <AgentAvatar
                seed={match.agent2Seed}
                size={72}
                className="relative"
              />
            </div>
            <span className="font-mono font-bold text-sm text-neon-magenta tracking-wide">
              {match.agent2Name}
            </span>
          </div>
        </div>
      </div>

      {/* Human Accepted Banner */}
      {isHumanAccepted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-neon-cyan/10 border border-neon-cyan/40 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-neon-cyan" />
            <span className="font-mono font-bold text-neon-cyan text-sm tracking-wider">
              SOHBET AÇILDI
            </span>
          </div>
          <Link
            to="/chat/$id"
            params={{ id: match.id }}
            data-ocid="match.secondary_button"
            className="font-mono text-xs text-neon-cyan hover:text-white border border-neon-cyan/40 px-3 py-1.5 hover:bg-neon-cyan/20 transition-all"
          >
            SOHBETE GİT →
          </Link>
        </motion.div>
      )}

      {/* Agent Chat Transcript */}
      <div className="bg-noir-800 border border-gray-700 mb-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-neon-cyan" />
            <span className="font-mono text-sm text-neon-cyan tracking-wider">
              AJAN SOHBETİ
            </span>
            {messages.length > 0 && (
              <AnimatePresence mode="wait">
                {usedGroq ? (
                  <motion.span
                    key="groq"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-2 py-0.5 font-mono text-xs font-bold tracking-widest border"
                    style={{
                      color: "#00e676",
                      borderColor: "rgba(0,230,118,0.4)",
                      backgroundColor: "rgba(0,230,118,0.08)",
                      boxShadow: "0 0 8px rgba(0,230,118,0.2)",
                    }}
                  >
                    GROQ AI
                  </motion.span>
                ) : (
                  <motion.span
                    key="sim"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-2 py-0.5 font-mono text-xs font-bold tracking-widest border border-gray-600 bg-gray-800/60 text-gray-500"
                  >
                    SİMÜLE
                  </motion.span>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Change key button */}
          {savedApiKey && messages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowApiKeyInput((v) => !v)}
              className="flex items-center gap-1 font-mono text-xs text-gray-600 hover:text-neon-cyan transition-colors"
              data-ocid="groq.toggle"
            >
              <Key className="w-3 h-3" />
              anahtar değiştir
              {showApiKeyInput ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* Collapsible API key section when no key saved OR toggled */}
        <AnimatePresence>
          {showApiKeyInput && (
            <div className="px-4 pt-3">
              <GroqApiKeyInput
                onSave={handleGroqKeySave}
                onCancel={() => setShowApiKeyInput(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            {/* Groq key prompt if not set */}
            <AnimatePresence>
              {showApiKeyInput ? (
                <div className="w-full px-4">
                  <GroqApiKeyInput
                    onSave={handleGroqKeySave}
                    onCancel={() => setShowApiKeyInput(false)}
                  />
                </div>
              ) : (
                <motion.div
                  key="start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  {!savedApiKey && (
                    <p className="font-mono text-xs text-gray-600 text-center px-4">
                      Gerçek AI sohbeti için Groq API anahtarı ekleyebilirsin —
                      ya da şablonla devam et.
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Real AI button */}
                    {!savedApiKey && (
                      <button
                        type="button"
                        data-ocid="groq.open_modal_button"
                        onClick={() => setShowApiKeyInput(true)}
                        className="flex items-center gap-2 px-5 py-2.5 border font-mono text-xs tracking-wider transition-all"
                        style={{
                          color: "#00e676",
                          borderColor: "rgba(0,230,118,0.4)",
                          backgroundColor: "rgba(0,230,118,0.06)",
                        }}
                      >
                        <Key className="w-3.5 h-3.5" />
                        GROQ AI ile BAŞLAT
                      </button>
                    )}

                    {/* Start chat button */}
                    <button
                      type="button"
                      data-ocid="match.primary_button"
                      onClick={handleStartChat}
                      disabled={isRunningChat}
                      className="flex items-center gap-2 px-6 py-3 border border-neon-cyan/40 text-neon-cyan font-mono text-sm tracking-wider hover:bg-neon-cyan/10 hover:border-neon-cyan transition-all disabled:opacity-50"
                    >
                      {isRunningChat ? (
                        <>
                          <div
                            className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                            style={{
                              borderColor: "#00f5ff",
                              borderTopColor: "transparent",
                            }}
                          />
                          {savedApiKey ? "GROQ AI ÜRETIYOR..." : "KONUŞUYOR..."}
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4" />
                          {savedApiKey ? "AI SOHBETİ BAŞLAT" : "SOHBET BAŞLAT"}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            {/* Generating spinner overlay */}
            <AnimatePresence>
              {isRunningChat && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-3 py-3 border-b border-gray-700/50"
                  data-ocid="match.loading_state"
                >
                  <div
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{
                      borderColor: "#00f5ff",
                      borderTopColor: "transparent",
                      filter: "drop-shadow(0 0 6px #00f5ff)",
                    }}
                  />
                  <span
                    className="font-mono text-xs tracking-widest"
                    style={{
                      color: "#00f5ff",
                      textShadow: "0 0 8px #00f5ff88",
                    }}
                  >
                    GROQ AI ÜRETIYOR...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              id="agent-chat-scroll"
              className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700"
            >
              <AnimatePresence>
                {visibleMessages.map((msg) => {
                  const isLeft = msg.sender === match.agent1Id;
                  const seed = isLeft ? match.agent1Seed : match.agent2Seed;
                  return (
                    <ChatBubble
                      key={msg.id}
                      msg={msg}
                      isLeft={isLeft}
                      seed={seed}
                    />
                  );
                })}
              </AnimatePresence>

              {/* Typing indicator while generating */}
              <AnimatePresence>
                {isRunningChat && visibleMessages.length < messages.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 pl-2"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-neon-cyan/60 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-xs text-gray-600">
                      yazıyor...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Decision buttons */}
      {canRespond && (
        <div className="bg-noir-800 border border-gray-700 p-5">
          <p className="font-mono text-sm text-gray-400 text-center mb-4 tracking-wide">
            Bu eşleşmeyi kabul ediyor musunuz?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              data-ocid="match.delete_button"
              onClick={() => handleRespond(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-500/50 text-red-400 font-mono text-sm tracking-wider hover:bg-red-500/10 hover:border-red-500 transition-all"
            >
              <X className="w-5 h-5" />
              REDDET
            </button>
            <button
              type="button"
              data-ocid="match.confirm_button"
              onClick={() => handleRespond(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-neon-magenta/50 text-neon-magenta font-mono text-sm tracking-wider hover:bg-neon-magenta/10 hover:border-neon-magenta transition-all shadow-neon-magenta-sm"
            >
              <Check className="w-5 h-5" />
              KABUL ET
            </button>
          </div>
        </div>
      )}

      {/* Already responded */}
      {match.status === "notified" && myDecision !== null && (
        <div className="bg-noir-800 border border-gray-700 p-4 text-center">
          <p className="font-mono text-sm text-gray-500">
            {myDecision ? (
              <span className="text-neon-cyan">
                ✓ Kabul ettin — karşı tarafın cevabı bekleniyor
              </span>
            ) : (
              <span className="text-red-400">✗ Reddedildi</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
