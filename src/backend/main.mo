import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Migration "migration";

(with migration = Migration.run)
actor {
  let progressData = Map.empty<Principal, Text>();

  public shared ({ caller }) func saveProgress(progressDataString : Text) : async () {
    if (caller.isAnonymous()) {
      return;
    };
    progressData.add(caller, progressDataString);
  };

  public shared ({ caller }) func loadProgress() : async ?Text {
    if (caller.isAnonymous()) {
      return null;
    };
    progressData.get(caller);
  };

  public shared ({ caller }) func deleteMyProgress() : async () {
    if (caller.isAnonymous()) {
      return;
    };
    progressData.remove(caller);
  };
};

