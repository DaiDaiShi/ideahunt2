import { Button } from "@/components/ui/button";
import { Search, Menu, LogOut, User, History, Loader2, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { getUserResults, UserResultRef } from "@/integrations/firebase/resultService";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<UserResultRef[]>([]);
  const [hasMoreAnalyses, setHasMoreAnalyses] = useState(false);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadRecentAnalyses = async () => {
      if (dropdownOpen && user) {
        setLoadingAnalyses(true);
        try {
          const results = await getUserResults(user.id);
          setHasMoreAnalyses(results.length > 4);
          setRecentAnalyses(results.slice(0, 4));
        } catch (error) {
          console.error("Error loading analyses:", error);
        } finally {
          setLoadingAnalyses(false);
        }
      }
    };
    loadRecentAnalyses();
  }, [dropdownOpen, user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
              <Search className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">ReviewLens</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {user && (
              <Link
                to="/analyze"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Analyze Reviews
              </Link>
            )}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/analyze">
                    <Search className="w-4 h-4 mr-1" />
                    New Analysis
                  </Link>
                </Button>
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="font-normal">
                      <p className="text-sm font-medium">{user.displayName || user.user_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                      <History className="w-3 h-3" />
                      My Analyses
                    </DropdownMenuLabel>
                    {loadingAnalyses ? (
                      <DropdownMenuItem disabled>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </DropdownMenuItem>
                    ) : recentAnalyses.length > 0 ? (
                      <>
                        {recentAnalyses.map((analysis) => (
                          <DropdownMenuItem
                            key={analysis.resultId}
                            onClick={() => {
                              navigate(`/results/${analysis.resultId}`);
                              setDropdownOpen(false);
                            }}
                            className="flex flex-col items-start gap-0.5 cursor-pointer"
                          >
                            <span className="text-sm truncate w-full">
                              {analysis.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {analysis.locationCount} location{analysis.locationCount !== 1 ? "s" : ""} · {formatDate(analysis.createdAt)}
                            </span>
                          </DropdownMenuItem>
                        ))}
                        {hasMoreAnalyses && (
                          <DropdownMenuItem
                            onClick={() => {
                              navigate("/history");
                              setDropdownOpen(false);
                            }}
                            className="flex items-center justify-between cursor-pointer text-primary"
                          >
                            <span className="text-sm">See all analyses</span>
                            <ChevronRight className="w-4 h-4" />
                          </DropdownMenuItem>
                        )}
                      </>
                    ) : (
                      <DropdownMenuItem disabled className="text-muted-foreground text-sm">
                        No analyses yet
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-4">
              {user && (
                <Link
                  to="/analyze"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Analyze Reviews
                </Link>
              )}
              <div className="flex gap-3 pt-2">
                {user ? (
                  <>
                    <Button variant="hero" size="sm" className="flex-1" asChild>
                      <Link to="/analyze" onClick={() => setMobileMenuOpen(false)}>
                        <Search className="w-4 h-4 mr-1" />
                        New Analysis
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="flex-1" asChild>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button variant="hero" size="sm" className="flex-1" asChild>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
