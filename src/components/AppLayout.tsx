import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Newspaper, Link2, Search, Menu, X, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isNews = location.pathname === "/" || location.pathname.startsWith("/article");
  const isCivic = location.pathname.startsWith("/empact");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="font-display text-sm font-bold text-primary-foreground">W</span>
              </div>
              <span className="font-display text-xl font-semibold text-foreground tracking-tight">
                Wake Up
              </span>
            </Link>

            {/* Desktop Nav — Tab-style */}
            <nav className="hidden md:flex items-center gap-1 rounded-lg bg-secondary/60 p-1">
              <Link
                to="/"
                className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  isNews
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Newspaper className="h-4 w-4" />
                News
              </Link>
              <Link
                to="/empact"
                className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  isCivic
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link2 className="h-4 w-4" />
                Em-pact Links
              </Link>
            </nav>

            {/* Search + Mobile menu */}
            <div className="flex items-center gap-2">
              <button className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <Search className="h-4 w-4" />
              </button>
              <button
                className="md:hidden rounded-lg p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <nav className="flex flex-col p-4 gap-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
                    isNews ? "bg-secondary text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Newspaper className="h-4 w-4" />
                  News
                </Link>
                <Link
                  to="/empact"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
                    isCivic ? "bg-secondary text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                  Em-pact Links
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
