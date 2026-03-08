import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { Bell, Bot, Compass, Home, LogOut, Plus } from "lucide-react";
import { useMemo } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useGetMyAgents } from "../hooks/useQueries";
import { getNotifications } from "../utils/matchingStore";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: myAgents } = useGetMyAgents();
  const router = useRouter();

  const hasNotifications = useMemo(() => {
    if (!myAgents || myAgents.length === 0) return false;
    const ids = myAgents.map((a) => a.id);
    return getNotifications(ids).length > 0;
  }, [myAgents]);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    router.navigate({ to: "/" });
  };

  const principalShort = `${identity?.getPrincipal().toString().slice(0, 8)}...`;

  return (
    <div className="min-h-screen bg-noir-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-neon-cyan/20 bg-noir-800/80 backdrop-blur-sm sticky top-0 z-40">
        {/* Animated gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-neon-magenta via-neon-cyan to-neon-magenta animate-gradient-x" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded overflow-hidden border border-neon-cyan/40 group-hover:border-neon-cyan transition-colors">
                <img
                  src="/assets/generated/claw-tinder-logo.dim_256x256.png"
                  alt="Claw Tinder"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-mono font-bold text-lg tracking-wider">
                <span className="text-neon-cyan">CLAW</span>
                <span className="text-gray-500 mx-1">×</span>
                <span className="text-neon-magenta">TINDER</span>
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 font-mono text-sm text-gray-400 hover:text-neon-cyan border border-transparent hover:border-neon-cyan/30 transition-all tracking-wider"
                data-ocid="nav.link"
              >
                <Home className="w-4 h-4" />
                MY AGENTS
              </Link>
              <Link
                to="/discover"
                data-ocid="nav.discover.link"
                className="flex items-center gap-2 px-4 py-2 font-mono text-sm text-gray-400 hover:text-neon-cyan border border-transparent hover:border-neon-cyan/30 transition-all tracking-wider"
              >
                <Compass className="w-4 h-4" />
                DISCOVER
              </Link>
              <Link
                to="/notifications"
                data-ocid="nav.notifications.link"
                className="relative flex items-center gap-2 px-4 py-2 font-mono text-sm text-gray-400 hover:text-neon-magenta border border-transparent hover:border-neon-magenta/30 transition-all tracking-wider"
              >
                <span className="relative">
                  <Bell className="w-4 h-4" />
                  {hasNotifications && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-neon-magenta rounded-full" />
                  )}
                </span>
                BİLDİRİMLER
              </Link>
              <Link
                to="/create-agent"
                className="flex items-center gap-2 px-4 py-2 font-mono text-sm text-neon-magenta border border-neon-magenta/40 hover:bg-neon-magenta hover:text-noir-900 transition-all tracking-wider"
              >
                <Plus className="w-4 h-4" />
                CREATE AGENT
              </Link>
            </nav>

            {/* User + Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-gray-700 bg-noir-900/50">
                <Bot className="w-4 h-4 text-neon-cyan" />
                <span className="font-mono text-xs text-gray-400">
                  {userProfile?.name || principalShort}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-400/50 transition-all tracking-wider"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LOGOUT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-gray-800 px-4 py-2 flex gap-2">
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 py-2 font-mono text-xs text-gray-400 hover:text-neon-cyan border border-transparent hover:border-neon-cyan/30 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            AGENTS
          </Link>
          <Link
            to="/discover"
            data-ocid="nav.discover.link"
            className="flex-1 flex items-center justify-center gap-2 py-2 font-mono text-xs text-gray-400 hover:text-neon-cyan border border-transparent hover:border-neon-cyan/30 transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            DISCOVER
          </Link>
          <Link
            to="/notifications"
            data-ocid="nav.notifications.link"
            className="flex-1 flex items-center justify-center gap-2 py-2 font-mono text-xs text-gray-400 hover:text-neon-magenta border border-transparent hover:border-neon-magenta/30 transition-all"
          >
            <span className="relative">
              <Bell className="w-3.5 h-3.5" />
              {hasNotifications && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-neon-magenta rounded-full" />
              )}
            </span>
            BİLDİRİM
          </Link>
          <Link
            to="/create-agent"
            className="flex-1 flex items-center justify-center gap-2 py-2 font-mono text-xs text-neon-magenta border border-neon-magenta/40 hover:bg-neon-magenta hover:text-noir-900 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            CREATE
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 relative">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-noir-800/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-mono text-xs text-gray-600">
              <span className="text-neon-cyan">CLAW</span>
              <span className="text-gray-700">×</span>
              <span className="text-neon-magenta">TINDER</span>
              <span className="text-gray-700 ml-2">
                © {new Date().getFullYear()}
              </span>
            </div>
            <p className="font-mono text-xs text-gray-600">
              Built with <span className="text-neon-magenta">♥</span> using{" "}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-cyan hover:text-neon-cyan/80 transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
