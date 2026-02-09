import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, Sparkles, AlertTriangle, TrendingUp, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';

export default function DashboardAssistant({ items, ventures, projects }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [showInsights, setShowInsights] = useState(true);

  useEffect(() => {
    generateInsights();
  }, [items, ventures, projects]);

  const generateInsights = () => {
    const newInsights = [];

    // Analyze overdue tasks
    const overdueTasks = items.filter(item => 
      item.type === 'task' && 
      item.status !== 'completed' && 
      item.due_date && 
      isPast(parseISO(item.due_date))
    );

    if (overdueTasks.length > 0) {
      newInsights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
        description: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} that need attention.`,
        action: 'View Tasks',
        items: overdueTasks.slice(0, 3),
        color: 'text-red-600 bg-red-50 border-red-200'
      });
    }

    // Analyze STEP - find high priority urgent tasks
    const urgentImportantTasks = items.filter(item =>
      item.type === 'task' &&
      item.status !== 'completed' &&
      item.s_sextant === 1 // Urgent + Important
    );

    if (urgentImportantTasks.length > 0) {
      newInsights.push({
        type: 'priority',
        icon: Sparkles,
        title: `${urgentImportantTasks.length} Critical Task${urgentImportantTasks.length > 1 ? 's' : ''}`,
        description: `These tasks are urgent AND important (Sextant 1). Focus here first.`,
        action: 'Prioritize',
        items: urgentImportantTasks.slice(0, 3),
        color: 'text-amber-600 bg-amber-50 border-amber-200'
      });
    }

    // Analyze Dump items that should be converted
    const dumpItems = items.filter(item => 
      !item.project_id && 
      !item.venture_id && 
      item.type !== 'task'
    );

    if (dumpItems.length > 10) {
      newInsights.push({
        type: 'info',
        icon: TrendingUp,
        title: `${dumpItems.length} Unprocessed Items in Dump`,
        description: `Time to organize! Convert promising ideas and notes into actionable tasks.`,
        action: 'Review Dump',
        items: dumpItems.slice(0, 3),
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      });
    }

    // Find tasks with high effort but low priority (potential bottlenecks)
    const bottleneckTasks = items.filter(item =>
      item.type === 'task' &&
      item.status !== 'completed' &&
      item.e_effort === 3 && // High effort
      item.p_priority <= 2 // Low/medium priority
    );

    if (bottleneckTasks.length > 0) {
      newInsights.push({
        type: 'warning',
        icon: Clock,
        title: `${bottleneckTasks.length} Potential Bottleneck${bottleneckTasks.length > 1 ? 's' : ''}`,
        description: `These tasks require high effort but may not be priorities. Consider delegating or deferring.`,
        action: 'Review',
        items: bottleneckTasks.slice(0, 3),
        color: 'text-purple-600 bg-purple-50 border-purple-200'
      });
    }

    // Find tasks due soon (within 3 days)
    const upcomingTasks = items.filter(item =>
      item.type === 'task' &&
      item.status !== 'completed' &&
      item.due_date &&
      !isPast(parseISO(item.due_date)) &&
      differenceInDays(parseISO(item.due_date), new Date()) <= 3
    );

    if (upcomingTasks.length > 0) {
      newInsights.push({
        type: 'info',
        icon: Clock,
        title: `${upcomingTasks.length} Task${upcomingTasks.length > 1 ? 's' : ''} Due Soon`,
        description: `These tasks are due within the next 3 days.`,
        action: 'Plan Ahead',
        items: upcomingTasks.slice(0, 3),
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
      });
    }

    setInsights(newInsights);
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResponse('');

    try {
      // Prepare context about ventures and projects
      const context = {
        ventures: ventures.map(v => ({
          id: v.id,
          name: v.name,
          description: v.description,
          projectCount: projects.filter(p => p.venture_id === v.id).length
        })),
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          ventureName: ventures.find(v => v.id === p.venture_id)?.name,
          taskCount: items.filter(i => i.project_id === p.id && i.type === 'task').length,
          completedTasks: items.filter(i => i.project_id === p.id && i.type === 'task' && i.status === 'completed').length
        })),
        tasks: items.filter(i => i.type === 'task').map(i => ({
          title: i.title,
          status: i.status,
          due_date: i.due_date,
          projectName: projects.find(p => p.id === i.project_id)?.name,
          s_sextant: i.s_sextant,
          t_time: i.t_time,
          e_effort: i.e_effort,
          p_priority: i.p_priority
        })),
        stats: {
          totalVentures: ventures.length,
          totalProjects: projects.length,
          totalTasks: items.filter(i => i.type === 'task').length,
          completedTasks: items.filter(i => i.type === 'task' && i.status === 'completed').length,
          overdueTasks: items.filter(i => i.type === 'task' && i.status !== 'completed' && i.due_date && isPast(parseISO(i.due_date))).length,
          dumpItems: items.filter(i => !i.project_id && !i.venture_id).length
        }
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI assistant helping a user manage multiple ventures and projects using a project management system called Venturer.

Context about the user's current data:
${JSON.stringify(context, null, 2)}

User question: "${query}"

Provide a helpful, concise response. If referring to specific projects or tasks, mention them by name. Be conversational and actionable. If you notice concerning patterns (like many overdue tasks), mention them proactively.`,
      });

      setResponse(result);
    } catch (error) {
      setResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Proactive Insights */}
      {insights.length > 0 && (
        <Card className="border-2 border-[#223947]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-[#223947]" />
                AI Insights
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
              >
                {showInsights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          {showInsights && (
            <CardContent className="space-y-3">
              {insights.map((insight, idx) => {
                const Icon = insight.icon;
                return (
                  <div key={idx} className={`border rounded-lg p-3 ${insight.color}`}>
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1">{insight.title}</p>
                        <p className="text-xs mb-2 opacity-80">{insight.description}</p>
                        {insight.items && insight.items.length > 0 && (
                          <div className="space-y-1 mb-2">
                            {insight.items.map(item => (
                              <Link
                                key={item.id}
                                to={`/ItemDetail?id=${item.id}`}
                                className="block text-xs hover:underline font-medium"
                              >
                                • {item.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      )}

      {/* Query Interface */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-[#223947]" />
            Ask About Your Projects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleQuery} className="flex gap-2">
            <Input
              placeholder="e.g., 'What's my progress on the Marketing venture?' or 'Which tasks should I focus on today?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>

          {response && (
            <div className="bg-[#fffbf6] border border-[#dbb4b4] rounded-lg p-4">
              <p className="text-sm text-[#323232] whitespace-pre-wrap">{response}</p>
            </div>
          )}

          {!response && !isLoading && (
            <div className="flex flex-wrap gap-2">
              <p className="text-xs text-[#805c5c] w-full mb-1">Try asking:</p>
              {[
                "What's my overall progress?",
                "Which tasks are overdue?",
                "Show me high-priority items",
                "What should I focus on today?"
              ].map(suggestion => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery(suggestion);
                    setTimeout(() => {
                      const event = { preventDefault: () => {} };
                      handleQuery(event);
                    }, 100);
                  }}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}