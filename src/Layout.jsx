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
    <div className="min-h-screen bg-[#F5F1E8] dark:bg-[#2C4A52] transition-colors">
        <style>{`
          :root {
            --color-blonde: #F5F1E8;
            --color-teal: #2C4A52;
            --color-mauve: #8B6F6F;
            --color-charcoal: #333333;
          }
          * {
            font-family: 'Archivo', system-ui, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Archivo', sans-serif;
            font-weight: 700;
            color: var(--color-charcoal);
          }
        `}</style>
      
      {/* Top Navigation */}
      <nav className="bg-white/80 dark:bg-[#2C4A52]/80 border-b border-[#2C4A52]/10 dark:border-white/10 sticky top-0 z-50 transition-colors backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link to="/Dump" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-[#2C4A52] rounded-lg flex items-center justify-center">
                <span className="text-[#F5F1E8] font-bold text-sm">V</span>
              </div>
              <div>
                <span className="text-[15px] font-bold tracking-tight text-[#333333] dark:text-[#F5F1E8]" style={{fontFamily: 'Archivo'}}>Venturer</span>
                <p className="text-[9px] text-[#8B6F6F] dark:text-[#F5F1E8]/70 uppercase tracking-widest -mt-0.5 subtitle" style={{letterSpacing: '0.1em', fontFamily: 'Archivo'}}>Multi-Venture OS</p>
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
                        ? 'text-[#F5F1E8] bg-[#2C4A52]'
                        : 'text-[#333333] dark:text-[#F5F1E8] hover:text-[#2C4A52] dark:hover:text-[#F5F1E8] hover:bg-[#2C4A52]/10 dark:hover:bg-[#8B6F6F]/20'
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
                className="p-2 rounded-lg hover:bg-[#2C4A52]/10 dark:hover:bg-[#8B6F6F]/20 transition-colors"
              >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#333333] dark:text-[#F5F1E8]" />
              ) : (
                <Menu className="w-5 h-5 text-[#333333] dark:text-[#F5F1E8]" />
                )}
                </button>
                </div>
                </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#2C4A52]/10 dark:border-white/10 bg-white/95 dark:bg-[#2C4A52]/95 backdrop-blur-sm">
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
                        ? 'bg-[#2C4A52] text-[#F5F1E8] border-l-2 border-[#8B6F6F]'
                        : 'text-[#333333] dark:text-[#F5F1E8] hover:bg-[#2C4A52]/10 dark:hover:bg-[#8B6F6F]/20 hover:text-[#2C4A52] dark:hover:text-[#F5F1E8]'
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