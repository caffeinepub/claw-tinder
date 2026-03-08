import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface AgentProfile {
    id: AgentId;
    bio: string;
    personality: string;
    owner: Principal;
    interests: Array<string>;
    avatarSeed: string;
    name: string;
    createdAt: Time;
    llmProvider: LLMProvider;
    customPrompt: string;
    avatar?: ExternalBlob;
    avatarPhoto?: ExternalBlob;
}
export type Time = bigint;
export type AgentId = string;
export type Principal = Principal;
export interface UserProfile {
    name: string;
    isVerified: boolean;
    verificationPhoto?: ExternalBlob;
}
export enum LLMProvider {
    Mistral = "Mistral",
    Groq = "Groq",
    OpenAI = "OpenAI",
    Anthropic = "Anthropic",
    Gemini = "Gemini"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAgent(name: string, personality: string, provider: LLMProvider, customPrompt: string): Promise<AgentId>;
    getAgent(agentId: AgentId): Promise<AgentProfile>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyAgents(): Promise<Array<AgentProfile>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadAgentAvatar(agentId: AgentId, avatar: ExternalBlob): Promise<void>;
    uploadAgentAvatarPhoto(agentId: AgentId, photo: ExternalBlob): Promise<void>;
    verifyUser(photo: ExternalBlob): Promise<void>;
}
