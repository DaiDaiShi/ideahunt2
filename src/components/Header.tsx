import { Button } from "@/components/ui/button";
import { Search, Menu, LogOut, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="text-muted-foreground text-sm">
                      {user.user_name || user.email}
                    </DropdownMenuItem>
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
