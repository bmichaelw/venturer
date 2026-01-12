import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Calendar, Briefcase, BarChart3, User, BookOpen, Menu, X, Settings } from 'lucide-react';
import NotificationBell from './components/collaboration/NotificationBell';
import FloatingAIButton from './components/ai/FloatingAIButton';

const createPageUrl = (pageName) => `#/${pageName}`;

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
    <div className="min-h-screen bg-stone-50 dark:bg-gray-900 transition-colors">
      <style>{`
        :root {
          --color-primary: #101827;
          --color-accent-blue: #3B82F6;
          --color-accent-orange: #F97316;
          --color-graphite: #4B5563;
          --color-fog: #E5E7EB;
        }
        * {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
      
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-black/[0.08] dark:border-gray-800 sticky top-0 z-50 transition-colors backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link to={createPageUrl('Dump')} className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-[#3B82F6] rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">V</span>
              </div>
              <div>
                <span className="text-[15px] font-semibold tracking-tight text-[#0F172A] dark:text-white">Venturer</span>
                <p className="text-[9px] text-[#6B7280] dark:text-gray-400 uppercase tracking-widest -mt-0.5" style={{letterSpacing: '0.1em'}}>Multi-Venture OS</p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <NotificationBell />
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[13px] font-medium ${
                      isActive
                        ? 'text-[#3B82F6] bg-[#3B82F6]/10'
                        : 'text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#0F172A] dark:text-white" />
              ) : (
                <Menu className="w-5 h-5 text-[#0F172A] dark:text-white" />
              )}
            </button>
          </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
          <div className="md:hidden border-t border-black/[0.08] dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-6 py-2.5 transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-l-2 border-[#3B82F6]'
                        : 'text-[#64748B] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0F172A] dark:hover:text-white'
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
          <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Floating AI Button */}
          <FloatingAIButton />
          </div>
          );
          }