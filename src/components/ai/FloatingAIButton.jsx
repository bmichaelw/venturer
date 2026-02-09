import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import AIRambleInput from './AIRambleInput';

export default function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('quick'); // 'quick' or 'assistant'
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.filter({ active: true }, 'name'),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversation?.id) {
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        setMessages(data.messages || []);
        setIsProcessing(false);
      });
      return () => unsubscribe();
    }
  }, [conversation?.id]);

  const startAssistant = async () => {
    try {
      const newConversation = await base44.agents.createConversation({
        agent_name: 'venture_assistant',
        metadata: { name: 'AI Assistant Session', description: 'Full CRUD operations' }
      });
      setConversation(newConversation);
      setMessages(newConversation.messages || []);
      setMode('assistant');
    } catch (error) {
      toast.error('Failed to start AI assistant: ' + error.message);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversation) return;
    
    setIsProcessing(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: input
      });
      setInput('');
      queryClient.invalidateQueries(['items']);
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['ventures']);
      queryClient.invalidateQueries(['milestones']);
      queryClient.invalidateQueries(['workstreams']);
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['teams']);
    } catch (error) {
      toast.error('Failed to send message: ' + error.message);
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
      >
        <Sparkles className="w-6 h-6 text-white group-hover:animate-pulse" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="bg-white dark:bg-gray-800 border-b border-[#E5E7EB] dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-4">
                <Sparkles className="w-5 h-5 text-[#3B82F6]" />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMode('quick');
                      setConversation(null);
                      setMessages([]);
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      mode === 'quick'
                        ? 'bg-[#3B82F6] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Quick Add
                  </button>
                  <button
                    onClick={() => mode === 'quick' && startAssistant()}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      mode === 'assistant'
                        ? 'bg-[#3B82F6] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    AI Assistant
                  </button>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {mode === 'quick' ? (
                <div className="p-6">
                  <AIRambleInput ventures={ventures} onComplete={() => setIsOpen(false)} />
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="mb-2">AI Assistant ready!</p>
                        <p className="text-sm">Try commands like:</p>
                        <ul className="text-xs mt-2 space-y-1 text-left max-w-md mx-auto">
                          <li>• "Add a task to call John by Friday"</li>
                          <li>• "Delete all completed tasks from Sound Library"</li>
                          <li>• "Show me all urgent tasks"</li>
                          <li>• "Create a new project called Website Refresh"</li>
                          <li>• "Mark all tasks in Marketing project as done"</li>
                        </ul>
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.role === 'user'
                                ? 'bg-[#3B82F6] text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            {msg.tool_calls?.map((tool, i) => (
                              <div key={i} className="mt-2 text-xs opacity-75">
                                {tool.status === 'running' && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                                {tool.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a command... (Shift+Enter for new line)"
                        className="min-h-[60px] max-h-[120px] resize-none"
                        disabled={isProcessing}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!input.trim() || isProcessing}
                        className="self-end"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}