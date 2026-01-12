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
        prompt: `You are helping parse a user's rambling thoughts about tasks, ideas, and notes into structured items.

User's rambling:
"${text}"

Available ventures: ${ventures.map(v => `${v.name} (id: ${v.id})`).join(', ')}

Parse this into an array of items. For each item:
1. Extract a clear title (max 100 chars)
2. Extract any description/details
3. Determine if it's a task, idea, or note
4. If it mentions a venture/project, extract that
5. If it's a task, extract: due date, priority (1-3), urgency indicators
6. Extract STEP values if mentioned (Sextant 1-6, Time 1-3, Effort 1-3, Priority 1-3)

Return ONLY valid JSON array with this schema:
{
  "items": [
    {
      "title": "string",
      "description": "string or null",
      "type": "task" | "idea" | "note",
      "venture_name": "string or null",
      "due_date": "YYYY-MM-DD or null",
      "p_priority": 1-3 or null,
      "s_sextant": 1-6 or null,
      "t_time": 1-3 or null,
      "e_effort": 1-3 or null
    }
  ]
}`,
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
      toast.success(`Created ${items.length} items from your ramble`);
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
        Speak or type freely about tasks, ideas, and notes. AI will structure them for you.
      </p>

      <Textarea
        value={rambleText}
        onChange={(e) => setRambleText(e.target.value)}
        placeholder="Example: 'Need to call the client about the marketing campaign by Friday, also had an idea for a new product feature - what if we added dark mode? Oh and remind me to review the Q1 budget...'"
        className="min-h-[120px] mb-4 bg-white border-[#E5E7EB] focus-visible:ring-[#14B8A6]"
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