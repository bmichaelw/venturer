import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function StepKeyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">STEP Method</h1>
        <p className="text-slate-600">
          A prioritization framework for managing tasks across multiple ventures
        </p>
      </div>

      <div className="space-y-6">
        {/* Sextant */}
        <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sextant</h2>
              <p className="text-sm text-slate-600">Urgency & Importance (Covey Quadrants + Late)</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <Badge className="bg-red-100 text-red-700 border-0 shrink-0">S:I</Badge>
              <div>
                <h3 className="font-semibold text-slate-900">Urgent & Important</h3>
                <p className="text-sm text-slate-600">Crisis, deadlines, pressing problems</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Badge className="bg-blue-100 text-blue-700 border-0 shrink-0">S:II</Badge>
              <div>
                <h3 className="font-semibold text-slate-900">Not Urgent but Important</h3>
                <p className="text-sm text-slate-600">Planning, prevention, capability building, relationships</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Badge className="bg-slate-100 text-slate-700 border-0 shrink-0">S:III</Badge>
              <div>
                <h3 className="font-semibold text-slate-900">Urgent but Not Important</h3>
                <p className="text-sm text-slate-600">Interruptions, some calls/emails, some meetings</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Badge className="bg-slate-100 text-slate-700 border-0 shrink-0">S:IV</Badge>
              <div>
                <h3 className="font-semibold text-slate-900">Not Urgent & Not Important</h3>
                <p className="text-sm text-slate-600">Trivia, busywork, time wasters</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <Badge className="bg-red-100 text-red-700 border-0 shrink-0">S:V</Badge>
              <div>
                <h3 className="font-semibold text-slate-900">Late but Important</h3>
                <p className="text-sm text-slate-600">Overdue critical items that need immediate attention</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Badge className="bg-slate-100 text-slate-700 border-0 shrink-0">S:VI</Badge>
              <div>
                <h3 className="font-semibold text-slate-900">Late & Not Important</h3>
                <p className="text-sm text-slate-600">Overdue items with low importance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Time, Effort, Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Time */}
          <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Time</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 border-0">T:1</Badge>
                <span className="text-sm text-slate-700">Short duration</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 border-0">T:2</Badge>
                <span className="text-sm text-slate-700">Medium duration</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 border-0">T:3</Badge>
                <span className="text-sm text-slate-700">Long duration</span>
              </div>
            </div>
          </div>

          {/* Effort */}
          <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">E</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Effort</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-700 border-0">E:1</Badge>
                <span className="text-sm text-slate-700">Low effort required</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-700 border-0">E:2</Badge>
                <span className="text-sm text-slate-700">Medium effort</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-700 border-0">E:3</Badge>
                <span className="text-sm text-slate-700">High effort</span>
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-2xl border border-stone-200/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Priority</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-0">P:1</Badge>
                <span className="text-sm text-slate-700">Low priority</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-700 border-0">P:2</Badge>
                <span className="text-sm text-slate-700">Medium priority</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-700 border-0">P:3</Badge>
                <span className="text-sm text-slate-700">High priority</span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-amber-50 rounded-2xl border border-amber-200/50 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-3">💡 Quick Wins Strategy</h3>
          <p className="text-slate-700 mb-3">
            To find your quick wins, filter by:
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
              <strong>S:I or S:II</strong> (Urgent/Important items)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
              <strong>E:1</strong> (Low effort)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
              <strong>P:3</strong> (High priority)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}