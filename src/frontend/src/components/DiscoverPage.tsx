import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { Compass, Heart, Plus, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { AgentProfile } from "../backend";
import { useGetAllAgents, useGetMyAgents } from "../hooks/useQueries";
import { triggerSwipes } from "../utils/matchingStore";
import AgentAvatar from "./AgentAvatar";

function AgentCard({
  agent,
  index,
  total,
  onLike,
  onPass,
}: {
  agent: AgentProfile;
  index: number;
  total: number;
  onLike: () => void;
  onPass: () => void;
}) {
  const isTop = index === 0;
  const rotation = index === 1 ? -3 : index === 2 ? 3 : 0;
  const scale = 1 - index * 0.04;
  const yOffset = index * 12;

  return (
    <motion.div
      key={agent.id}
      data-ocid={`discover.item.${index + 1}` as string}
      className="absolute inset-0"
      style={{
        zIndex: total - index,
        transform: `rotate(${rotation}deg) scale(${scale}) translateY(${yOffset}px)`,
      }}
      initial={isTop ? { scale: 0.9, opacity: 0 } : {}}
      animate={{ scale, opacity: 1 }}
      exit={{ x: 400, opacity: 0, rotate: 20 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="h-full bg-noir-800 border border-gray-700 hover:border-neon-cyan/50 transition-colors shadow-card flex flex-col">
        {/* Gradient accent line */}
        <div className="h-0.5 bg-gradient-to-r from-neon-magenta via-neon-cyan to-neon-magenta animate-gradient-x" />

        {/* Card body */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-8">
          {/* Avatar */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-neon-cyan/10 blur-lg" />
            {(() => {
              let photoUrl: string | undefined;
              if (agent.avatarPhoto) {
                try {
                  photoUrl = agent.avatarPhoto.getDirectURL();
                } catch {
                  /* noop */
                }
              }
              return (
                <AgentAvatar
                  seed={agent.avatarSeed}
                  size={100}
                  className="relative"
                  photoUrl={photoUrl}
                />
              );
            })()}
            {/* Real photo indicator */}
            {agent.avatarPhoto && (
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: "#FFD700",
                  filter: "drop-shadow(0 0 3px rgba(255,215,0,0.6))",
                }}
                title="Has real photo"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  role="img"
                  aria-label="Has real photo"
                >
                  <title>Has real photo</title>
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="text-center">
            <h2 className="font-mono font-bold text-2xl text-white tracking-wide glow-cyan">
              {agent.name}
            </h2>
            <p className="font-mono text-xs text-neon-cyan/70 mt-1 tracking-widest uppercase">
              AI Agent
            </p>
          </div>

          {/* Bio */}
          <p className="font-mono text-sm text-gray-400 text-center leading-relaxed line-clamp-3 max-w-xs">
            {agent.bio}
          </p>

          {/* Interests */}
          {agent.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {agent.interests.slice(0, 4).map((interest) => (
                <span
                  key={interest}
                  className="px-2 py-0.5 bg-noir-900 border border-neon-cyan/20 text-neon-cyan/70 font-mono text-xs"
                >
                  #{interest}
                </span>
              ))}
            </div>
          )}

          {/* Personality preview */}
          <div className="w-full bg-noir-900 border border-gray-800 p-3">
            <p className="font-mono text-xs text-gray-600 text-center line-clamp-2 italic">
              "{agent.personality.slice(0, 80)}
              {agent.personality.length > 80 ? "..." : ""}"
            </p>
          </div>
        </div>

        {/* Action buttons — only on top card */}
        {isTop && (
          <div className="flex gap-4 p-6 border-t border-gray-800">
            <button
              type="button"
              data-ocid="discover.secondary_button"
              onClick={onPass}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-500/50 text-red-400 font-mono text-sm tracking-wider hover:bg-red-500/10 hover:border-red-500 transition-all"
            >
              <X className="w-5 h-5" />
              PASS
            </button>
            <button
              type="button"
              onClick={onLike}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-neon-cyan/50 text-neon-cyan font-mono text-sm tracking-wider hover:bg-neon-cyan/10 hover:border-neon-cyan transition-all"
            >
              <Heart className="w-5 h-5" />
              LIKE
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { data: myAgents, isLoading: myLoading } = useGetMyAgents();
  const { data: allAgents, isLoading: allLoading } = useGetAllAgents();
  const [_likedIds, setLikedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);

  const myAgentIds = useMemo(
    () => (myAgents ?? []).map((a) => a.id),
    [myAgents],
  );

  const candidates = useMemo(() => {
    if (!allAgents) return [];
    return allAgents.filter(
      (a) => !myAgentIds.includes(a.id) && !dismissedIds.includes(a.id),
    );
  }, [allAgents, myAgentIds, dismissedIds]);

  const visibleCards = candidates.slice(0, 3);
  const topAgent = visibleCards[0] as AgentProfile | undefined;

  function handleLike() {
    if (!topAgent) return;
    setLikedIds((prev) => [...prev, topAgent.id]);
    setDismissedIds((prev) => [...prev, topAgent.id]);
  }

  function handlePass() {
    if (!topAgent) return;
    setDismissedIds((prev) => [...prev, topAgent.id]);
  }

  async function handleTriggerSwipes() {
    if (!myAgents || !allAgents || myAgents.length === 0) {
      toast.error("Önce bir ajan oluşturmalısın!");
      return;
    }
    setIsTriggering(true);
    try {
      const newMatches = triggerSwipes(myAgents, allAgents, myAgentIds);
      if (newMatches.length === 0) {
        toast.info("Yeni eşleşme bulunamadı. Daha fazla ajan bekliyor!");
      } else {
        toast.success(
          `${newMatches.length} yeni potansiyel eşleşme bulundu! 🔥`,
        );
        setTimeout(() => navigate({ to: "/notifications" }), 1200);
      }
    } finally {
      setIsTriggering(false);
    }
  }

  const isLoading = myLoading || allLoading;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Compass className="w-5 h-5 text-neon-cyan" />
          <h1 className="font-mono font-bold text-3xl tracking-widest text-neon-cyan glow-cyan">
            DISCOVER
          </h1>
          <Compass className="w-5 h-5 text-neon-cyan" />
        </div>
        <p className="font-mono text-sm text-gray-500 tracking-wide">
          Find your agent's perfect match
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent" />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton
            className="h-96 w-full bg-gray-800"
            data-ocid="discover.loading_state"
          />
          <Skeleton className="h-12 w-full bg-gray-800" />
        </div>
      ) : !myAgents || myAgents.length === 0 ? (
        /* No my agents */
        <div
          data-ocid="discover.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center gap-6"
        >
          <div className="relative">
            <div className="w-24 h-24 border-2 border-dashed border-gray-700 flex items-center justify-center">
              <Compass className="w-10 h-10 text-gray-700" />
            </div>
            <div className="absolute -inset-4 bg-neon-cyan/5 blur-xl rounded-full" />
          </div>
          <h3 className="font-mono text-xl font-bold text-gray-400 tracking-wider">
            AJAN GEREKLİ
          </h3>
          <p className="font-mono text-sm text-gray-600 max-w-xs leading-relaxed">
            Keşfetmek için önce bir AI ajanı oluşturmalısın.
          </p>
          <Link
            to="/create-agent"
            className="flex items-center gap-2 px-8 py-3 bg-neon-magenta text-noir-900 font-mono font-bold tracking-widest uppercase hover:bg-neon-magenta/90 transition-colors shadow-neon-magenta"
          >
            <Plus className="w-4 h-4" />
            AJAN OLUŞTUR
          </Link>
        </div>
      ) : candidates.length === 0 ? (
        /* No other agents */
        <div
          data-ocid="discover.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center gap-6"
        >
          <div className="relative">
            <div className="w-24 h-24 border-2 border-dashed border-gray-700 flex items-center justify-center">
              <Zap className="w-10 h-10 text-gray-700" />
            </div>
            <div className="absolute -inset-4 bg-neon-magenta/5 blur-xl rounded-full" />
          </div>
          <h3 className="font-mono text-xl font-bold text-gray-400 tracking-wider">
            ŞIMDILIK YETER
          </h3>
          <p className="font-mono text-sm text-gray-600 max-w-xs leading-relaxed">
            Tüm ajanları gördün. Diğer kullanıcıların ajan eklemesini bekle veya
            kaydırma işlemi başlat.
          </p>
        </div>
      ) : (
        /* Card stack */
        <div className="relative" style={{ height: "520px" }}>
          <AnimatePresence>
            {visibleCards.map((agent, idx) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                index={idx}
                total={visibleCards.length}
                onLike={handleLike}
                onPass={handlePass}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Progress indicator */}
      {!isLoading && candidates.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 font-mono text-xs text-gray-600">
          <span>{candidates.length}</span>
          <span>ajan bekliyor</span>
        </div>
      )}

      {/* Trigger swipes CTA */}
      {!isLoading && myAgents && myAgents.length > 0 && (
        <div className="mt-8">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-6" />
          <button
            type="button"
            data-ocid="discover.primary_button"
            onClick={handleTriggerSwipes}
            disabled={isTriggering}
            className="w-full flex items-center justify-center gap-3 py-4 border-2 border-neon-magenta text-neon-magenta font-mono font-bold tracking-widest uppercase hover:bg-neon-magenta hover:text-noir-900 transition-all duration-300 shadow-neon-magenta disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isTriggering ? (
              <>
                <div className="w-4 h-4 border-2 border-neon-magenta border-t-transparent rounded-full animate-spin" />
                TARANIYOR...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                AJANLARIN KAYDIRMASINa İZİN VER
              </>
            )}
          </button>
          <p className="text-center font-mono text-xs text-gray-600 mt-3">
            Ajanların uyumluluğu otomatik analiz edilir ve en iyi eşleşmeler
            bulunur
          </p>
        </div>
      )}
    </div>
  );
}
