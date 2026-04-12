import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  HelpCircle,
  BookOpen,
  Target,
  Plus,
  Trash2
} from 'lucide-react';
import type { AiChatConversation, AiChatMessage } from '@/types/game';

interface AiChatInterfaceProps {
  chapterId?: string;
  chapterTitle?: string;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AiChatInterface({ chapterId, chapterTitle, onClose }: AiChatInterfaceProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/ai-chat/conversations'],
    enabled: isAuthenticated,
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/ai-chat/conversations', selectedConversationId, 'messages'],
    enabled: !!selectedConversationId,
  });

  // Fetch conversation starters for current chapter
  const { data: conversationStartersData } = useQuery({
    queryKey: ['/api/ai-chat/conversation-starters', chapterId],
    queryFn: async () => {
      if (!chapterId || !chapterTitle) return { starters: [] };
      const response = await apiRequest('GET', `/api/ai-chat/conversation-starters/${chapterId}?chapterTitle=${encodeURIComponent(chapterTitle)}`);
      return await response.json();
    },
    enabled: !!chapterId && !!chapterTitle,
  });
  
  const conversationStarters = (conversationStartersData as { starters: string[] })?.starters || [];

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; chapterId?: string }) => {
      const response = await apiRequest('POST', '/api/ai-chat/conversations', data);
      return await response.json();
    },
    onSuccess: (newConversation: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-chat/conversations'] });
      setSelectedConversationId(newConversation.id);
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; conversationId: string }) => {
      const response = await apiRequest('POST', `/api/ai-chat/conversations/${data.conversationId}/messages`, {
        message: data.message,
        chapterId,
        chapterTitle,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/ai-chat/conversations', selectedConversationId, 'messages'] 
      });
      setMessageInput('');
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  // Generate quiz
  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai-chat/generate-quiz', { chapterId, chapterTitle });
      return await response.json();
    },
  });

  // Generate scenario
  const generateScenarioMutation = useMutation({
    mutationFn: async (scenarioType: string) => {
      const response = await apiRequest('POST', '/api/ai-chat/generate-scenario', { chapterId, chapterTitle, scenarioType });
      return await response.json();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversationId) return;

    setIsLoading(true);
    sendMessageMutation.mutate({
      message: messageInput,
      conversationId: selectedConversationId,
    });
  };

  const handleStartNewConversation = (initialMessage?: string) => {
    const title = initialMessage 
      ? initialMessage.slice(0, 50) + (initialMessage.length > 50 ? '...' : '')
      : `Chat about ${chapterTitle || 'Financial Literacy'}`;
    
    createConversationMutation.mutate({
      title,
      chapterId,
    });

    if (initialMessage) {
      setMessageInput(initialMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-700">
        <CardContent className="p-6 text-center">
          <Bot className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Sign in to chat with your AI learning companion!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-100">AI Learning Companion</h3>
          {chapterTitle && (
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
              {chapterTitle}
            </Badge>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-chat">
            ×
          </Button>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Conversations Sidebar */}
        <div className="w-64 border-r border-slate-700 flex flex-col">
          <div className="p-3 border-b border-slate-700">
            <Button
              onClick={() => handleStartNewConversation()}
              className="w-full text-sm"
              size="sm"
              data-testid="button-new-conversation"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {(conversations as AiChatConversation[]).map((conv: AiChatConversation) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                    selectedConversationId === conv.id
                      ? 'bg-slate-700 text-slate-100'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  data-testid={`button-conversation-${conv.id}`}
                >
                  <div className="truncate">{conv.title}</div>
                  <div className="text-xs text-slate-500">
                    {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : ''}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversationId ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {(messages as AiChatMessage[]).map((msg: AiChatMessage) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-100'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                        </div>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-slate-700 p-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about financial literacy..."
                    className="flex-1 bg-slate-800 border-slate-600 text-slate-100"
                    disabled={isLoading}
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isLoading}
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Bot className="w-16 h-16 text-blue-400 mb-6" />
              <h2 className="text-xl font-semibold text-slate-100 mb-2">
                Hi! I'm your AI Learning Companion 🤖
              </h2>
              <p className="text-slate-300 mb-6 max-w-md">
                I'm here to help you understand financial concepts, answer your questions, 
                and make learning about money fun and engaging!
              </p>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mb-6">
                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center gap-2 border-slate-600 hover:bg-slate-800"
                  onClick={() => generateQuizMutation.mutate()}
                  disabled={!chapterId}
                  data-testid="button-generate-quiz"
                >
                  <HelpCircle className="w-6 h-6 text-blue-400" />
                  <span className="text-sm">Generate Quiz</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center gap-2 border-slate-600 hover:bg-slate-800"
                  onClick={() => generateScenarioMutation.mutate('budgeting')}
                  disabled={!chapterId}
                  data-testid="button-generate-scenario"
                >
                  <Target className="w-6 h-6 text-green-400" />
                  <span className="text-sm">Practice Scenario</span>
                </Button>
              </div>

              {/* Conversation Starters */}
              {conversationStarters.length > 0 && (
                <div className="w-full max-w-lg">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">
                    💡 Try asking about:
                  </h3>
                  <div className="space-y-2">
                    {conversationStarters.map((starter: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleStartNewConversation(starter)}
                        className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-200 transition-colors"
                        data-testid={`button-starter-${index}`}
                      >
                        "{starter}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}