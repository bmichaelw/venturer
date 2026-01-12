import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, UserPlus, FileEdit, Loader2, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

export default function EnhancedTaskSuggestions({ item, onUpdate }) {
  const [loadingSuggestion, setLoadingSuggestion] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const suggestDelegationMutation = useMutation({
    mutationFn: async () => {
      const availableUsers = users.map(user => {
        const profile = userProfiles.find(p => p.user_email === user.email);
        const memberInfo = teamMembers.find(m => m.user_email === user.email);
        return {
          email: user.email,
          name: user.full_name || user.email,
          skills: profile?.skills || [],
          expertise: profile?.expertise_areas || [],
          role: memberInfo?.role || 'member'
        };
      });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this task and suggest the best team member to assign it to based on their skills and expertise.

Task: "${item.title}"
Description: "${item.description || 'No description'}"
Priority: ${item.p_priority || 'Not set'}
Effort: ${item.e_effort || 'Not set'}

Available team members:
${availableUsers.map(u => `- ${u.name} (${u.email}): Skills: ${u.skills.join(', ') || 'None listed'}, Expertise: ${u.expertise.join(', ') || 'None listed'}`).join('\n')}

Suggest the best person and explain why. Return JSON with this schema:
{
  "suggested_email": "email@example.com",
  "reason": "Clear explanation of why this person is the best fit",
  "confidence": "high" | "medium" | "low"
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggested_email: { type: 'string' },
            reason: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
          },
          required: ['suggested_email', 'reason', 'confidence']
        }
      });

      return response;
    },
  });

  const refineDescriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Review this task and suggest improvements to make it clearer and more complete.

Task: "${item.title}"
Current description: "${item.description || 'No description provided'}"
Priority: ${item.p_priority || 'Not set'}
Due date: ${item.due_date || 'Not set'}

Provide:
1. A refined title (if needed)
2. A clearer, more complete description with specific action items
3. Any missing critical information that should be added

Return JSON:
{
  "refined_title": "string or null (only if improvement needed)",
  "refined_description": "string",
  "suggestions": ["list of missing information"],
  "clarity_score": 1-10
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            refined_title: { type: 'string' },
            refined_description: { type: 'string' },
            suggestions: { type: 'array', items: { type: 'string' } },
            clarity_score: { type: 'number' }
          },
          required: ['refined_description', 'suggestions', 'clarity_score']
        }
      });

      return response;
    },
  });

  const handleSuggestDelegation = async () => {
    setLoadingSuggestion('delegation');
    try {
      const result = await suggestDelegationMutation.mutateAsync();
      setLoadingSuggestion(null);
      
      // Show suggestion in a custom UI
      const confirmed = window.confirm(
        `AI suggests assigning to: ${users.find(u => u.email === result.suggested_email)?.full_name || result.suggested_email}\n\n` +
        `Reason: ${result.reason}\n\n` +
        `Confidence: ${result.confidence}\n\n` +
        `Apply this suggestion?`
      );

      if (confirmed) {
        onUpdate({ assigned_to: result.suggested_email });
        toast.success('Task assigned based on AI suggestion');
      }
    } catch (error) {
      setLoadingSuggestion(null);
      toast.error('Failed to get delegation suggestion');
    }
  };

  const handleRefineDescription = async () => {
    setLoadingSuggestion('description');
    try {
      const result = await refineDescriptionMutation.mutateAsync();
      setLoadingSuggestion(null);

      // Show refinement suggestions
      const updates = {};
      if (result.refined_title && result.refined_title !== item.title) {
        updates.title = result.refined_title;
      }
      if (result.refined_description !== item.description) {
        updates.description = result.refined_description;
      }

      const message = `AI refined your task (Clarity: ${result.clarity_score}/10):\n\n` +
        (updates.title ? `New title: "${updates.title}"\n\n` : '') +
        `Description: "${result.refined_description}"\n\n` +
        `Suggestions: ${result.suggestions.join(', ')}\n\n` +
        `Apply these improvements?`;

      const confirmed = window.confirm(message);

      if (confirmed) {
        onUpdate(updates);
        toast.success('Task description refined');
      }
    } catch (error) {
      setLoadingSuggestion(null);
      toast.error('Failed to refine description');
    }
  };

  if (item.type !== 'task') return null;

  return (
    <div className="bg-gradient-to-br from-[#14B8A6]/5 to-transparent rounded-lg border border-[#14B8A6]/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#14B8A6]" />
        <h4 className="text-sm font-semibold text-[#101827]">AI Assistance</h4>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleSuggestDelegation}
          disabled={loadingSuggestion === 'delegation'}
          size="sm"
          variant="outline"
          className="text-xs border-[#14B8A6] text-[#14B8A6] hover:bg-[#14B8A6]/10"
        >
          {loadingSuggestion === 'delegation' ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <UserPlus className="w-3 h-3 mr-1" />
              Suggest Assignment
            </>
          )}
        </Button>

        <Button
          onClick={handleRefineDescription}
          disabled={loadingSuggestion === 'description'}
          size="sm"
          variant="outline"
          className="text-xs border-[#14B8A6] text-[#14B8A6] hover:bg-[#14B8A6]/10"
        >
          {loadingSuggestion === 'description' ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileEdit className="w-3 h-3 mr-1" />
              Refine Description
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-[#4B5563]">
        AI can help assign tasks based on team skills and refine task clarity
      </p>
    </div>
  );
}