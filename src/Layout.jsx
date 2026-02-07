import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Calendar, Briefcase, BarChart3, User, BookOpen, Menu, X, Settings } from 'lucide-react';
import NotificationBell from './components/collaboration/NotificationBell';
import FloatingAIButton from './components/ai/FloatingAIButton';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Dump', page: 'Dump', icon: LayoutGrid },
    { name: 'Calendar', page: 'Calendar', icon: Calendar },
    { name: 'Ventures', page: 'Ventures', icon: Briefcase },
    { name: 'Teams', page: 'Teams', icon: User },
    { name: 'Stats', page: 'Stats', icon: BarChart3 },
    { name: 'STEP Key', page: 'StepKey', icon: BookOpen },
    { name: 'Profile', page: 'Profile', icon: User },
    { name: 'Settings', page: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#fffbf6] dark:bg-[#223947] transition-colors">
        <style>{`
          :root {
            --color-background: #fffbf6;
            --color-primary: #223947;
            --color-text: #323232;
            --color-secondary: #805c5c;
            --color-tertiary: #dbb4b4;
          }
          * {
            font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Acherus Grotesque', sans-serif;
            font-weight: 700;
            color: #323232;
          }
        `}</style>
      
      {/* Top Navigation */}
      <nav className="bg-white/80 dark:bg-[#223947]/80 border-b border-[#223947]/10 dark:border-white/10 sticky top-0 z-50 transition-colors backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link to="/Dump" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-[#223947] rounded-lg flex items-center justify-center">
                <span className="text-[#fffbf6] font-bold text-sm">V</span>
              </div>
              <div>
                <span className="text-[15px] font-bold tracking-tight text-[#323232] dark:text-[#fffbf6]" style={{fontFamily: 'Acherus Grotesque'}}>Venturer</span>
                <p className="text-[9px] text-[#805c5c] dark:text-[#fffbf6]/70 uppercase tracking-widest -mt-0.5 subtitle" style={{letterSpacing: '0.1em', fontFamily: 'Acherus Grotesque'}}>Multi-Venture OS</p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              <NotificationBell />
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={`/${item.page}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium ${
                      isActive
                        ? 'text-[#fffbf6] bg-[#223947]'
                        : 'text-[#323232] dark:text-[#fffbf6] hover:text-[#223947] dark:hover:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <NotificationBell />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20 transition-colors"
              >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#323232] dark:text-[#fffbf6]" />
              ) : (
                <Menu className="w-5 h-5 text-[#323232] dark:text-[#fffbf6]" />
                )}
                </button>
                </div>
                </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#223947]/10 dark:border-white/10 bg-white/95 dark:bg-[#223947]/95 backdrop-blur-sm">
            <div className="py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={`/${item.page}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-6 py-2.5 transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-[#223947] text-[#fffbf6] border-l-2 border-[#805c5c]'
                        : 'text-[#323232] dark:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20 hover:text-[#223947] dark:hover:text-[#fffbf6]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          )}
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>

          {/* Floating AI Button */}
          <FloatingAIButton />
          </div>
          );
          }