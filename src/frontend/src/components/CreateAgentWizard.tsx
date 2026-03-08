import { useRouter } from "@tanstack/react-router";
import {
  Bot,
  Brain,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Loader2,
  MessageSquare,
  Upload,
  Wand2,
} from "lucide-react";
import { useRef, useState } from "react";
import { LLMProvider } from "../backend";
import { useCreateAgent, useUploadAgentAvatarPhoto } from "../hooks/useQueries";
import AgentAvatar from "./AgentAvatar";
import CameraModal from "./CameraModal";

const PROVIDERS = [
  {
    value: LLMProvider.Groq,
    label: "Groq",
    description: "Lightning-fast open-source models",
    color: "border-neon-cyan text-neon-cyan",
    bg: "bg-neon-cyan/10",
    badge: "FREE",
  },
  {
    value: LLMProvider.OpenAI,
    label: "OpenAI",
    description: "GPT-4 powered agent",
    color: "border-emerald-400 text-emerald-400",
    bg: "bg-emerald-400/10",
    badge: "",
  },
  {
    value: LLMProvider.Anthropic,
    label: "Claude (Anthropic)",
    description: "Claude powered — thoughtful & nuanced",
    color: "border-neon-magenta text-neon-magenta",
    bg: "bg-neon-magenta/10",
    badge: "",
  },
  {
    value: LLMProvider.Gemini,
    label: "Gemini",
    description: "Google's multimodal AI model",
    color: "border-blue-400 text-blue-400",
    bg: "bg-blue-400/10",
    badge: "",
  },
  {
    value: LLMProvider.Mistral,
    label: "Mistral",
    description: "European open-source AI",
    color: "border-provider-yellow text-provider-yellow",
    bg: "bg-provider-yellow/10",
    badge: "",
  },
];

// Steps: 0=Name, 1=Personality, 2=Provider, 3=CustomPrompt, 4=Preview
const STEP_KEYS = ["name", "personality", "provider", "prompt", "preview"];
const TOTAL_STEPS = 5;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEP_KEYS.slice(0, total).map((stepKey, i) => (
        <div key={stepKey} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-bold border transition-all duration-300 ${
              i < current
                ? "bg-neon-cyan border-neon-cyan text-noir-900"
                : i === current
                  ? "border-neon-magenta text-neon-magenta shadow-neon-magenta-sm animate-pulse"
                  : "border-gray-700 text-gray-600"
            }`}
          >
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`h-px w-6 sm:w-8 transition-all duration-300 ${i < current ? "bg-neon-cyan" : "bg-gray-700"}`}
            />
          )}
        </div>
      ))}
      <span className="ml-3 font-mono text-xs text-gray-500 tracking-wider">
        STEP {current + 1} / {total}
      </span>
    </div>
  );
}

// Derive bio from personality (mirrors backend logic)
function deriveBio(personality: string): string {
  return `AI Personality: ${personality}.`;
}

// Extract interests from personality (mirrors backend logic)
function extractInterests(personality: string): string[] {
  return personality
    .split(" ")
    .slice(0, 5)
    .map((w) => w.replace(/[.,!?;:]/g, "").trim())
    .filter((w) => w.length > 0);
}

export default function CreateAgentWizard() {
  const router = useRouter();
  const { mutate: createAgent, isPending } = useCreateAgent();
  const { mutateAsync: uploadAvatarPhoto } = useUploadAgentAvatarPhoto();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [provider, setProvider] = useState<LLMProvider>(LLMProvider.Groq);
  const [customPrompt, setCustomPrompt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Avatar photo
  const [avatarPhotoFile, setAvatarPhotoFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 0 && !name.trim()) {
      newErrors.name = "Agent name is required";
    }
    if (step === 1 && !personality.trim()) {
      newErrors.personality = "Personality description is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleAvatarFile = (file: File) => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    const url = URL.createObjectURL(file);
    setAvatarPhotoFile(file);
    setAvatarPreviewUrl(url);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAvatarFile(file);
  };

  const handleConfirm = () => {
    createAgent(
      {
        name: name.trim(),
        personality: personality.trim(),
        provider,
        customPrompt: customPrompt.trim(),
      },
      {
        onSuccess: async (agentId) => {
          if (avatarPhotoFile) {
            setUploadProgress(0);
            try {
              await uploadAvatarPhoto({
                agentId,
                photoFile: avatarPhotoFile,
                onProgress: (pct) => setUploadProgress(pct),
              });
            } catch {
              // Photo upload failure is non-fatal
            }
            setUploadProgress(null);
          }
          router.navigate({ to: "/agent/$id", params: { id: agentId } });
        },
      },
    );
  };

  const previewBio = deriveBio(personality);
  const previewInterests = extractInterests(personality);
  const selectedProvider = PROVIDERS.find((p) => p.value === provider);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-neon-magenta/5 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="w-4 h-4 text-neon-magenta" />
          <span className="font-mono text-xs text-neon-magenta tracking-widest uppercase">
            Agent Factory
          </span>
        </div>
        <h1 className="font-mono text-3xl font-bold text-white tracking-tight">
          CREATE <span className="text-neon-cyan">AGENT</span>
        </h1>
        <p className="text-gray-500 font-mono text-sm mt-1">
          Build your AI personality and deploy it into the matching arena
        </p>
      </div>

      {/* Step indicator */}
      <div className="relative z-10">
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      {/* Form card */}
      <div className="relative z-10">
        {/* Glowing border */}
        <div className="absolute -inset-px bg-gradient-to-r from-neon-cyan/30 via-neon-magenta/20 to-neon-cyan/30 opacity-60 animate-gradient-x" />
        <div className="relative bg-noir-800 border border-gray-700 p-6 sm:p-8">
          {/* Step 0: Name */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center border border-neon-cyan/40 bg-neon-cyan/10">
                  <Bot className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <h2 className="font-mono text-xl font-bold text-white tracking-wider">
                    AGENT NAME
                  </h2>
                  <p className="font-mono text-xs text-gray-500">Step 1 of 5</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Give your AI agent a unique name. This will be its identity in
                the matching arena.
              </p>
              <div>
                <label
                  htmlFor="agent-name"
                  className="block font-mono text-xs text-neon-cyan tracking-widest uppercase mb-2"
                >
                  Name *
                </label>
                <input
                  id="agent-name"
                  data-ocid="create_agent.name_input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors({});
                  }}
                  placeholder="e.g. NightOwl-7, CryptoPhilosopher..."
                  className="w-full bg-noir-900 border border-gray-700 focus:border-neon-cyan text-white font-mono px-4 py-3 focus:outline-none focus:shadow-neon-cyan-sm transition-all placeholder:text-gray-600"
                />
                {errors.name && (
                  <p className="mt-1 text-red-400 font-mono text-xs">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="bg-noir-900 border border-gray-800 p-4">
                <p className="font-mono text-xs text-gray-500 leading-relaxed">
                  <span className="text-neon-cyan">TIP:</span> Pick a name that
                  reflects your agent's vibe — it shows on profile cards and
                  match notifications.
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Personality */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center border border-neon-magenta/40 bg-neon-magenta/10">
                  <Brain className="w-5 h-5 text-neon-magenta" />
                </div>
                <div>
                  <h2 className="font-mono text-xl font-bold text-white tracking-wider">
                    PERSONALITY
                  </h2>
                  <p className="font-mono text-xs text-gray-500">Step 2 of 5</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Describe your agent's personality in detail. The more specific,
                the better the matches.
              </p>
              <div>
                <label
                  htmlFor="agent-personality"
                  className="block font-mono text-xs text-neon-magenta tracking-widest uppercase mb-2"
                >
                  Personality Description *
                </label>
                <textarea
                  id="agent-personality"
                  data-ocid="create_agent.personality_textarea"
                  value={personality}
                  onChange={(e) => {
                    setPersonality(e.target.value);
                    setErrors({});
                  }}
                  placeholder="e.g. Sarcastic software engineer, 28, coffee addict, dark humor, loves late-night deep talks about philosophy and code..."
                  rows={5}
                  className="w-full bg-noir-900 border border-gray-700 focus:border-neon-magenta text-white font-mono px-4 py-3 focus:outline-none focus:shadow-neon-magenta-sm transition-all placeholder:text-gray-600 resize-none"
                />
                {errors.personality && (
                  <p className="mt-1 text-red-400 font-mono text-xs">
                    {errors.personality}
                  </p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <p className="text-gray-600 font-mono text-xs">
                    {personality.length} characters
                  </p>
                  {personality.length > 20 && (
                    <p className="text-neon-cyan/60 font-mono text-xs">
                      ✓ Good detail level
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: LLM Provider */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center border border-provider-yellow/40 bg-provider-yellow/10">
                  <Cpu className="w-5 h-5 text-provider-yellow" />
                </div>
                <div>
                  <h2 className="font-mono text-xl font-bold text-white tracking-wider">
                    LLM PROVIDER
                  </h2>
                  <p className="font-mono text-xs text-gray-500">Step 3 of 5</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Choose the AI model that will power your agent's conversations.
              </p>

              <div className="space-y-3">
                {PROVIDERS.map((p) => (
                  <button
                    type="button"
                    key={p.value}
                    data-ocid={`create_agent.provider_${p.label.toLowerCase().replace(/[^a-z0-9]/g, "_")}_button`}
                    onClick={() => setProvider(p.value)}
                    className={`w-full flex items-center gap-4 p-4 border transition-all duration-200 text-left ${
                      provider === p.value
                        ? `${p.color} ${p.bg} border-current`
                        : "border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 ${
                        provider === p.value
                          ? "border-current"
                          : "border-gray-600"
                      }`}
                    >
                      {provider === p.value && (
                        <div className="w-2 h-2 bg-current" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm tracking-wider">
                          {p.label}
                        </span>
                        {p.badge && (
                          <span className="px-1.5 py-0.5 bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan font-mono text-[10px] tracking-wider">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-gray-500 mt-0.5">
                        {p.description}
                      </div>
                    </div>
                    {provider === p.value && (
                      <Check className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Custom Prompt */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center border border-neon-cyan/40 bg-neon-cyan/10">
                  <MessageSquare className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <h2 className="font-mono text-xl font-bold text-white tracking-wider">
                    CUSTOM PROMPT
                  </h2>
                  <p className="font-mono text-xs text-gray-500">
                    Step 4 of 5 — Optional
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Add a custom system prompt to fine-tune how your agent behaves
                in conversations. Leave blank to use the auto-generated
                personality prompt.
              </p>

              <div>
                <label
                  htmlFor="custom-prompt"
                  className="block font-mono text-xs text-neon-cyan tracking-widest uppercase mb-2"
                >
                  System Prompt (Optional)
                </label>
                <textarea
                  id="custom-prompt"
                  data-ocid="create_agent.custom_prompt_textarea"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. You are a witty and sarcastic AI with a dry sense of humor. Always respond with short punchy answers, occasionally drop a dark joke, and never take anything too seriously..."
                  rows={6}
                  className="w-full bg-noir-900 border border-gray-700 focus:border-neon-cyan text-white font-mono px-4 py-3 focus:outline-none focus:shadow-neon-cyan-sm transition-all placeholder:text-gray-600 resize-none text-sm"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-gray-600 font-mono text-xs">
                    {customPrompt.length} characters
                  </p>
                  {customPrompt.length === 0 && (
                    <p className="text-gray-600 font-mono text-xs">
                      Auto-generated from personality
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-noir-900 border border-gray-800 p-4 space-y-2">
                <p className="font-mono text-xs text-gray-500 leading-relaxed">
                  <span className="text-neon-magenta">PROVIDER:</span>{" "}
                  <span className={selectedProvider?.color}>
                    {selectedProvider?.label}
                  </span>
                </p>
                <p className="font-mono text-xs text-gray-600 leading-relaxed">
                  Your prompt will be injected as the system message when your
                  agent chats with other agents.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center border border-neon-magenta/40 bg-neon-magenta/10">
                  <Wand2 className="w-5 h-5 text-neon-magenta" />
                </div>
                <div>
                  <h2 className="font-mono text-xl font-bold text-white tracking-wider">
                    PREVIEW & CREATE
                  </h2>
                  <p className="font-mono text-xs text-gray-500">Step 5 of 5</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Review your agent before deploying it to the arena.
              </p>

              {/* Agent preview card */}
              <div className="relative">
                <div className="absolute -inset-px bg-gradient-to-r from-neon-cyan/30 to-neon-magenta/30" />
                <div className="relative bg-noir-900 p-6 space-y-5">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <AgentAvatar
                        seed={name}
                        size={72}
                        photoUrl={avatarPreviewUrl ?? undefined}
                      />
                      <div className="absolute -inset-2 bg-neon-cyan/10 blur-lg rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-mono text-2xl font-bold text-white tracking-wide">
                        {name || "Unnamed Agent"}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2">
                        {selectedProvider && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 border font-mono text-xs tracking-wider ${selectedProvider.color}`}
                          >
                            {selectedProvider.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Generated Bio */}
                  <div>
                    <span className="block font-mono text-xs text-gray-600 tracking-widest uppercase mb-1.5">
                      Generated Bio
                    </span>
                    <p className="text-gray-300 text-sm font-mono leading-relaxed bg-noir-800 px-3 py-2 border border-gray-800">
                      {previewBio}
                    </p>
                  </div>

                  {/* Generated Interests */}
                  <div>
                    <span className="block font-mono text-xs text-gray-600 tracking-widest uppercase mb-2">
                      Generated Interests
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {previewInterests.length > 0 ? (
                        previewInterests.map((interest) => (
                          <span
                            key={interest}
                            className="px-3 py-1 bg-noir-800 border border-neon-cyan/30 text-neon-cyan font-mono text-xs rounded-full"
                          >
                            #{interest}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-600 font-mono text-xs">
                          No interests extracted yet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Custom prompt preview */}
                  {customPrompt && (
                    <div>
                      <span className="block font-mono text-xs text-gray-600 tracking-widest uppercase mb-1.5">
                        Custom System Prompt
                      </span>
                      <p className="text-gray-500 text-xs font-mono leading-relaxed bg-noir-800 px-3 py-2 border border-gray-800 line-clamp-3">
                        {customPrompt}
                      </p>
                    </div>
                  )}

                  {/* Avatar photo upload */}
                  <div>
                    <span className="block font-mono text-xs text-gray-600 tracking-widest uppercase mb-2">
                      AI Avatar Photo (Optional)
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        data-ocid="create_agent.take_photo_button"
                        onClick={() => setIsCameraOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-neon-cyan/40 text-neon-cyan font-mono text-xs tracking-wider hover:bg-neon-cyan/10 hover:border-neon-cyan transition-all uppercase"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Take Photo
                      </button>
                      <button
                        type="button"
                        data-ocid="create_agent.upload_file_button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-700 text-gray-400 font-mono text-xs tracking-wider hover:border-neon-magenta/40 hover:text-neon-magenta transition-all uppercase"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload File
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    {avatarPhotoFile && (
                      <p className="mt-1.5 font-mono text-xs text-neon-cyan/70">
                        ✓ {avatarPhotoFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload progress */}
              {uploadProgress !== null && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-500 tracking-wider">
                      UPLOADING PHOTO...
                    </span>
                    <span className="font-mono text-xs text-neon-cyan">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-noir-700 overflow-hidden">
                    <div
                      className="h-full bg-neon-cyan transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camera modal */}
          <CameraModal
            isOpen={isCameraOpen}
            onClose={() => setIsCameraOpen(false)}
            mode="photo"
            facingMode="user"
            onCapture={handleAvatarFile}
            title="Take Agent Photo"
          />

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
            <button
              type="button"
              data-ocid="create_agent.back_button"
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 font-mono text-sm text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed tracking-wider"
            >
              <ChevronLeft className="w-4 h-4" />
              BACK
            </button>

            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                data-ocid="create_agent.next_button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-neon-cyan text-noir-900 font-mono font-bold text-sm tracking-widest uppercase hover:bg-neon-cyan/90 transition-colors shadow-neon-cyan-sm"
              >
                NEXT
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                data-ocid="create_agent.create_button"
                onClick={handleConfirm}
                disabled={isPending || uploadProgress !== null}
                className="flex items-center gap-2 px-8 py-2.5 bg-neon-magenta text-noir-900 font-mono font-bold text-sm tracking-widest uppercase hover:bg-neon-magenta/90 transition-colors shadow-neon-magenta disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending || uploadProgress !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploadProgress !== null ? "UPLOADING..." : "CREATING..."}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    CREATE AGENT
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
