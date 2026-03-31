import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

actor {
  let progressData = Map.empty<Principal, Text>();

  // ── Per-user progress ────────────────────────────────────────────────────

  public shared ({ caller }) func saveProgress(progressDataString : Text) : async () {
    if (caller.isAnonymous()) { return };
    progressData.add(caller, progressDataString);
  };

  public shared ({ caller }) func loadProgress() : async ?Text {
    if (caller.isAnonymous()) { return null };
    progressData.get(caller)
  };

  public shared ({ caller }) func deleteMyProgress() : async () {
    if (caller.isAnonymous()) { return };
    progressData.remove(caller);
  };

  // ── Shared multiplayer rooms (code → JSON string) ─────────────────────────

  let roomData = Map.empty<Text, Text>();
  let chatData = Map.empty<Text, Text>();

  // Create a new room; returns false if the code is already taken.
  public func createRoom(code : Text, stateJson : Text) : async Bool {
    switch (roomData.get(code)) {
      case (?_) { false };
      case (null) {
        roomData.add(code, stateJson);
        chatData.add(code, "[]");
        true
      };
    }
  };

  // Overwrite room state JSON.
  public func updateRoom(code : Text, stateJson : Text) : async () {
    roomData.add(code, stateJson);
  };

  // Read current room state; returns null when room does not exist.
  public query func getRoom(code : Text) : async ?Text {
    roomData.get(code)
  };

  // Remove a room and its chat.
  public func deleteRoom(code : Text) : async () {
    roomData.remove(code);
    chatData.remove(code);
  };

  // Overwrite the entire chat JSON array for a room.
  public func setChatMessages(code : Text, chatJson : Text) : async () {
    chatData.add(code, chatJson);
  };

  // Read chat JSON array string (returns "[]" when no chat exists).
  public query func getChatMessages(code : Text) : async Text {
    switch (chatData.get(code)) {
      case (?msgs) { msgs };
      case (null) { "[]" };
    }
  };
};
