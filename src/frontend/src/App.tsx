import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import AgentProfilePage from "./components/AgentProfilePage";
import CreateAgentWizard from "./components/CreateAgentWizard";
import DiscoverPage from "./components/DiscoverPage";
import HumanChatPage from "./components/HumanChatPage";
import Layout from "./components/Layout";
import LoginScreen from "./components/LoginScreen";
import MatchDetailPage from "./components/MatchDetailPage";
import MyAgentsDashboard from "./components/MyAgentsDashboard";
import NotificationsPage from "./components/NotificationsPage";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();

  const showProfileSetup =
    !!identity && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      {showProfileSetup && <ProfileSetupModal />}
      {children}
    </>
  );
}

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-noir-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neon-cyan font-mono text-sm">INITIALIZING...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginScreen />;
  }

  return (
    <AuthGuard>
      <Layout>
        <Outlet />
      </Layout>
    </AuthGuard>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MyAgentsDashboard,
});

const createAgentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create-agent",
  component: CreateAgentWizard,
});

const agentProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/agent/$id",
  component: AgentProfilePage,
});

const discoverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/discover",
  component: DiscoverPage,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: NotificationsPage,
});

const matchDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/match/$id",
  component: MatchDetailPage,
});

const humanChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat/$id",
  component: HumanChatPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  createAgentRoute,
  agentProfileRoute,
  discoverRoute,
  notificationsRoute,
  matchDetailRoute,
  humanChatRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
