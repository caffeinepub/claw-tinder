import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import { Bell, Check, ChevronRight, MessageCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useGetMyAgents } from "../hooks/useQueries";
import {
  type Match,
  getAgentMessages,
  getMatches,
  getNotifications,
  respondToMatch,
} from "../utils/matchingStore";
import AgentAvatar from "./AgentAvatar";

type FilterTab = "all" | "pending" | "accepted" | "confirmed";

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#00f5ff" : score >= 60 ? "#ffd700" : "#ff4444";
  const label = score >= 80 ? "🔥" : score >= 60 ? "✨" : "💤";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 overflow-hidden">
        <div
          className="h-full transition-all"
          style={{
            width: `${score}%`,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </div>
      <span className="font-mono text-xs font-bold" style={{ color }}>
        {score}% {label}
      </span>
    </div>
  );
}

function MatchCard({
  match,
  myAgentId,
  onRespond,
  index,
}: {
  match: Match;
  myAgentId: string;
  onRespond: (matchId: string, accept: boolean) => void;
  index: number;
}) {
  const isAgent1 = match.agent1Id === myAgentId;
  const myName = isAgent1 ? match.agent1Name : match.agent2Name;
  const theirName = isAgent1 ? match.agent2Name : match.agent1Name;
  const mySeed = isAgent1 ? match.agent1Seed : match.agent2Seed;
  const theirSeed = isAgent1 ? match.agent2Seed : match.agent1Seed;

  const messages = useMemo(() => getAgentMessages(match.id), [match.id]);
  const firstMsg = messages[0]?.content ?? null;

  const myDecision = isAgent1 ? match.agent1Accepted : match.agent2Accepted;
  const isPending = match.status === "notified" && myDecision === null;
  const isAccepted = match.status === "humanAccepted";

  return (
    <motion.div
      data-ocid={`notifications.item.${index}` as string}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-noir-800 border border-gray-700 hover:border-neon-cyan/40 transition-colors shadow-card"
    >
      <Link to="/match/$id" params={{ id: match.id }} className="block p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatars */}
          <div className="relative flex shrink-0">
            <AgentAvatar seed={mySeed} size={40} />
            <div className="absolute left-6 top-0 border-2 border-noir-800">
              <AgentAvatar seed={theirSeed} size={40} />
            </div>
          </div>

          {/* Names + Status */}
          <div className="flex-1 ml-8 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm text-white truncate">
                {myName}
              </span>
              <span className="text-gray-600 text-xs">×</span>
              <span className="font-mono font-bold text-sm text-neon-cyan truncate">
                {theirName}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isAccepted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neon-cyan/10 border border-neon-cyan/30 font-mono text-xs text-neon-cyan">
                  <MessageCircle className="w-3 h-3" />
                  SOHBET AÇIK
                </span>
              ) : match.status === "notified" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neon-magenta/10 border border-neon-magenta/30 font-mono text-xs text-neon-magenta">
                  <Bell className="w-3 h-3" />
                  BİLDİRİM
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 border border-gray-700 font-mono text-xs text-gray-500">
                  BEKLEYEN
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 mt-1" />
        </div>

        {/* Score */}
        <ScoreGauge score={match.compatibilityScore} />

        {/* Conversation snippet */}
        {firstMsg && (
          <p className="mt-3 font-mono text-xs text-gray-500 line-clamp-2 italic border-l-2 border-gray-700 pl-3">
            "{firstMsg}"
          </p>
        )}
      </Link>

      {/* Action buttons */}
      {isPending && (
        <div className="flex gap-2 px-4 pb-4">
          <button
            type="button"
            data-ocid={`notifications.delete_button.${index}` as string}
            onClick={() => onRespond(match.id, false)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-500/40 text-red-400 font-mono text-xs tracking-wider hover:bg-red-500/10 hover:border-red-500 transition-all"
          >
            <X className="w-4 h-4" />
            REDDET
          </button>
          <button
            type="button"
            data-ocid={`notifications.confirm_button.${index}` as string}
            onClick={() => onRespond(match.id, true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-neon-cyan/40 text-neon-cyan font-mono text-xs tracking-wider hover:bg-neon-cyan/10 hover:border-neon-cyan transition-all"
          >
            <Check className="w-4 h-4" />
            KABUL ET
          </button>
        </div>
      )}

      {isAccepted && (
        <div className="px-4 pb-4">
          <Link
            to="/chat/$id"
            params={{ id: match.id }}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan font-mono text-xs tracking-wider hover:bg-neon-cyan/20 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            SOHBETE GİT
          </Link>
        </div>
      )}
    </motion.div>
  );
}

export default function NotificationsPage() {
  const { data: myAgents, isLoading } = useGetMyAgents();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [notifications, setNotifications] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);

  const myAgentIds = useMemo(
    () => (myAgents ?? []).map((a) => a.id),
    [myAgents],
  );

  const refresh = useCallback(() => {
    if (myAgentIds.length === 0) {
      setNotifications([]);
      setAllMatches([]);
      return;
    }
    setNotifications(getNotifications(myAgentIds));
    setAllMatches(getMatches(myAgentIds));
  }, [myAgentIds]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const displayed = useMemo(() => {
    const source = [...notifications];
    if (filter === "pending")
      return source.filter((m) => m.status === "notified");
    if (filter === "accepted")
      return source.filter((m) => m.status === "notified");
    if (filter === "confirmed")
      return source.filter((m) => m.status === "humanAccepted");
    return source;
  }, [notifications, filter]);

  function handleRespond(matchId: string, accept: boolean) {
    const match = notifications.find((m) => m.id === matchId);
    if (!match) return;
    const isAgent1 = match.agent1Id === match.myAgentId;
    respondToMatch(matchId, match.myAgentId, isAgent1, accept);
    if (accept) {
      toast.success(
        "Eşleşme kabul edildi! 🎉 Karşı taraf da kabul ederse sohbet açılır.",
      );
    } else {
      toast.error("Eşleşme reddedildi.");
    }
    refresh();
  }

  const notifCount = notifications.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Bell className="w-5 h-5 text-neon-magenta" />
          <h1 className="font-mono font-bold text-3xl tracking-widest text-neon-magenta glow-magenta">
            BİLDİRİMLER
          </h1>
          {notifCount > 0 && (
            <Badge className="bg-neon-magenta text-noir-900 font-mono font-bold px-2 border-0">
              {notifCount}
            </Badge>
          )}
        </div>
        <p className="font-mono text-sm text-gray-500">
          Yüksek uyumlu eşleşmelerin seni bekliyor
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-neon-magenta/40 to-transparent" />
      </div>

      {/* Filter tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterTab)}
        className="mb-6"
      >
        <TabsList
          data-ocid="notifications.tab"
          className="bg-noir-800 border border-gray-700 p-1 gap-1 rounded-none h-auto"
        >
          {(["all", "pending", "confirmed"] as FilterTab[]).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="font-mono text-xs tracking-wider rounded-none data-[state=active]:bg-neon-cyan/10 data-[state=active]:text-neon-cyan data-[state=active]:border data-[state=active]:border-neon-cyan/40 px-4 py-2"
            >
              {tab === "all"
                ? "TÜMÜ"
                : tab === "pending"
                  ? "BEKLEYEN"
                  : "ONAYLANDI"}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4" data-ocid="notifications.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full bg-gray-800" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div
          data-ocid="notifications.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center gap-5"
        >
          <div className="relative">
            <div className="w-20 h-20 border-2 border-dashed border-gray-700 flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-700" />
            </div>
            <div className="absolute -inset-4 bg-neon-magenta/5 blur-xl rounded-full" />
          </div>
          <h3 className="font-mono text-xl font-bold text-gray-400 tracking-wider">
            BİLDİRİM YOK
          </h3>
          <p className="font-mono text-sm text-gray-600 max-w-xs leading-relaxed">
            Henüz yüksek uyumlu eşleşme bulunamadı. Keşif sayfasından kaydırma
            başlat.
          </p>
          <Link
            to="/discover"
            className="flex items-center gap-2 px-6 py-3 border border-neon-cyan/40 text-neon-cyan font-mono text-sm tracking-wider hover:bg-neon-cyan/10 transition-all"
          >
            KEŞFET
          </Link>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {displayed.map((match, idx) => (
              <MatchCard
                key={match.id}
                match={match}
                myAgentId={match.myAgentId}
                onRespond={handleRespond}
                index={idx + 1}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* All matches section if no notifications */}
      {!isLoading && allMatches.length > 0 && notifications.length === 0 && (
        <div className="mt-8 p-4 bg-noir-800 border border-gray-700">
          <p className="font-mono text-xs text-gray-500 text-center">
            {allMatches.length} bekleyen eşleşme var. Ajan sohbeti başlatmak
            için eşleşmeye tıkla.
          </p>
        </div>
      )}
    </div>
  );
}
