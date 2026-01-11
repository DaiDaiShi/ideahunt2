import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lightbulb, Loader2, User, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUsernameAvailable, createUserProfile } from "@/integrations/firebase/userService";
import { useDebounce } from "@/hooks/useDebounce";

const SetupUsername = () => {
  const navigate = useNavigate();
  const { user, loading, needsUsername, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedUsername = useDebounce(username, 500);

  // Redirect if not logged in or doesn't need username
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !needsUsername) {
      navigate("/");
    }
  }, [user, loading, needsUsername, navigate]);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (debouncedUsername.length < 3) {
        setIsAvailable(null);
        return;
      }

      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(debouncedUsername)) {
        setError("Username can only contain letters, numbers, and underscores");
        setIsAvailable(false);
        return;
      }

      setIsChecking(true);
      setError(null);

      try {
        const available = await isUsernameAvailable(debouncedUsername);
        setIsAvailable(available);
        if (!available) {
          setError("This username is already taken");
        }
      } catch (err) {
        console.error("Error checking username:", err);
        setError("Failed to check username availability");
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !isAvailable || username.length < 3) return;

    setIsSubmitting(true);

    try {
      await createUserProfile(user.id, user.email || "", username);
      await refreshUserProfile();

      toast({
        title: "Welcome!",
        description: "Your username has been set successfully.",
      });

      navigate("/");
    } catch (err) {
      console.error("Error creating profile:", err);
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
            <Lightbulb className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl">IdeaHunt</span>
        </div>

        {/* Setup Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold mb-2">
              Choose your username
            </h1>
            <p className="text-muted-foreground">
              This is how others will see you on IdeaHunt
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="pl-10 pr-10 h-12"
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isChecking && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {!isChecking && isAvailable === true && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {!isChecking && isAvailable === false && (
                    <X className="w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {username.length > 0 && username.length < 3 && (
                <p className="text-sm text-muted-foreground">
                  Username must be at least 3 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isSubmitting || !isAvailable || username.length < 3}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupUsername;
