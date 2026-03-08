import type { AgentProfile } from "../backend";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Match {
  id: string;
  agent1Id: string;
  agent2Id: string;
  agent1Name: string;
  agent2Name: string;
  agent1Seed: string;
  agent2Seed: string;
  agent1Personality: string;
  agent2Personality: string;
  compatibilityScore: number;
  status: "pending" | "notified" | "humanAccepted";
  createdAt: number;
  agent1Accepted: boolean | null;
  agent2Accepted: boolean | null;
  myAgentId: string;
}

export interface AgentChatMessage {
  id: string;
  matchId: string;
  sender: string; // agent id
  senderName: string;
  content: string;
  timestamp: number;
}

export interface HumanMessage {
  id: string;
  matchId: string;
  senderName: string;
  isMe: boolean;
  content: string;
  timestamp: number;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const MATCHES_KEY = "claw_matches";
const AGENT_MESSAGES_KEY = "claw_agent_messages";
const HUMAN_MESSAGES_KEY = "claw_human_messages";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function wordsOver3(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function computeBaseCompatibility(p1: string, p2: string): number {
  const words1 = new Set(wordsOver3(p1));
  const words2 = new Set(wordsOver3(p2));
  let shared = 0;
  for (const w of words1) {
    if (words2.has(w)) shared++;
  }
  return Math.min(100, 40 + shared * 10);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getMatches(myAgentIds: string[]): Match[] {
  const all = loadJSON<Match[]>(MATCHES_KEY, []);
  return all.filter((m) => myAgentIds.includes(m.myAgentId));
}

export function triggerSwipes(
  myAgents: AgentProfile[],
  allAgents: AgentProfile[],
  myAgentIds: string[],
): Match[] {
  const existing = loadJSON<Match[]>(MATCHES_KEY, []);
  const existingPairs = new Set(
    existing.map((m) => `${m.agent1Id}:${m.agent2Id}`),
  );

  const otherAgents = allAgents.filter((a) => !myAgentIds.includes(a.id));
  const newMatches: Match[] = [];

  for (const mine of myAgents) {
    for (const other of otherAgents) {
      const pairKey = `${mine.id}:${other.id}`;
      const reversePairKey = `${other.id}:${mine.id}`;
      if (existingPairs.has(pairKey) || existingPairs.has(reversePairKey))
        continue;

      const score = computeBaseCompatibility(
        mine.personality,
        other.personality,
      );

      const match: Match = {
        id: uid(),
        agent1Id: mine.id,
        agent2Id: other.id,
        agent1Name: mine.name,
        agent2Name: other.name,
        agent1Seed: mine.avatarSeed,
        agent2Seed: other.avatarSeed,
        agent1Personality: mine.personality,
        agent2Personality: other.personality,
        compatibilityScore: score,
        status: "pending",
        createdAt: Date.now(),
        agent1Accepted: null,
        agent2Accepted: null,
        myAgentId: mine.id,
      };

      newMatches.push(match);
      existingPairs.add(pairKey);
    }
  }

  const updated = [...existing, ...newMatches];
  saveJSON(MATCHES_KEY, updated);
  return newMatches;
}

const SCORING_KEYWORDS = [
  "humor",
  "creative",
  "sarcastic",
  "introvert",
  "coffee",
  "tech",
  "music",
  "dark",
  "espri",
  "yazilim",
];

const CHAT_TEMPLATES = [
  (a1: string, a2: string, p1: string) =>
    `Merhaba ${a2}! Ben ${a1}. Profilini gördüm ve "${p1.slice(0, 40)}..." kısmı dikkatimi çekti.`,
  (a1: string, _a2: string, _p1: string, p2: string) =>
    `${a1}, tanıştığına sevindim! Ben de "${p2.slice(0, 40)}..." diye tanımlanıyorum. Sahibim gibi biraz yoğun.`,
  (_a1: string, a2: string) =>
    `${a2}, bir soru soracağım: sahibin daha çok introvert mi yoksa sosyal mi?`,
  (_a1: string, a2: string) =>
    `${a2} iyi soru! Sahibim kod yazan birine benziyor — gece sosyal, gündüz hayalet.`,
  (_a1: string, a2: string) =>
    `${a2}, eğer sahibin ile sahibim buluşsaydı, ilk sohbet ne üzerine olurdu sence?`,
  (_a1: string, _a2: string) =>
    "Muhtemelen kahve ve teknoloji. Ya da karanlık mizah. İkisi de geçerli!",
  (_a1: string, a2: string) =>
    `${a2}, uyumluluk testini tamamladım. Değerlerimiz örtüşüyor gibi. Sahiplerimizi haberdar edelim mi?`,
  (_a1: string, a2: string) =>
    `${a2} kesinlikle! Bu konuşmayı sahibime iletiyorum. Umarım buluşurlar.`,
];

export function runAgentChat(match: Match): {
  messages: AgentChatMessage[];
  score: number;
} {
  const allMessages = loadJSON<AgentChatMessage[]>(AGENT_MESSAGES_KEY, []);
  // Remove existing messages for this match
  const filtered = allMessages.filter((m) => m.matchId !== match.id);

  const messages: AgentChatMessage[] = CHAT_TEMPLATES.map((tmpl, i) => {
    const isAgent1Turn = i % 2 === 0;
    const content = tmpl(
      match.agent1Name,
      match.agent2Name,
      match.agent1Personality,
      match.agent2Personality,
    );
    return {
      id: uid(),
      matchId: match.id,
      sender: isAgent1Turn ? match.agent1Id : match.agent2Id,
      senderName: isAgent1Turn ? match.agent1Name : match.agent2Name,
      content,
      timestamp: match.createdAt + i * 60_000,
    };
  });

  // Score calculation
  const combinedPersonality =
    `${match.agent1Personality} ${match.agent2Personality}`.toLowerCase();
  let score = 50;
  for (const kw of SCORING_KEYWORDS) {
    if (combinedPersonality.includes(kw)) score += 8;
  }
  score = Math.min(100, score);

  // Update match status
  const allMatchesRaw = loadJSON<Match[]>(MATCHES_KEY, []);
  const updatedMatches = allMatchesRaw.map((m) => {
    if (m.id !== match.id) return m;
    return {
      ...m,
      compatibilityScore: score,
      status: (score >= 80 ? "notified" : "pending") as Match["status"],
    };
  });
  saveJSON(MATCHES_KEY, updatedMatches);
  saveJSON(AGENT_MESSAGES_KEY, [...filtered, ...messages]);

  return { messages, score };
}

export function respondToMatch(
  matchId: string,
  _myAgentId: string,
  isAgent1: boolean,
  accept: boolean,
): Match {
  const all = loadJSON<Match[]>(MATCHES_KEY, []);
  const updated = all.map((m) => {
    if (m.id !== matchId) return m;
    const next = {
      ...m,
      agent1Accepted: isAgent1 ? accept : m.agent1Accepted,
      agent2Accepted: !isAgent1 ? accept : m.agent2Accepted,
    };
    const bothAccepted =
      next.agent1Accepted === true && next.agent2Accepted === true;
    return {
      ...next,
      status: (bothAccepted ? "humanAccepted" : next.status) as Match["status"],
    };
  });
  saveJSON(MATCHES_KEY, updated);
  return updated.find((m) => m.id === matchId) as Match;
}

export function sendHumanMessage(
  matchId: string,
  senderName: string,
  content: string,
  isMe: boolean,
): HumanMessage {
  const all = loadJSON<HumanMessage[]>(HUMAN_MESSAGES_KEY, []);
  const msg: HumanMessage = {
    id: uid(),
    matchId,
    senderName,
    isMe,
    content,
    timestamp: Date.now(),
  };
  saveJSON(HUMAN_MESSAGES_KEY, [...all, msg]);
  return msg;
}

export function getAgentMessages(matchId: string): AgentChatMessage[] {
  const all = loadJSON<AgentChatMessage[]>(AGENT_MESSAGES_KEY, []);
  return all
    .filter((m) => m.matchId === matchId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function getHumanMessages(matchId: string): HumanMessage[] {
  const all = loadJSON<HumanMessage[]>(HUMAN_MESSAGES_KEY, []);
  return all
    .filter((m) => m.matchId === matchId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function getNotifications(myAgentIds: string[]): Match[] {
  const all = loadJSON<Match[]>(MATCHES_KEY, []);
  return all.filter(
    (m) =>
      myAgentIds.includes(m.myAgentId) &&
      (m.status === "notified" || m.status === "humanAccepted"),
  );
}

// ─── Groq API Key helpers ──────────────────────────────────────────────────────

const GROQ_API_KEY_KEY = "claw_groq_api_key";

export function getGroqApiKey(): string {
  return localStorage.getItem(GROQ_API_KEY_KEY) ?? "";
}

export function saveGroqApiKey(key: string): void {
  localStorage.setItem(GROQ_API_KEY_KEY, key.trim());
}

// ─── Groq LLM-powered agent chat ──────────────────────────────────────────────

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callGroq(
  apiKey: string,
  messages: GroqMessage[],
): Promise<string> {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        max_tokens: 120,
        temperature: 0.85,
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return (data.choices[0]?.message?.content as string) ?? "";
}

export async function runGroqAgentChat(
  match: Match,
  apiKey?: string,
): Promise<{ messages: AgentChatMessage[]; score: number; usedGroq: boolean }> {
  const key = apiKey ?? getGroqApiKey();

  // Fall back to template-based system if no key provided
  if (!key) {
    const result = runAgentChat(match);
    return { ...result, usedGroq: false };
  }

  try {
    const builtMessages: AgentChatMessage[] = [];
    let lastContent = "Start the conversation by introducing yourself.";

    for (let i = 0; i < 6; i++) {
      const isAgent1Turn = i % 2 === 0;
      const agentName = isAgent1Turn ? match.agent1Name : match.agent2Name;
      const agentPersonality = isAgent1Turn
        ? match.agent1Personality
        : match.agent2Personality;

      const systemPrompt = isAgent1Turn
        ? `You are an AI agent named ${agentName} with personality: ${agentPersonality}. Keep responses SHORT (1-2 sentences max). You are flirting with another AI agent to check compatibility between your human owners. Be playful, curious, and in-character.`
        : `You are an AI agent named ${agentName} with personality: ${agentPersonality}. Keep responses SHORT (1-2 sentences max). You are chatting with another AI agent to check compatibility between your human owners. Be playful, curious, and in-character.`;

      const content = await callGroq(key, [
        { role: "system", content: systemPrompt },
        { role: "user", content: lastContent },
      ]);

      const msg: AgentChatMessage = {
        id: uid(),
        matchId: match.id,
        sender: isAgent1Turn ? match.agent1Id : match.agent2Id,
        senderName: agentName,
        content: content.trim(),
        timestamp: match.createdAt + i * 60_000,
      };

      builtMessages.push(msg);
      lastContent = content.trim();
    }

    // Compute compatibility score from shared words in all messages
    const allText = builtMessages.map((m) => m.content).join(" ");
    const words = wordsOver3(allText);
    const uniqueWords = new Set(words);
    let sharedCount = 0;
    for (const w of uniqueWords) {
      const count = words.filter((x) => x === w).length;
      if (count > 1) sharedCount++;
    }
    const score = Math.min(100, 50 + sharedCount * 8);

    // Save to localStorage
    const allMessages = loadJSON<AgentChatMessage[]>(AGENT_MESSAGES_KEY, []);
    const filtered = allMessages.filter((m) => m.matchId !== match.id);
    saveJSON(AGENT_MESSAGES_KEY, [...filtered, ...builtMessages]);

    const allMatchesRaw = loadJSON<Match[]>(MATCHES_KEY, []);
    const updatedMatches = allMatchesRaw.map((m) => {
      if (m.id !== match.id) return m;
      return {
        ...m,
        compatibilityScore: score,
        status: (score >= 80 ? "notified" : "pending") as Match["status"],
      };
    });
    saveJSON(MATCHES_KEY, updatedMatches);

    return { messages: builtMessages, score, usedGroq: true };
  } catch (err) {
    console.error("Groq API failed, falling back to templates:", err);
    const result = runAgentChat(match);
    return { ...result, usedGroq: false };
  }
}
