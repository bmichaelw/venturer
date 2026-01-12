import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, itemTitle, itemDescription, teamMembers, dueDate } = await req.json();

    // Fetch all items and users for context
    const [allItems, allUsers] = await Promise.all([
      base44.entities.Item.list(),
      base44.entities.User.list(),
    ]);

    // Calculate team member workloads
    const workloadData = teamMembers.map(member => {
      const memberTasks = allItems.filter(
        item => item.assigned_to === member.email && item.status !== 'completed'
      );
      return {
        email: member.email,
        name: member.name,
        skills: member.skills || [],
        taskCount: memberTasks.length,
        completionRate: memberTasks.length > 0 ? 
          (memberTasks.filter(t => t.status === 'completed').length / memberTasks.length * 100).toFixed(0) : 
          100,
      };
    });

    // Get AI suggestions
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert task management AI. Analyze this task and provide suggestions:

Task: ${itemTitle}
Description: ${itemDescription || 'No description'}
Due Date: ${dueDate || 'Not specified'}

Team Members and Workload:
${workloadData.map(m => `- ${m.name} (${m.email}): ${m.taskCount} active tasks, ${m.completionRate}% completion rate`).join('\n')}

Provide suggestions in JSON format with:
1. "assignTo": Best team member email to assign (based on workload and skills)
2. "priority": Priority level 1-3 (1=low, 2=medium, 3=high) based on due date and complexity
3. "subtasks": Array of 2-4 subtask suggestions for this complex item (or empty if simple)
4. "sextant": Sextant value 1-6 based on urgency/importance
5. "confidence": Your confidence level 0-100%
6. "reasoning": Brief explanation of suggestions

Return ONLY valid JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          assignTo: { type: 'string' },
          priority: { type: 'number' },
          subtasks: { type: 'array', items: { type: 'string' } },
          sextant: { type: 'number' },
          confidence: { type: 'number' },
          reasoning: { type: 'string' },
        },
      },
    });

    return Response.json(aiResponse);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});