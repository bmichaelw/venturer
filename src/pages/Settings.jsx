import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-10 pt-2">
        <h1 className="text-[11px] font-medium text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-3" style={{letterSpacing: '0.1em'}}>SETTINGS</h1>
        <p className="text-2xl sm:text-[32px] font-medium text-[#0F172A] dark:text-white leading-tight mb-2" style={{lineHeight: '1.2'}}>Customize your experience</p>
        <p className="text-sm sm:text-[15px] text-[#64748B] dark:text-gray-400 font-normal">Manage your preferences and appearance.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-black/[0.08] dark:border-gray-700 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-black/[0.06] dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-[#101827] dark:text-white mb-1">Appearance</h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-gray-400">Customize how Venturer looks</p>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Sun className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <Label htmlFor="dark-mode" className="text-base font-medium text-[#0F172A] dark:text-white cursor-pointer">
                  Dark Mode
                </Label>
                <p className="text-sm text-[#64748B] dark:text-gray-400">
                  {darkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}