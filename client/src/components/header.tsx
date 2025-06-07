import { Link, useLocation } from "wouter";
import { Search, User } from "lucide-react";

export default function Header() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", active: location === "/" },
    { href: "/about", label: "About", active: location === "/about" },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Discovery Prep Assistant</h1>
              <p className="text-xs text-slate-500">Sales Intelligence Tool</p>
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
                    : "text-slate-600 hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-sm text-slate-600">Sales Rep</span>
            </div>
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
