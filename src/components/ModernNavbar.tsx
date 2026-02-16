import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Search, Cpu, Workflow, Briefcase, Bell,
  Settings, Terminal, User, CreditCard, LogOut, Menu, X
} from "lucide-react";
import { useStockSearch } from "@/hooks/use-stock-data";

interface NavbarProps {
  onLogout?: () => void;
}

const routes = [
  { path: '/', label: 'Markets', icon: LayoutDashboard },
  { path: '/screener', label: 'Screener', icon: Search },
  { path: '/ai', label: 'FactraAI', icon: Cpu },
  { path: '/strategy', label: 'Strategy', icon: Workflow },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
];

const NOTIFICATIONS = [
  { id: 1, title: 'Welcome to FactraFi', message: 'Start by searching for any stock ticker', time: 'Just now', type: 'info' as const },
  { id: 2, title: 'Live Data Active', message: 'Real-time prices powered by yFinance', time: '1m ago', type: 'success' as const },
];

const ModernNavbar = ({ onLogout }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: searchResults } = useStockSearch(searchQuery, isSearchFocused && searchQuery.length >= 1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border glass-panel">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded bg-foreground/10 flex items-center justify-center text-primary group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)] transition-all duration-300">
                <Terminal size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground hidden sm:block">Factra<span className="text-primary">Fi</span></span>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {routes.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                      ${isActive
                        ? 'text-foreground bg-foreground/[0.08]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]'
                      }`}
                  >
                    <item.icon size={16} className={isActive ? 'text-primary' : 'text-current'} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden lg:block" ref={searchRef}>
              <div className="flex items-center bg-card border border-border rounded-full px-3 py-1.5 w-64 hover:border-muted-foreground focus-within:border-primary transition-colors duration-300">
                <Search size={14} className="text-muted-foreground mr-2" />
                <input
                  type="text"
                  placeholder="Search any stock..."
                  className="bg-transparent border-none text-xs text-foreground focus:outline-none w-full placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                />
                <div className="text-[10px] text-muted-foreground border border-border rounded px-1">⌘K</div>
              </div>

              {isSearchFocused && searchQuery && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                  {searchResults && searchResults.length > 0 ? (
                    <div className="py-2">
                      <div className="px-3 py-1 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Stocks</div>
                      {searchResults.map(result => (
                        <button
                          key={result.ticker}
                          className="w-full text-left px-4 py-2 hover:bg-foreground/5 flex items-center justify-between group"
                          onClick={() => {
                            navigate(`/stock/${result.ticker}`);
                            setSearchQuery('');
                            setIsSearchFocused(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{result.ticker[0]}</div>
                            <div>
                              <div className="text-sm font-bold text-foreground">{result.ticker}</div>
                              <div className="text-[10px] text-muted-foreground">{result.name}</div>
                            </div>
                          </div>
                          <div className="text-[10px] text-muted-foreground">{result.sector}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">No results for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>

            <div className="h-6 w-[1px] bg-border hidden md:block" />

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                className={`relative p-2 rounded-full transition-colors duration-200 ${showNotifications ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-background animate-pulse" />
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                  <div className="p-3 border-b border-border flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">Notifications</span>
                    <span className="text-[10px] text-primary cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {NOTIFICATIONS.map(notif => (
                      <div key={notif.id} className="p-3 hover:bg-foreground/5 border-b border-border last:border-0 cursor-pointer">
                        <div className="flex gap-3">
                          <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.type === 'success' ? 'bg-primary' : 'bg-info'}`} />
                          <div>
                            <h4 className="text-sm font-medium text-foreground">{notif.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                            <span className="text-[10px] text-muted-foreground/60 mt-2 block">{notif.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative hidden md:flex items-center gap-3" ref={profileRef}>
              <button className="flex items-center gap-3 group text-left" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="text-right hidden xl:block">
                  <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">John Doe</div>
                  <div className="text-[10px] text-primary">PRO PLAN</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-info p-[1px] cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-xs font-bold text-foreground">JD</div>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-bold text-foreground">John Doe</p>
                    <p className="text-xs text-muted-foreground">john.doe@example.com</p>
                  </div>
                  <div className="py-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 flex items-center gap-2"><User size={16} /> Account Profile</button>
                    <button className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 flex items-center gap-2"><CreditCard size={16} /> Billing & Plan</button>
                    <button className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 flex items-center gap-2"><Settings size={16} /> Preferences</button>
                  </div>
                  <div className="border-t border-border py-2">
                    <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 flex items-center gap-2"><LogOut size={16} /> Sign Out</button>
                  </div>
                </div>
              )}
            </div>

            <button className="md:hidden text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-card border-b border-border px-4 pt-2 pb-4 space-y-1 animate-fade-in-up">
          {routes.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                ${location.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          <div className="pt-4 border-t border-border mt-2">
            <button onClick={onLogout} className="flex items-center gap-3 text-destructive px-3 py-2 text-sm font-medium w-full">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default ModernNavbar;
