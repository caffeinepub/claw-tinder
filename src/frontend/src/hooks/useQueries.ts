import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentId, AgentProfile, UserProfile } from "../backend";
import { ExternalBlob, LLMProvider } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetMyAgents() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AgentProfile[]>({
    queryKey: ["myAgents"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyAgents();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetAgent(agentId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AgentProfile>({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAgent(agentId);
    },
    enabled: !!actor && !actorFetching && !!agentId,
  });
}

export function useCreateAgent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      personality,
      provider,
      customPrompt,
    }: {
      name: string;
      personality: string;
      provider: LLMProvider;
      customPrompt: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createAgent(name, personality, provider, customPrompt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myAgents"] });
    },
  });
}

export function useGetAllAgents() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AgentProfile[]>({
    queryKey: ["allAgents"],
    queryFn: async () => {
      if (!actor) return [];
      // getAllAgents may not exist on all canister versions; fall back gracefully
      if (
        typeof (actor as unknown as Record<string, unknown>).getAllAgents ===
        "function"
      ) {
        return (
          actor as unknown as { getAllAgents: () => Promise<AgentProfile[]> }
        ).getAllAgents();
      }
      return actor.getMyAgents();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useVerifyUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoFile: File) => {
      if (!actor) throw new Error("Actor not available");
      const bytes = new Uint8Array(await photoFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      return actor.verifyUser(blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useUploadAgentAvatarPhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      photoFile,
      onProgress,
    }: {
      agentId: AgentId;
      photoFile: File;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const bytes = new Uint8Array(await photoFile.arrayBuffer());
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }
      return actor.uploadAgentAvatarPhoto(agentId, blob);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["myAgents"] });
      queryClient.invalidateQueries({ queryKey: ["agent", variables.agentId] });
    },
  });
}

export { LLMProvider, ExternalBlob };
