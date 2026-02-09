import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Folder, Calendar, Users, Zap, FileText, Brain, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HowToUsePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#223947] mb-2">How to Use Venturer</h1>
        <p className="text-lg text-[#805c5c]">Your complete guide to managing multiple ventures like a pro</p>
      </div>

      {/* Quick Start */}
      <Card className="mb-6 border-2 border-[#dbb4b4] bg-gradient-to-br from-[#fffbf6] to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#223947]" />
            Quick Start (5 Minutes)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#223947] text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
            <div>
              <p className="font-medium text-[#323232]">Dump your brain</p>
              <p className="text-sm text-[#805c5c]">Go to <Link to="/Dump" className="text-[#223947] underline">Dump</Link> and write down everything in your head. Don't organize—just get it out.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#223947] text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
            <div>
              <p className="font-medium text-[#323232]">Create a venture</p>
              <p className="text-sm text-[#805c5c]">Go to <Link to="/Ventures" className="text-[#223947] underline">Ventures</Link> and create your first business/project container.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#223947] text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
            <div>
              <p className="font-medium text-[#323232]">Add a project</p>
              <p className="text-sm text-[#805c5c]">Inside your venture, create your first project. Use templates or the AI builder for structure.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#223947] text-white flex items-center justify-center text-sm font-bold shrink-0">4</div>
            <div>
              <p className="font-medium text-[#323232]">Start executing</p>
              <p className="text-sm text-[#805c5c]">Move items from Dump into projects, set due dates, and use STEP to prioritize.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Concepts */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#223947] mb-4">Core Concepts</h2>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                The Dump
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-[#323232]">Your inbox for thoughts. Everything starts here—ideas, tasks, notes, random thoughts. Don't overthink it.</p>
              <div className="bg-[#fffbf6] p-3 rounded-lg border border-[#dbb4b4]">
                <p className="text-xs font-semibold text-[#223947] mb-1">Pro Tip:</p>
                <p className="text-xs text-[#323232]">Use the quick add at the top. Type fast, organize later. The AI can help you sort through it.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Folder className="w-5 h-5 text-[#223947]" />
                Ventures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-[#323232]">A venture is a business, side project, or major initiative. Think of it as a container for related projects.</p>
              <div className="space-y-1 text-sm">
                <p className="text-[#323232]"><strong>Examples:</strong></p>
                <ul className="list-disc list-inside text-[#805c5c] space-y-0.5">
                  <li>"My Consulting Business"</li>
                  <li>"Personal Brand"</li>
                  <li>"Real Estate Investments"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-blue-500" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-[#323232]">Projects live inside ventures. They have milestones, workstreams, and tasks with clear start/end points.</p>
              <div className="bg-[#fffbf6] p-3 rounded-lg border border-[#dbb4b4]">
                <p className="text-xs font-semibold text-[#223947] mb-1">Three Ways to Create:</p>
                <ul className="text-xs text-[#323232] space-y-1">
                  <li>• <strong>Quick Add:</strong> Basic name + description</li>
                  <li>• <strong>Templates:</strong> Pre-built structures for common project types</li>
                  <li>• <strong>PDF Upload:</strong> Upload a project doc and AI extracts everything</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI-Powered Features */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#223947] mb-4">AI-Powered Features</h2>
        
        <Card className="border-2 border-[#223947] bg-gradient-to-br from-white to-[#fffbf6]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#223947]" />
              Training Your AI to Build Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#323232]">This is where Venturer gets powerful. You can train ChatGPT, Claude, or any AI to create perfectly structured project documents that you can upload directly.</p>
            
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border border-[#dbb4b4]">
                <p className="font-semibold text-[#223947] mb-2">Step 1: Visit the Ideal Format Page</p>
                <p className="text-sm text-[#323232] mb-2">Go to <Link to="/IdealFormat" className="text-[#223947] underline font-medium">Resources → Ideal Format</Link> and scroll to the bottom.</p>
                <p className="text-sm text-[#805c5c]">Copy the entire "Instructions for AI" section.</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#dbb4b4]">
                <p className="font-semibold text-[#223947] mb-2">Step 2: Create a Custom GPT or Claude Project</p>
                <p className="text-sm text-[#323232] mb-2">In ChatGPT (Plus/Pro) or Claude (Pro), create a custom assistant and paste those instructions.</p>
                <p className="text-sm text-[#805c5c]">This trains the AI to format projects exactly how Venturer expects them.</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#dbb4b4]">
                <p className="font-semibold text-[#223947] mb-2">Step 3: Describe Your Project</p>
                <p className="text-sm text-[#323232] mb-3">Tell your AI assistant about your project. Be as detailed or vague as you want—it'll ask questions to fill in gaps.</p>
                <div className="bg-[#fffbf6] p-2 rounded text-xs text-[#323232] italic border-l-2 border-[#223947]">
                  "I want to launch a coaching program for new entrepreneurs. It should include a website, social media presence, and 5 initial clients in 3 months."
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#dbb4b4]">
                <p className="font-semibold text-[#223947] mb-2">Step 4: Download as PDF</p>
                <p className="text-sm text-[#323232] mb-2">The AI will create a formatted project document. Download it as a PDF.</p>
                <p className="text-sm text-[#805c5c]">Most AI assistants can export to PDF directly, or paste into Google Docs and download.</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#dbb4b4]">
                <p className="font-semibold text-[#223947] mb-2">Step 5: Upload to Venturer</p>
                <p className="text-sm text-[#323232] mb-2">In any venture, click "Quick Add" project → "Upload Project PDF"</p>
                <p className="text-sm text-[#805c5c]">Venturer's AI will extract everything: title, description, milestones, tasks, dependencies, and STEP values.</p>
              </div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900 mb-1">Why This Is Game-Changing</p>
                  <p className="text-sm text-emerald-800">You can brainstorm and structure projects conversationally with AI, then import fully-formed projects with tasks, timelines, and dependencies in seconds. No manual data entry.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* STEP Method */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#223947] mb-4">Understanding STEP</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-[#323232]">STEP helps you prioritize tasks intelligently. It's four dimensions:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="font-semibold text-red-900 mb-1">S - Sextant (1-6)</p>
                <p className="text-xs text-red-800">Urgency + Importance matrix. 1 = Urgent+Important (do now), 6 = Late+Not Important (why is this here?)</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900 mb-1">T - Time (1-3)</p>
                <p className="text-xs text-blue-800">How long will it take? 1 = Quick (under 30 min), 2 = Medium (30 min - 2 hours), 3 = Long (2+ hours)</p>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="font-semibold text-amber-900 mb-1">E - Effort (1-3)</p>
                <p className="text-xs text-amber-800">Mental/physical energy required. 1 = Easy, 2 = Moderate, 3 = Hard/draining</p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <p className="font-semibold text-purple-900 mb-1">P - Priority (1-3)</p>
                <p className="text-xs text-purple-800">Overall importance to your goals. 1 = Nice to have, 2 = Should have, 3 = Must have</p>
              </div>
            </div>

            <div className="bg-[#fffbf6] p-3 rounded-lg border border-[#dbb4b4]">
              <p className="text-xs font-semibold text-[#223947] mb-1">Pro Tip:</p>
              <p className="text-xs text-[#323232]">Filter by S=1 (urgent+important) or P=3 (high priority) to see what needs attention today. Learn more at <Link to="/StepKey" className="text-[#223947] underline">STEP Key</Link>.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Features */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#223947] mb-4">Advanced Features</h2>
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workstreams</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#323232]">Group related tasks within a project. Example: "Marketing," "Development," "Sales"</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Associations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#323232]">Link tasks, milestones, and workstreams with relationships like "blocks," "depends on," "relates to." Perfect for complex projects.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#323232]">Create reusable project structures. Save successful projects as templates for future use. Find them at <Link to="/Templates" className="text-[#223947] underline">Resources → Templates</Link>.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#323232]">Collaborate on ventures with team members. Assign tasks, track progress together.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Best Practices */}
      <Card className="mb-8 border-2 border-[#223947]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#223947]" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#223947] mt-2 shrink-0" />
            <p className="text-sm text-[#323232]"><strong>Review your Dump daily:</strong> Spend 5 minutes moving items into projects or deleting what's irrelevant.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#223947] mt-2 shrink-0" />
            <p className="text-sm text-[#323232]"><strong>Use Calendar view:</strong> See everything due soon across all ventures in one place.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#223947] mt-2 shrink-0" />
            <p className="text-sm text-[#323232]"><strong>Set reminders:</strong> For follow-ups and time-sensitive tasks. You'll get notifications.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#223947] mt-2 shrink-0" />
            <p className="text-sm text-[#323232]"><strong>Archive completed projects:</strong> Keep your workspace clean. They're still searchable.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#223947] mt-2 shrink-0" />
            <p className="text-sm text-[#323232]"><strong>Use the AI strategically:</strong> It can suggest task breakdowns, identify dependencies, and help prioritize.</p>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-br from-[#223947] to-[#223947]/80 text-white rounded-2xl p-8">
        <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
        <p className="text-[#fffbf6]/80 mb-6">Pick one thing to dump, one venture to create, or one project to build.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/Dump">
            <Button variant="outline" className="bg-white text-[#223947] hover:bg-[#fffbf6]">
              Go to Dump
            </Button>
          </Link>
          <Link to="/Ventures">
            <Button variant="outline" className="bg-white text-[#223947] hover:bg-[#fffbf6]">
              Create a Venture
            </Button>
          </Link>
          <Link to="/IdealFormat">
            <Button variant="outline" className="bg-white text-[#223947] hover:bg-[#fffbf6]">
              Train Your AI
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}