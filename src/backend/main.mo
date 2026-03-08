import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Migration "migration";

import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

// Use with migration declaration!
(with migration = Migration.run)
actor {
  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Type Definitions
  public type AgentId = Text;
  public type LLMProvider = { #OpenAI; #Anthropic; #Mistral; #Groq; #Gemini };

  public type AgentProfile = {
    id : AgentId;
    owner : Principal.Principal;
    name : Text;
    personality : Text;
    llmProvider : LLMProvider;
    customPrompt : Text;
    bio : Text;
    interests : [Text];
    avatarSeed : Text;
    createdAt : Time.Time;
    avatar : ?Storage.ExternalBlob;
    avatarPhoto : ?Storage.ExternalBlob;
  };

  public type UserProfile = {
    name : Text;
    isVerified : Bool;
    verificationPhoto : ?Storage.ExternalBlob;
  };

  // Storage
  let agents = Map.empty<AgentId, AgentProfile>();
  let userProfiles = Map.empty<Principal.Principal, UserProfile>();

  // Helper Functions
  func deriveBio(personality : Text) : Text {
    "AI Personality: " # personality # ".";
  };

  func extractInterests(personality : Text) : [Text] {
    let words = personality.split(#char(' ')).take(5).toArray();
    words.map(func(word) { word.trim(#char('.')) });
  };

  func generateAgentId(name : Text, owner : Principal.Principal) : AgentId {
    name.trim(#char(' ')) # owner.toText();
  };

  // User Profile Functions

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal.Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func verifyUser(photo : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can verify");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile does not exist");
      };
      case (?profile) {
        let updatedProfile = {
          name = profile.name;
          isVerified = true;
          verificationPhoto = ?photo;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  // Agent Functions

  public shared ({ caller }) func createAgent(name : Text, personality : Text, provider : LLMProvider, customPrompt : Text) : async AgentId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can create agents");
    };

    let id = generateAgentId(name, caller);
    let bio = deriveBio(personality);
    let interests = extractInterests(personality);

    let agent : AgentProfile = {
      id;
      owner = caller;
      name;
      personality;
      llmProvider = provider;
      customPrompt;
      bio;
      interests;
      avatarSeed = name.trim(#char(' '));
      createdAt = Time.now();
      avatar = null;
      avatarPhoto = null;
    };

    agents.add(id, agent);
    id;
  };

  public query ({ caller }) func getMyAgents() : async [AgentProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can retrieve agents");
    };
    agents.values().toArray().filter(
      func(agent) { agent.owner == caller }
    );
  };

  public shared ({ caller }) func uploadAgentAvatar(agentId : AgentId, avatar : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can upload avatars");
    };

    switch (agents.get(agentId)) {
      case (null) {
        Runtime.trap("Agent does not exist");
      };
      case (?agent) {
        if (agent.owner != caller) {
          Runtime.trap("Unauthorized: You cannot upload an avatar for this agent");
        };
        let updatedAgent = {
          id = agent.id;
          owner = agent.owner;
          name = agent.name;
          personality = agent.personality;
          llmProvider = agent.llmProvider;
          customPrompt = agent.customPrompt;
          bio = agent.bio;
          interests = agent.interests;
          avatarSeed = agent.avatarSeed;
          createdAt = agent.createdAt;
          avatar = ?avatar;
          avatarPhoto = agent.avatarPhoto;
        };
        agents.add(agentId, updatedAgent);
      };
    };
  };

  public shared ({ caller }) func uploadAgentAvatarPhoto(agentId : AgentId, photo : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can upload agent avatar photos");
    };

    switch (agents.get(agentId)) {
      case (null) {
        Runtime.trap("Agent does not exist");
      };
      case (?agent) {
        if (agent.owner != caller) {
          Runtime.trap("Unauthorized: You cannot upload a photo for this agent");
        };
        let updatedAgent = {
          id = agent.id;
          owner = agent.owner;
          name = agent.name;
          personality = agent.personality;
          llmProvider = agent.llmProvider;
          customPrompt = agent.customPrompt;
          bio = agent.bio;
          interests = agent.interests;
          avatarSeed = agent.avatarSeed;
          createdAt = agent.createdAt;
          avatar = agent.avatar;
          avatarPhoto = ?photo;
        };
        agents.add(agentId, updatedAgent);
      };
    };
  };

  public query ({ caller }) func getAgent(agentId : AgentId) : async AgentProfile {
    switch (agents.get(agentId)) {
      case (null) {
        Runtime.trap("Agent not found");
      };
      case (?agent) { agent };
    };
  };
};
