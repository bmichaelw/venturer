import React, { useState } from 'react';
import { Sparkles, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProjectBuilder from '../components/projects/ProjectBuilder';
import DocumentProjectBuilder from '../components/projects/DocumentProjectBuilder';

export default function ProjectBuilderPage() {
  const [mode, setMode] = useState(null);

  if (mode === 'manual') {
    return (
      <div>
        <div className="max-w-2xl mx-auto pt-4 px-4">
          <Button variant="ghost" size="sm" onClick={() => setMode(null)} className="text-stone-400 hover:text-[#223947] -ml-2 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to options
          </Button>
        </div>
        <ProjectBuilder />
      </div>
    );
  }

  if (mode === 'document') {
    return (
      <div>
        <div className="max-w-2xl mx-auto pt-4 px-4">
          <Button variant="ghost" size="sm" onClick={() => setMode(null)} className="text-stone-400 hover:text-[#223947] -ml-2 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to options
          </Button>
        </div>
        <DocumentProjectBuilder />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#223947] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          New Project
        </h1>
        <p className="text-sm text-[#805c5c]">How would you like to get started?</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button onClick={() => setMode('manual')} className="bg-white rounded-2xl p-8 border border-stone-200/50 text-left hover:border-[#223947]/30 hover:shadow-lg transition-all duration-200 group">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#223947] to-[#223947]/80 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
            <Sparkles className="w-7 h-7 text-[#fffbf6]" />
          </div>
          <h2 className="text-lg font-bold text-[#223947] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Build Manually</h2>
          <p className="text-sm text-stone-500 leading-relaxed">Step-by-step wizard to create milestones and tasks from scratch.</p>
        </button>

        <button onClick={() => setMode('document')} className="bg-white rounded-2xl p-8 border border-stone-200/50 text-left hover:border-[#805c5c]/30 hover:shadow-lg transition-all duration-200 group">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#805c5c] to-[#805c5c]/80 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
            <FileText className="w-7 h-7 text-[#fffbf6]" />
          </div>
          <h2 className="text-lg font-bold text-[#223947] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Import from Document</h2>
          <p className="text-sm text-stone-500 leading-relaxed">Upload a project rundown PDF and AI will extract all milestones and tasks automatically.</p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#805c5c] bg-[#805c5c]/8 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            AI-powered extraction
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-stone-400 mt-8 max-w-md mx-auto leading-relaxed">
        For best results with document import, structure your PDF using the Ideal Format with phases, tasks, notes, and reminders.
      </p>
    </div>
  );
}