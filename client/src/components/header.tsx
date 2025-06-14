import { Link, useLocation } from "wouter";
import { User } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function Header() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", active: location === "/" },
    { href: "/about", label: "About", active: location === "/about" },
  ];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 header-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-4">
            <Logo size="large" variant="header" showText={false} />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Sales Intelligence Platform</h1>
              <p className="text-xs text-muted-foreground">Transform Annual Reports into Strategic Insights</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition-colors ${
                  item.active
                    ? "text-primary border-b-2 border-primary pb-4 -mb-px"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground">Sales Rep</span>
            </div>
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
