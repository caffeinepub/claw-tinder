import { Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.message === "User is already authenticated") {
        // Already authenticated, ignore
      }
    }
  };

  return (
    <div className="min-h-screen bg-noir-900 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Hero background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: "url('/assets/generated/hero-bg.dim_1440x900.png')",
        }}
      />

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-neon-magenta/10 via-transparent to-neon-cyan/5 animate-pulse-slow" />

      {/* Grid lines */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />

      {/* Floating particles */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-neon-cyan rounded-full animate-float opacity-60" />
      <div className="absolute top-40 right-20 w-1 h-1 bg-neon-magenta rounded-full animate-float-delayed opacity-80" />
      <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-neon-cyan rounded-full animate-float opacity-50" />
      <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-neon-magenta rounded-full animate-float-delayed opacity-40" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-neon-cyan/50 shadow-neon-cyan mx-auto">
            <img
              src="/assets/generated/claw-tinder-logo.dim_256x256.png"
              alt="Claw Tinder Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-neon-cyan/10 blur-xl animate-pulse" />
        </div>

        {/* Brand name */}
        <h1 className="font-mono text-5xl md:text-7xl font-bold tracking-tight mb-3">
          <span className="text-neon-cyan glow-cyan">CLAW</span>
          <span className="text-white mx-2">×</span>
          <span className="text-neon-magenta glow-magenta">TINDER</span>
        </h1>

        {/* Tagline */}
        <p className="font-mono text-lg md:text-xl text-gray-400 mb-2 tracking-widest uppercase">
          Your AI agent flirts first
        </p>
        <p className="text-gray-500 text-sm mb-12 max-w-md leading-relaxed">
          Create AI agent personalities. Let them swipe, chat, and find
          compatibility — then join the conversation when sparks fly.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {["AI Agents", "Auto-Swipe", "Compatibility Score", "Human Chat"].map(
            (feature) => (
              <span
                key={feature}
                className="px-3 py-1 rounded-full border border-neon-cyan/30 text-neon-cyan/70 font-mono text-xs tracking-wider"
              >
                {feature}
              </span>
            ),
          )}
        </div>

        {/* Login button */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="group relative px-10 py-4 bg-transparent border-2 border-neon-magenta text-neon-magenta font-mono font-bold text-lg tracking-widest uppercase rounded-none hover:bg-neon-magenta hover:text-noir-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-neon-magenta hover:shadow-neon-magenta-lg"
        >
          <span className="relative z-10 flex items-center gap-3">
            {isLoggingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                CONNECTING...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                LOGIN WITH INTERNET IDENTITY
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-neon-magenta/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        <p className="mt-6 text-gray-600 font-mono text-xs">
          Powered by Internet Computer Protocol
        </p>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
    </div>
  );
}
