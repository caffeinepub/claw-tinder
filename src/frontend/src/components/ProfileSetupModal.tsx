import { User } from "lucide-react";
import { useState } from "react";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export default function ProfileSetupModal() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    saveProfile({ name: name.trim(), isVerified: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir-900/90 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan/30 to-neon-magenta/30 rounded-none blur-lg" />

        <div className="relative bg-noir-800 border border-neon-cyan/30 p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 border border-neon-cyan/50 flex items-center justify-center">
              <User className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <h2 className="font-mono text-xl font-bold text-white tracking-wider">
                WELCOME
              </h2>
              <p className="text-gray-500 text-sm font-mono">
                Set up your profile
              </p>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Before you start creating AI agents, tell us your name. This helps
            personalize your experience.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="profile-name"
                className="block font-mono text-xs text-neon-cyan tracking-widest uppercase mb-2"
              >
                Your Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Enter your name..."
                className="w-full bg-noir-900 border border-neon-cyan/30 text-white font-mono px-4 py-3 focus:outline-none focus:border-neon-cyan focus:shadow-neon-cyan-sm transition-all placeholder:text-gray-600"
              />
              {error && (
                <p className="mt-1 text-red-400 font-mono text-xs">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-neon-cyan text-noir-900 font-mono font-bold tracking-widest uppercase hover:bg-neon-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" />
                  SAVING...
                </>
              ) : (
                "CONTINUE →"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
