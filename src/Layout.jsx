import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Calendar, Briefcase, BarChart3, User, BookOpen, Menu, X, Settings, ChevronDown, HelpCircle } from 'lucide-react';
import NotificationBell from './components/collaboration/NotificationBell';
import ReminderManager from './components/reminders/ReminderManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import FloatingAIButton from './components/ai/FloatingAIButton';
import WelcomeScreen from './components/WelcomeScreen';
import FeedbackModal from './components/feedback/FeedbackModal';
import { Button } from './components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    return !sessionStorage.getItem('welcomeShown');
  });

  const handleWelcomeComplete = () => {
    sessionStorage.setItem('welcomeShown', 'true');
    setShowWelcome(false);
  };
  
  const mainNavItems = [
    { name: 'Dump', page: 'Dump', icon: LayoutGrid },
    { name: 'Calendar', page: 'Calendar', icon: Calendar },
    { name: 'Ventures', page: 'Ventures', icon: Briefcase },
    { name: 'Teams', page: 'Teams', icon: User },
  ];

  const resourcesItems = [
    { name: 'How to Use', page: 'HowToUse', icon: BookOpen },
    { name: 'Templates', page: 'Templates', icon: BookOpen },
    { name: 'Build Project', page: 'ProjectBuilder', icon: Briefcase },
    { name: 'STEP Key', page: 'StepKey', icon: BookOpen },
    { name: 'Ideal Format', page: 'IdealFormat', icon: BookOpen },
  ];

  const analyticsItems = [
    { name: 'Stats', page: 'Stats', icon: BarChart3 },
    { name: 'Reports', page: 'Reports', icon: BarChart3 },
  ];

  return (
    <>
      {showWelcome && <WelcomeScreen onComplete={handleWelcomeComplete} />}
      <div className="min-h-screen bg-[#fffbf6] dark:bg-[#223947] transition-colors">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
          
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
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            color: #223947;
          }
        `}</style>
      
      {/* Top Navigation */}
      <nav className="bg-white/80 dark:bg-[#223947]/80 border-b border-[#223947]/10 dark:border-white/10 sticky top-0 z-50 transition-colors backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link to="/Dump" className="flex items-center gap-2.5 group">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69654cb007cf784156379cfc/2cecd9bac_Venturer-logos2.png" 
                alt="Venturer" 
                className="w-7 h-7 rounded-lg object-cover"
              />
              <div>
                <span className="text-[15px] font-bold tracking-tight text-[#323232] dark:text-[#fffbf6]" style={{fontFamily: 'Plus Jakarta Sans'}}>Venturer</span>
                <p className="text-[9px] text-[#805c5c] dark:text-[#fffbf6]/70 uppercase tracking-widest -mt-0.5 subtitle" style={{letterSpacing: '0.1em', fontFamily: 'Plus Jakarta Sans'}}>Multi-Venture OS</p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {mainNavItems.map((item) => {
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

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#323232] dark:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20 transition-all">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Resources</span>
                  <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {resourcesItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.page} asChild>
                        <Link to={`/${item.page}`} className="flex items-center gap-2 cursor-pointer">
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#323232] dark:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20 transition-all">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Analytics</span>
                  <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {analyticsItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.page} asChild>
                        <Link to={`/${item.page}`} className="flex items-center gap-2 cursor-pointer">
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                to="/Profile"
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all ${
                  currentPageName === 'Profile'
                    ? 'text-[#fffbf6] bg-[#223947]'
                    : 'text-[#323232] dark:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20'
                }`}
              >
                <User className="w-4 h-4" />
              </Link>

              <Link
                to="/Settings"
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all ${
                  currentPageName === 'Settings'
                    ? 'text-[#fffbf6] bg-[#223947]'
                    : 'text-[#323232] dark:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20'
                }`}
              >
                <Settings className="w-4 h-4" />
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedback(true)}
                className="px-2 py-1.5"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>

              <NotificationBell />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <ReminderManager />
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
              {mainNavItems.map((item) => {
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
                        : 'text-[#323232] dark:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="px-6 py-2 text-xs font-semibold text-[#805c5c] dark:text-[#fffbf6]/70 uppercase tracking-wider">Resources</div>
              {resourcesItems.map((item) => {
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
                        : 'text-[#323232] dark:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="px-6 py-2 text-xs font-semibold text-[#805c5c] dark:text-[#fffbf6]/70 uppercase tracking-wider">Analytics</div>
              {analyticsItems.map((item) => {
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
                        : 'text-[#323232] dark:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="border-t border-[#223947]/10 dark:border-white/10 my-2"></div>
              <Link
                to="/Profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-2.5 transition-colors text-sm font-medium ${
                  currentPageName === 'Profile'
                    ? 'bg-[#223947] text-[#fffbf6] border-l-2 border-[#805c5c]'
                    : 'text-[#323232] dark:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
              <Link
                to="/Settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-2.5 transition-colors text-sm font-medium ${
                  currentPageName === 'Settings'
                    ? 'bg-[#223947] text-[#fffbf6] border-l-2 border-[#805c5c]'
                    : 'text-[#323232] dark:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              <div className="border-t border-[#223947]/10 dark:border-white/10 my-2"></div>
              <button
                onClick={() => {
                  setShowFeedback(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-6 py-2.5 transition-colors text-sm font-medium text-[#323232] dark:text-[#fffbf6] hover:bg-[#223947]/10 dark:hover:bg-[#805c5c]/20 w-full text-left"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help & Feedback</span>
              </button>
                </div>
                </div>
                )}
                </nav>

                {/* Feedback Modal */}
                <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>

          {/* Floating AI Button */}
          <FloatingAIButton />
          </div>
          </>
          );
          }