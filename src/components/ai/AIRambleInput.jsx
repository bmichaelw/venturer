import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AIRambleInput({ ventures, onComplete }) {
  const [rambleText, setRambleText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const queryClient = useQueryClient();

  const processMutation = useMutation({
    mutationFn: async (text) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert at parsing unstructured text into structured tasks, notes, and ideas.

User's message:
"${text}"

Available ventures: ${ventures.map(v => `${v.name} (id: ${v.id})`).join(', ')}

INSTRUCTIONS:
1. Parse this text and identify EVERY distinct task, note, or idea mentioned
2. Break down compound statements into multiple items (e.g., "I need to call John and email Sarah" = 2 tasks)
3. For each item, extract:
   - A clear, actionable title (max 100 chars)
   - Description with any additional context
   - Type: "task" (actionable item), "idea" (concept/suggestion), or "note" (information/reminder)
   - Venture/project if mentioned
   - For tasks only: due date, status indicators, urgency/importance
   - STEP values if mentioned (Sextant 1-6: urgency+importance, Time 1-3: duration, Effort 1-3: complexity, Priority 1-3)

CONTEXT UNDERSTANDING:
- "by Friday", "this week", "tomorrow" = extract due dates
- "urgent", "ASAP", "critical" = high priority/sextant 1 or 5
- "when I have time", "someday" = low priority/sextant 2 or 4
- "quick", "5 minutes" = time 1, effort 1
- "big project", "takes a while" = time 3, effort 3
- "call", "email", "meeting" = tasks
- "what if we", "maybe we could" = ideas
- "remember that", "note to self" = notes

Return as many items as you can identify. Better to create multiple small items than miss something.`,
        response_json_schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string', enum: ['task', 'idea', 'note'] },
                  venture_name: { type: 'string' },
                  due_date: { type: 'string' },
                  p_priority: { type: 'number' },
                  s_sextant: { type: 'number' },
                  t_time: { type: 'number' },
                  e_effort: { type: 'number' }
                },
                required: ['title', 'type']
              }
            }
          },
          required: ['items']
        }
      });
      return response;
    },
    onSuccess: async (data) => {
      const items = data.items || [];
      
      // Match venture names to IDs
      const itemsWithVentureIds = items.map(item => {
        if (item.venture_name) {
          const venture = ventures.find(v => 
            v.name.toLowerCase().includes(item.venture_name.toLowerCase()) ||
            item.venture_name.toLowerCase().includes(v.name.toLowerCase())
          );
          return {
            ...item,
            venture_id: venture?.id || null
          };
        }
        return item;
      });

      // Create all items
      await base44.entities.Item.bulkCreate(
        itemsWithVentureIds.map(({ venture_name, ...item }) => item)
      );

      queryClient.invalidateQueries({ queryKey: ['items'] });
      
      const taskCount = items.filter(i => i.type === 'task').length;
      const ideaCount = items.filter(i => i.type === 'idea').length;
      const noteCount = items.filter(i => i.type === 'note').length;
      
      const summary = [
        taskCount > 0 && `${taskCount} task${taskCount > 1 ? 's' : ''}`,
        ideaCount > 0 && `${ideaCount} idea${ideaCount > 1 ? 's' : ''}`,
        noteCount > 0 && `${noteCount} note${noteCount > 1 ? 's' : ''}`
      ].filter(Boolean).join(', ');
      
      toast.success(`Created ${summary} from your message`);
      setRambleText('');
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast.error('Failed to process ramble: ' + error.message);
    }
  });

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      toast.success('Listening... speak now');
    };

    recognitionInstance.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = rambleText;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setRambleText(finalTranscript + interimTranscript);
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast.error('Voice input error: ' + event.error);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    recognitionInstance.start();
    setRecognition(recognitionInstance);
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      setRecognition(null);
    }
  };

  const handleSubmit = () => {
    if (!rambleText.trim()) return;
    processMutation.mutate(rambleText);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#4B5563] mb-4">
        Dump everything on your mind. AI will break it down into organized tasks, ideas, and notes.
      </p>

      <Textarea
        value={rambleText}
        onChange={(e) => setRambleText(e.target.value)}
        placeholder="Example: 'Need to call John about the proposal by Friday and email Sarah the report. Had an idea - what if we automated the weekly updates? Also remind me to review Q1 budget and schedule the team meeting. The website needs a refresh, maybe add dark mode. Don't forget to follow up with marketing about the campaign launch...'"
        className="min-h-[160px] mb-4 bg-white border-[#E5E7EB] focus-visible:ring-[#14B8A6]"
        disabled={processMutation.isPending}
      />

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!rambleText.trim() || processMutation.isPending}
          className="bg-[#14B8A6] hover:bg-[#0d9488] flex-1"
        >
          {processMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Process with AI
            </>
          )}
        </Button>

        <Button
          onClick={isListening ? stopListening : startListening}
          disabled={processMutation.isPending}
          variant={isListening ? 'destructive' : 'outline'}
          className="px-4"
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Voice
            </>
          )}
        </Button>
      </div>

      {isListening && (
        <div className="mt-3 flex items-center gap-2 text-sm text-[#14B8A6]">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Listening...
        </div>
      )}
    </div>
  );
}