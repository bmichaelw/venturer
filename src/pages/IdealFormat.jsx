import React from 'react';
import { BookOpen, Target, Clock, Zap, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function IdealFormatPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-[#223947]">Ideal Project Upload Format</h1>
        <p className="text-lg text-[#805c5c]">
          Structure your project documents for optimal AI extraction and automatic STEP prioritization
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Document Structure Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            To get the best results when uploading project documents, follow this structure. 
            The AI will automatically extract phases, tasks, notes, reminders, and dependencies.
          </p>
          <div className="bg-[#fffbf6] border border-[#dbb4b4] rounded-lg p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap">
{`[Project Name]

PHASE 1: [Milestone Name]
• Tasks:
  - [Task Title] - [Optional: Due Date]
  - [Task Title] (depends on [Previous Task])
  - [Task Title] (S:2, T:1, E:2, P:3)
• Notes:
  - [Context or research information]
• Reminders:
  - [Critical deadline or alert]

PHASE 2: [Next Milestone]
• Tasks:
  - [Task Title]
  ...`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* STEP Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            STEP Method Prioritization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p>
            Include STEP values in your tasks using the format <code className="bg-[#dbb4b4]/30 px-2 py-1 rounded">(S:X, T:X, E:X, P:X)</code> 
            for automatic prioritization. If values aren't provided, you can set them later.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Sextant */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#223947]">
                <AlertCircle className="w-4 h-4" />
                <span>S - Sextant (Urgency/Importance)</span>
              </div>
              <div className="space-y-1 text-sm">
                <div><Badge variant="outline">1</Badge> Urgent + Important</div>
                <div><Badge variant="outline">2</Badge> Not Urgent + Important</div>
                <div><Badge variant="outline">3</Badge> Urgent + Not Important</div>
                <div><Badge variant="outline">4</Badge> Not Urgent + Not Important</div>
                <div><Badge variant="outline">5</Badge> Late + Important</div>
                <div><Badge variant="outline">6</Badge> Late + Not Important</div>
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#223947]">
                <Clock className="w-4 h-4" />
                <span>T - Time Required</span>
              </div>
              <div className="space-y-1 text-sm">
                <div><Badge variant="outline">1</Badge> Short ({"<"} 2 hours)</div>
                <div><Badge variant="outline">2</Badge> Medium (2-8 hours)</div>
                <div><Badge variant="outline">3</Badge> Long ({">"}8 hours)</div>
              </div>
            </div>

            {/* Effort */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#223947]">
                <Zap className="w-4 h-4" />
                <span>E - Effort Level</span>
              </div>
              <div className="space-y-1 text-sm">
                <div><Badge variant="outline">1</Badge> Low (routine work)</div>
                <div><Badge variant="outline">2</Badge> Medium (focused work)</div>
                <div><Badge variant="outline">3</Badge> High (deep thinking)</div>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#223947]">
                <Target className="w-4 h-4" />
                <span>P - Priority Level</span>
              </div>
              <div className="space-y-1 text-sm">
                <div><Badge variant="outline">1</Badge> Low</div>
                <div><Badge variant="outline">2</Badge> Medium</div>
                <div><Badge variant="outline">3</Badge> High</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Full Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-[#fffbf6] border border-[#dbb4b4] rounded-lg p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap">
{`Mobile App Launch Project

PHASE 1: Setup & Planning
• Tasks:
  - Create project repository (S:2, T:1, E:1, P:3)
  - Define technical requirements - Due: 2026-03-15
  - Design database schema (depends on Define technical requirements) (S:1, T:2, E:3, P:3)
• Notes:
  - Consider scalability from the start
  - Research best practices for mobile architecture
• Reminders:
  - Team kickoff meeting scheduled for March 1st

PHASE 2: Development
• Tasks:
  - Build authentication system (S:1, T:3, E:3, P:3)
  - Create user dashboard (depends on Build authentication system)
  - Implement core features (S:2, T:3, E:3, P:3)
• Notes:
  - Use test-driven development approach
  - Weekly code reviews on Fridays

PHASE 3: Testing & Launch
• Tasks:
  - Write unit tests (S:2, T:2, E:2, P:3)
  - Conduct user acceptance testing
  - Deploy to production (depends on Write unit tests, Conduct user acceptance testing) (S:1, T:1, E:2, P:3)
• Reminders:
  - Beta testing starts April 1st
  - Launch date: April 15th`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-[#805c5c] font-bold">•</span>
              <span><strong>Use consistent formatting:</strong> Start each phase with "PHASE X:" or similar clear markers</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#805c5c] font-bold">•</span>
              <span><strong>Be specific with task names:</strong> Clear, actionable titles help with extraction</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#805c5c] font-bold">•</span>
              <span><strong>Include dependencies:</strong> Use "depends on" or "blocked by" to create task relationships</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#805c5c] font-bold">•</span>
              <span><strong>Add dates when known:</strong> Due dates help with automatic calendar integration</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#805c5c] font-bold">•</span>
              <span><strong>STEP values are optional:</strong> If you don't include them, they can be set manually later</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#805c5c] font-bold">•</span>
              <span><strong>Separate concerns:</strong> Keep tasks, notes, and reminders in their own sections</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* AI Instructions */}
      <Card className="border-[#805c5c]">
        <CardHeader>
          <CardTitle>For Your AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            If you're using an AI to help structure your project document, share these instructions:
          </p>
          <div className="bg-[#223947] text-[#fffbf6] rounded-lg p-4 text-sm">
            <p className="italic">
              "Please format my project into phases with tasks, notes, and reminders. For each task, 
              estimate and include tentative STEP values in this format: (S:X, T:X, E:X, P:X). 
              Use the STEP method where S=Sextant (1-6 urgency/importance), T=Time (1-3 duration), 
              E=Effort (1-3 complexity), P=Priority (1-3). Mark all STEP values as 'tentative/needs review' 
              since they're AI-generated estimates."
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}