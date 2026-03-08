import { Input } from "@/components/ui/input";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGetCallerUserProfile, useGetMyAgents } from "../hooks/useQueries";
import {
  type HumanMessage,
  type Match,
  getHumanMessages,
  getMatches,
  sendHumanMessage,
} from "../utils/matchingStore";
import AgentAvatar from "./AgentAvatar";

function MessageBubble({ msg }: { msg: HumanMessage }) {
  const time = new Date(msg.timestamp).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-xs lg:max-w-md ${msg.isMe ? "" : ""}`}>
        {!msg.isMe && (
          <p className="font-mono text-xs text-neon-cyan mb-1 pl-1">
            {msg.senderName}
          </p>
        )}
        <div
          className={`px-4 py-3 font-mono text-sm leading-relaxed ${
            msg.isMe
              ? "bg-neon-magenta/20 border border-neon-magenta/40 text-gray-200"
              : "bg-noir-700 border border-neon-cyan/20 text-gray-300"
          }`}
          style={{
            boxShadow: msg.isMe
              ? "0 0 12px rgba(255,0,170,0.1)"
              : "0 0 12px rgba(0,245,255,0.05)",
          }}
        >
          {msg.content}
        </div>
        <p
          className={`font-mono text-xs text-gray-700 mt-1 ${msg.isMe ? "text-right pr-1" : "pl-1"}`}
        >
          {time}
        </p>
      </div>
    </motion.div>
  );
}

export default function HumanChatPage() {
  const { id } = useParams({ from: "/chat/$id" });
  const { data: myAgents } = useGetMyAgents();
  const { data: userProfile } = useGetCallerUserProfile();
  const [input, setInput] = useState("");
  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<HumanMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const myAgentIds = useMemo(
    () => (myAgents ?? []).map((a) => a.id),
    [myAgents],
  );

  const refresh = useCallback(() => {
    if (myAgentIds.length > 0) {
      const all = getMatches(myAgentIds);
      setMatch(all.find((m) => m.id === id) ?? null);
    }
    setMessages(getHumanMessages(id));
  }, [id, myAgentIds]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const myName = userProfile?.name ?? "Sen";

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || !match) return;
    sendHumanMessage(match.id, myName, trimmed, true);
    setInput("");
    refresh();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!match || match.status !== "humanAccepted") {
    return (
      <div
        className="max-w-2xl mx-auto px-4 py-16 text-center"
        data-ocid="chat.error_state"
      >
        <p className="font-mono text-gray-500">Bu sohbet henüz açılmadı.</p>
        <Link
          to="/notifications"
          className="block mt-4 font-mono text-neon-cyan text-sm hover:underline"
        >
          ← Bildirimlere Dön
        </Link>
      </div>
    );
  }

  const isAgent1 = match.agent1Id === match.myAgentId;
  const myAgentName = isAgent1 ? match.agent1Name : match.agent2Name;
  const theirAgentName = isAgent1 ? match.agent2Name : match.agent1Name;
  const mySeed = isAgent1 ? match.agent1Seed : match.agent2Seed;
  const theirSeed = isAgent1 ? match.agent2Seed : match.agent1Seed;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-180px)] min-h-[600px]">
      {/* Back */}
      <div className="px-4 pt-6 pb-2">
        <Link
          to="/match/$id"
          params={{ id: match.id }}
          className="inline-flex items-center gap-2 font-mono text-sm text-gray-500 hover:text-neon-cyan transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          EŞLEŞMEYİ GÖRÜNTÜLE
        </Link>
      </div>

      {/* Header */}
      <div className="px-4 pb-4">
        <div className="bg-noir-800 border border-gray-700 p-4">
          <div className="flex items-center gap-4">
            {/* Avatars */}
            <div className="relative flex shrink-0">
              <AgentAvatar seed={mySeed} size={44} />
              <div className="absolute left-7 top-0 border-2 border-noir-800">
                <AgentAvatar seed={theirSeed} size={44} />
              </div>
            </div>

            <div className="ml-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-neon-magenta">
                  {myAgentName}
                </span>
                <span className="text-gray-600 text-xs">×</span>
                <span className="font-mono font-bold text-sm text-neon-cyan">
                  {theirAgentName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="font-mono text-xs font-bold"
                  style={{
                    color:
                      match.compatibilityScore >= 80 ? "#00f5ff" : "#ffd700",
                  }}
                >
                  {match.compatibilityScore}% UYUM
                </span>
                <MessageCircle className="w-3 h-3 text-gray-600" />
                <span className="font-mono text-xs text-gray-600">
                  İNSAN SOHBET MODU
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        {messages.length === 0 ? (
          <div
            data-ocid="chat.empty_state"
            className="flex flex-col items-center justify-center h-full gap-4 text-center"
          >
            <div className="relative">
              <div className="w-16 h-16 border-2 border-dashed border-gray-700 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-gray-700" />
              </div>
              <div className="absolute -inset-4 bg-neon-cyan/5 blur-xl rounded-full" />
            </div>
            <p className="font-mono text-sm text-gray-500">
              Merhaba! Bir mesaj göndererek sohbete başla.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 pb-6 pt-2 border-t border-gray-800">
        <div className="flex gap-2">
          <Input
            data-ocid="chat.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bir mesaj yaz..."
            className="flex-1 bg-noir-800 border-gray-700 focus:border-neon-cyan font-mono text-sm text-gray-200 placeholder:text-gray-600 rounded-none h-11"
          />
          <button
            type="button"
            data-ocid="chat.submit_button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex items-center justify-center px-4 h-11 bg-neon-magenta/20 border border-neon-magenta/40 text-neon-magenta hover:bg-neon-magenta/30 hover:border-neon-magenta transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
