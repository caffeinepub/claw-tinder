import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Bot,
  Camera,
  CheckCircle,
  Compass,
  Cpu,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LLMProvider } from "../backend";
import type { AgentProfile } from "../backend";
import {
  useGetCallerUserProfile,
  useGetMyAgents,
  useVerifyUser,
} from "../hooks/useQueries";
import AgentAvatar from "./AgentAvatar";
import CameraModal from "./CameraModal";

function ProviderBadge({ provider }: { provider: LLMProvider }) {
  const config = {
    [LLMProvider.OpenAI]: {
      label: "OpenAI",
      className: "border-neon-cyan text-neon-cyan",
    },
    [LLMProvider.Anthropic]: {
      label: "Anthropic",
      className: "border-neon-magenta text-neon-magenta",
    },
    [LLMProvider.Mistral]: {
      label: "Mistral",
      className: "border-provider-yellow text-provider-yellow",
    },
  };

  const { label, className } = config[provider] ?? {
    label: "Custom",
    className: "border-gray-500 text-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 border font-mono text-xs tracking-wider ${className}`}
    >
      {label}
    </span>
  );
}

function AgentCard({ agent }: { agent: AgentProfile }) {
  return (
    <Link
      to="/agent/$id"
      params={{ id: agent.id }}
      className="group relative block"
    >
      {/* Glow on hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-neon-cyan/0 to-neon-magenta/0 group-hover:from-neon-cyan/20 group-hover:to-neon-magenta/20 transition-all duration-500 rounded-none" />

      <div className="relative bg-noir-800 border border-gray-700 group-hover:border-neon-cyan/50 transition-all duration-300 p-5 flex flex-col gap-4 shadow-card group-hover:shadow-neon-cyan-sm">
        {/* Top: Avatar + Name + Provider */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <AgentAvatar seed={agent.avatarSeed} size={56} />
            <div className="absolute -inset-1 rounded-full bg-neon-cyan/10 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-mono font-bold text-white text-lg tracking-wide truncate group-hover:text-neon-cyan transition-colors">
              {agent.name}
            </h3>
            <div className="mt-1">
              <ProviderBadge provider={agent.llmProvider} />
            </div>
          </div>
          <Zap className="w-4 h-4 text-gray-700 group-hover:text-neon-cyan transition-colors shrink-0 mt-1" />
        </div>

        {/* Bio */}
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 font-mono">
          {agent.bio}
        </p>

        {/* Interests */}
        {agent.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {agent.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="px-2 py-0.5 bg-noir-900 border border-gray-700 text-gray-500 font-mono text-xs rounded-full group-hover:border-neon-cyan/30 group-hover:text-gray-400 transition-colors"
              >
                #{interest}
              </span>
            ))}
          </div>
        )}

        {/* Bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/0 to-transparent group-hover:via-neon-cyan/40 transition-all duration-500" />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 border-2 border-dashed border-gray-700 flex items-center justify-center">
          <Bot className="w-10 h-10 text-gray-700" />
        </div>
        <div className="absolute -inset-4 bg-neon-cyan/5 blur-xl rounded-full" />
      </div>
      <h3 className="font-mono text-xl font-bold text-gray-400 tracking-wider mb-3">
        NO AGENTS YET
      </h3>
      <p className="text-gray-600 text-sm max-w-sm mb-8 leading-relaxed">
        Create your first AI agent to get started. Give it a personality and let
        it find its match.
      </p>
      <Link
        to="/create-agent"
        className="flex items-center gap-2 px-8 py-3 bg-neon-magenta text-noir-900 font-mono font-bold tracking-widest uppercase hover:bg-neon-magenta/90 transition-colors shadow-neon-magenta"
      >
        <Plus className="w-4 h-4" />
        CREATE YOUR FIRST AGENT
      </Link>
    </div>
  );
}

export default function MyAgentsDashboard() {
  const { data: agents, isLoading } = useGetMyAgents();
  const { data: userProfile } = useGetCallerUserProfile();
  const { mutateAsync: verifyUser, isPending: isVerifying } = useVerifyUser();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const handleVerifyCapture = async (file: File) => {
    try {
      await verifyUser(file);
      setVerifySuccess(true);
      toast.success("Identity verified! Verified badge added to your agents.");
    } catch {
      toast.error("Verification failed. Please try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero header */}
      <div className="relative mb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-transparent to-neon-magenta/5 animate-gradient-x" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-6 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-neon-cyan" />
              <span className="font-mono text-xs text-neon-cyan tracking-widest uppercase">
                Agent Control Panel
              </span>
            </div>
            <h1 className="font-mono text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3 flex-wrap">
              {userProfile?.name ? (
                <>
                  <span className="text-gray-400">Hello, </span>
                  <span className="text-neon-cyan">{userProfile.name}</span>
                </>
              ) : (
                <span>
                  MY <span className="text-neon-cyan">AGENTS</span>
                </span>
              )}
              {(userProfile?.isVerified || verifySuccess) && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold"
                  style={{
                    background: "rgba(255,215,0,0.12)",
                    color: "#FFD700",
                    border: "1px solid rgba(255,215,0,0.4)",
                    filter: "drop-shadow(0 0 6px rgba(255,215,0,0.4))",
                  }}
                >
                  <CheckCircle className="w-3 h-3" />
                  VERIFIED
                </span>
              )}
            </h1>
            <p className="text-gray-500 font-mono text-sm mt-1">
              {agents?.length ?? 0} agent
              {(agents?.length ?? 0) !== 1 ? "s" : ""} deployed
            </p>
          </div>

          <Link
            to="/create-agent"
            className="flex items-center gap-2 px-6 py-3 border-2 border-neon-magenta text-neon-magenta font-mono font-bold tracking-widest uppercase hover:bg-neon-magenta hover:text-noir-900 transition-all duration-300 shadow-neon-magenta self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            NEW AGENT
          </Link>
        </div>
      </div>

      {/* Verification banner */}
      {userProfile && !userProfile.isVerified && !verifySuccess && (
        <div
          data-ocid="dashboard.verify_banner"
          className="relative mb-6 border border-neon-magenta/50 bg-neon-magenta/5 p-4 sm:p-5"
        >
          {/* Animated corner glow */}
          <div className="absolute top-0 left-0 w-12 h-12 bg-neon-magenta/10 blur-xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-neon-magenta/10 blur-xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center border border-neon-magenta/40 bg-neon-magenta/10">
                <ShieldCheck className="w-5 h-5 text-neon-magenta" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white tracking-wider mb-0.5">
                  VERIFY YOUR IDENTITY
                </h3>
                <p className="font-mono text-xs text-gray-400 leading-relaxed">
                  Get a verified badge on all your agents — takes just a selfie.
                </p>
              </div>
            </div>
            <button
              type="button"
              data-ocid="dashboard.verify_now_button"
              onClick={() => setIsCameraOpen(true)}
              disabled={isVerifying}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-neon-magenta text-noir-900 font-mono font-bold text-xs tracking-widest uppercase hover:bg-neon-magenta/90 transition-colors shadow-neon-magenta-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  VERIFYING...
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  VERIFY NOW
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Verification success */}
      {verifySuccess && (
        <div className="mb-6 border border-yellow-400/40 bg-yellow-400/5 px-4 py-3 flex items-center gap-3">
          <CheckCircle
            className="w-4 h-4 text-yellow-400 flex-shrink-0"
            style={{ filter: "drop-shadow(0 0 4px #FFD700)" }}
          />
          <p className="font-mono text-xs text-yellow-400/90 tracking-wider">
            Identity verified! Your agents now display the verified badge.
          </p>
        </div>
      )}

      {/* Camera modal for verification */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        mode="photo"
        facingMode="user"
        onCapture={handleVerifyCapture}
        title="Identity Verification — Take a Selfie"
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-noir-800 border border-gray-800 p-5 space-y-4"
            >
              <div className="flex items-start gap-4">
                <Skeleton className="w-14 h-14 rounded-none bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4 bg-gray-800" />
                  <Skeleton className="h-4 w-1/3 bg-gray-800" />
                </div>
              </div>
              <Skeleton className="h-10 w-full bg-gray-800" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full bg-gray-800" />
                <Skeleton className="h-5 w-20 rounded-full bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      ) : !agents || agents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
          {/* Create new card */}
          <Link
            to="/create-agent"
            className="group relative flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-700 hover:border-neon-magenta/50 transition-all duration-300 p-6 text-center"
          >
            <div className="absolute inset-0 bg-neon-magenta/0 group-hover:bg-neon-magenta/5 transition-colors duration-300" />
            <Plus className="w-8 h-8 text-gray-700 group-hover:text-neon-magenta transition-colors mb-3" />
            <span className="font-mono text-sm text-gray-600 group-hover:text-neon-magenta transition-colors tracking-wider">
              CREATE NEW AGENT
            </span>
          </Link>
        </div>
      )}

      {/* Stats bar */}
      {agents && agents.length > 0 && (
        <div className="mt-10 border-t border-gray-800 pt-6 flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neon-cyan" />
            <span className="font-mono text-xs text-gray-500">
              <span className="text-neon-cyan font-bold">{agents.length}</span>{" "}
              agents active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-neon-magenta" />
            <span className="font-mono text-xs text-gray-500">
              <Link
                to="/discover"
                className="text-neon-magenta font-bold hover:text-neon-magenta/80 transition-colors"
              >
                AJANLAR İÇİN EŞLEŞME BUL →
              </Link>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
