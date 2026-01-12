import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { LayoutGrid, Calendar, Briefcase, BarChart3, User, BookOpen } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: 'Dump', page: 'Dump', icon: LayoutGrid },
    { name: 'Calendar', page: 'Calendar', icon: Calendar },
    { name: 'Ventures', page: 'Ventures', icon: Briefcase },
    { name: 'Stats', page: 'Stats', icon: BarChart3 },
    { name: 'STEP Key', page: 'StepKey', icon: BookOpen },
    { name: 'Profile', page: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50">
      <style>{`
        :root {
          --color-primary: #1e293b;
          --color-accent: #f59e0b;
          --color-surface: #fafaf9;
        }
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>
      
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-stone-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Dump')} className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-xl font-semibold tracking-tight text-slate-900">Venturer</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}