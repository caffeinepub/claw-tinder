import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import Time "mo:core/Time";

module {
  // Old (original) LLMProvider type definition
  type OldLLMProvider = {
    #OpenAI;
    #Anthropic;
    #Mistral;
  };

  // New (extended) LLMProvider type definition
  type NewLLMProvider = {
    #OpenAI;
    #Anthropic;
    #Mistral;
    #Groq;
    #Gemini;
  };

  // Old (original) AgentProfile type definition
  type OldAgentProfile = {
    id : Text;
    owner : Principal.Principal;
    name : Text;
    personality : Text;
    llmProvider : OldLLMProvider;
    customPrompt : Text;
    bio : Text;
    interests : [Text];
    avatarSeed : Text;
    createdAt : Time.Time;
    avatar : ?Storage.ExternalBlob;
    avatarPhoto : ?Storage.ExternalBlob;
  };

  // New (extended) AgentProfile type definition
  type NewAgentProfile = {
    id : Text;
    owner : Principal.Principal;
    name : Text;
    personality : Text;
    llmProvider : NewLLMProvider;
    customPrompt : Text;
    bio : Text;
    interests : [Text];
    avatarSeed : Text;
    createdAt : Time.Time;
    avatar : ?Storage.ExternalBlob;
    avatarPhoto : ?Storage.ExternalBlob;
  };

  // Old (original) Actor with old records
  type OldActor = {
    agents : Map.Map<Text, OldAgentProfile>;
    userProfiles : Map.Map<Principal.Principal, { name : Text; isVerified : Bool; verificationPhoto : ?Storage.ExternalBlob }>;
  };

  // New (extended) Actor with new record types
  type NewActor = {
    agents : Map.Map<Text, NewAgentProfile>;
    userProfiles : Map.Map<Principal.Principal, { name : Text; isVerified : Bool; verificationPhoto : ?Storage.ExternalBlob }>;
  };

  public func run(old : OldActor) : NewActor {
    let newAgents = old.agents.map<Text, OldAgentProfile, NewAgentProfile>(
      func(_id, oldAgent) {
        { oldAgent with llmProvider = convertLLMProvider(oldAgent.llmProvider) };
      }
    );
    { old with agents = newAgents };
  };

  func convertLLMProvider(oldProvider : OldLLMProvider) : NewLLMProvider {
    switch (oldProvider) {
      case (#OpenAI) { #OpenAI };
      case (#Anthropic) { #Anthropic };
      case (#Mistral) { #Mistral };
    };
  };
};
