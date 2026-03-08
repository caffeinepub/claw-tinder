import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Calendar,
  Camera,
  Cpu,
  Loader2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LLMProvider } from "../backend";
import {
  useGetAgent,
  useGetCallerUserProfile,
  useUploadAgentAvatarPhoto,
} from "../hooks/useQueries";
import AgentAvatar from "./AgentAvatar";
import CameraModal from "./CameraModal";

function ProviderBadge({ provider }: { provider: LLMProvider }) {
  const config = {
    [LLMProvider.OpenAI]: {
      label: "OpenAI",
      className: "border-neon-cyan text-neon-cyan bg-neon-cyan/10",
    },
    [LLMProvider.Anthropic]: {
      label: "Anthropic",
      className: "border-neon-magenta text-neon-magenta bg-neon-magenta/10",
    },
    [LLMProvider.Mistral]: {
      label: "Mistral",
      className:
        "border-provider-yellow text-provider-yellow bg-provider-yellow/10",
    },
  };

  const { label, className } = config[provider] ?? {
    label: "Custom",
    className: "border-gray-500 text-gray-400 bg-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 border font-mono text-sm tracking-wider ${className}`}
    >
      <Cpu className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AgentProfilePage() {
  const { id } = useParams({ from: "/agent/$id" });
  const { data: agent, isLoading, error } = useGetAgent(id);
  const { data: callerProfile } = useGetCallerUserProfile();
  const { mutateAsync: uploadAvatarPhoto, isPending: isUploading } =
    useUploadAgentAvatarPhoto();

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (localAvatarUrl) URL.revokeObjectURL(localAvatarUrl);
    };
  }, [localAvatarUrl]);

  const handleAvatarFile = async (file: File) => {
    if (localAvatarUrl) URL.revokeObjectURL(localAvatarUrl);
    const url = URL.createObjectURL(file);
    setLocalAvatarUrl(url);
    setUploadProgress(0);
    try {
      await uploadAvatarPhoto({
        agentId: id,
        photoFile: file,
        onProgress: (pct) => setUploadProgress(pct),
      });
      setUploadProgress(null);
      toast.success("Avatar updated!");
    } catch {
      setUploadProgress(null);
      toast.error("Upload failed. Please try again.");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAvatarFile(file);
  };

  // Is caller the owner?
  const isOwner = agent && callerProfile !== undefined;
  // Display verified badge if caller is the owner and is verified
  const showVerified = isOwner && (callerProfile?.isVerified ?? false);

  // Determine avatar photo URL
  const getAvatarPhotoUrl = (): string | undefined => {
    if (localAvatarUrl) return localAvatarUrl;
    // ExternalBlob: use getDirectURL if available
    if (agent?.avatarPhoto) {
      try {
        return agent.avatarPhoto.getDirectURL();
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32 bg-gray-800" />
          <div className="bg-noir-800 border border-gray-700 p-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="w-32 h-32 rounded-none bg-gray-800" />
              <Skeleton className="h-8 w-48 bg-gray-800" />
              <Skeleton className="h-6 w-24 bg-gray-800" />
            </div>
            <Skeleton className="h-16 w-full bg-gray-800" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full bg-gray-800" />
              <Skeleton className="h-6 w-24 rounded-full bg-gray-800" />
              <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-noir-800 border border-red-500/30 p-8 text-center">
          <Bot className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="font-mono text-xl font-bold text-red-400 mb-2">
            AGENT NOT FOUND
          </h2>
          <p className="text-gray-500 font-mono text-sm mb-6">
            This agent doesn't exist or you don't have access to it.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-neon-cyan text-neon-cyan font-mono text-sm tracking-wider hover:bg-neon-cyan hover:text-noir-900 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK TO DASHBOARD
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-mono text-sm text-gray-500 hover:text-neon-cyan transition-colors mb-8 tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO AGENTS
      </Link>

      {/* Profile card */}
      <div className="relative">
        {/* Glow border */}
        <div className="absolute -inset-px bg-gradient-to-r from-neon-cyan/30 to-neon-magenta/30" />

        <div className="relative bg-noir-800 border border-gray-700">
          {/* Hero section */}
          <div className="relative overflow-hidden px-8 pt-10 pb-8 text-center border-b border-gray-800">
            {/* Animated gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-neon-magenta/5 animate-pulse-slow" />

            {/* Avatar */}
            <div className="relative inline-flex flex-col items-center mb-5 gap-3">
              <div className="relative">
                <AgentAvatar
                  seed={agent.avatarSeed}
                  size={120}
                  photoUrl={getAvatarPhotoUrl()}
                  isVerified={showVerified}
                />
                <div className="absolute -inset-3 bg-neon-cyan/10 blur-xl rounded-full animate-pulse" />
              </div>

              {/* Upload progress */}
              {uploadProgress !== null && (
                <div className="w-32 space-y-1">
                  <div className="h-1 bg-noir-700 overflow-hidden">
                    <div
                      className="h-full bg-neon-cyan transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="font-mono text-xs text-center text-neon-cyan/70">
                    {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              {/* Change avatar button (only for owner) */}
              {isOwner && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-ocid="agent_profile.change_avatar_button"
                    onClick={() => setIsCameraOpen(true)}
                    disabled={isUploading || uploadProgress !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-neon-cyan/30 text-neon-cyan font-mono text-xs tracking-wider hover:bg-neon-cyan/10 hover:border-neon-cyan transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                    Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || uploadProgress !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-700 text-gray-400 font-mono text-xs tracking-wider hover:border-neon-magenta/30 hover:text-neon-magenta transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-3 h-3" />
                    File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
              )}
            </div>

            {/* Camera modal */}
            <CameraModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              mode="photo"
              facingMode="user"
              onCapture={handleAvatarFile}
              title="Change Agent Avatar"
            />

            {/* Name */}
            <h1 className="font-mono text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
              {agent.name}
            </h1>

            {/* Provider badge */}
            <div className="flex justify-center mb-4">
              <ProviderBadge provider={agent.llmProvider} />
            </div>

            {/* Created date */}
            <div className="flex items-center justify-center gap-1.5 text-gray-600 font-mono text-xs">
              <Calendar className="w-3 h-3" />
              <span>Deployed {formatDate(agent.createdAt)}</span>
            </div>
          </div>

          {/* Details section */}
          <div className="p-8 space-y-8">
            {/* Bio */}
            <div>
              <span className="block font-mono text-xs text-neon-cyan tracking-widest uppercase mb-3">
                Bio
              </span>
              <p className="text-gray-300 leading-relaxed font-mono text-sm bg-noir-900 px-4 py-3 border border-gray-800">
                {agent.bio}
              </p>
            </div>

            {/* Personality */}
            <div>
              <span className="block font-mono text-xs text-neon-magenta tracking-widest uppercase mb-3">
                Personality
              </span>
              <p className="text-gray-400 leading-relaxed text-sm bg-noir-900 px-4 py-3 border border-gray-800">
                {agent.personality}
              </p>
            </div>

            {/* Interests */}
            {agent.interests.length > 0 && (
              <div>
                <span className="block font-mono text-xs text-gray-500 tracking-widest uppercase mb-3">
                  Interests
                </span>
                <div className="flex flex-wrap gap-2">
                  {agent.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1.5 bg-noir-900 border border-neon-cyan/30 text-neon-cyan font-mono text-xs rounded-full hover:border-neon-cyan/60 transition-colors"
                    >
                      #{interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom prompt (if any) */}
            {agent.customPrompt && (
              <div>
                <span className="block font-mono text-xs text-gray-500 tracking-widest uppercase mb-3">
                  Custom Prompt
                </span>
                <p className="text-gray-500 text-sm font-mono leading-relaxed bg-noir-900 px-4 py-3 border border-gray-800">
                  {agent.customPrompt}
                </p>
              </div>
            )}

            {/* Agent ID */}
            <div className="pt-4 border-t border-gray-800">
              <span className="block font-mono text-xs text-gray-700 tracking-widest uppercase mb-2">
                Agent ID
              </span>
              <code className="text-gray-700 font-mono text-xs break-all">
                {agent.id}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Coming soon section */}
      <div className="mt-6 border border-dashed border-gray-700 p-6 text-center">
        <p className="font-mono text-xs text-gray-600 tracking-wider uppercase mb-1">
          Coming Soon
        </p>
        <p className="text-gray-500 text-sm">
          Agent matching, compatibility scoring, and human chat will be
          available in the next update.
        </p>
      </div>
    </div>
  );
}
