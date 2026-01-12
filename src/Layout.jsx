import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { LayoutGrid, Calendar, Briefcase, BarChart3, User, BookOpen, Menu, X } from 'lucide-react';
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
    { name: 'Profile', page: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <style>{`
        :root {
          --color-primary: #101827;
          --color-accent-teal: #14B8A6;
          --color-accent-amber: #F59E0B;
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
      <nav className="bg-[#101827] border-b border-gray-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to={createPageUrl('Dump')} className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-[#14B8A6] rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">V</span>
              </div>
              <div>
                <span className="text-base font-medium tracking-tight text-white">Venturer</span>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest -mt-0.5" style={{letterSpacing: '0.08em'}}>Multi-Venture OS</p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-0.5">
              <NotificationBell />
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-[#14B8A6]/20 text-[#14B8A6] border-b-2 border-[#14B8A6]'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800/50 bg-[#101827]">
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
                        ? 'bg-[#14B8A6]/20 text-[#14B8A6] border-l-2 border-[#14B8A6]'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
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