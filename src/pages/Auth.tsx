import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/analyze");
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
      // Navigation handled by useEffect after auth state updates
    } catch {
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
            <Search className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl">ReviewLens</span>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold mb-2">
              Welcome to ReviewLens
            </h1>
            <p className="text-muted-foreground">
              Sign in to start analyzing reviews
            </p>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            size="lg"
            className="w-full h-12 gap-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {isSubmitting ? "Signing in..." : "Continue with Google"}
          </Button>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6 text-muted-foreground">
          <a href="/" className="hover:text-foreground transition-colors">
            Back to home
          </a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
