import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, ChevronRight, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi, ChatMessage } from '../services/api';
import { useUserStore } from '../stores/userStore';
import { useLanguage } from '../contexts/LanguageContext';

interface FinAICoachPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FinAICoachPanel({ isOpen, onClose }: FinAICoachPanelProps) {
  const { learnerId } = useUserStore();
  const { selectedLanguage } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && quickQuestions.length === 0) {
      chatApi.getQuickQuestions().then((data) => {
        setQuickQuestions(data.questions);
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      const response = await chatApi.sendMessage({
        message: messageText.trim(),
        learner_id: learnerId || undefined,
        conversation_id: conversationId || undefined,
        language: selectedLanguage,  // Pass current language
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(response.conversation_id);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setSuggestions([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[9998] lg:hidden"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: isMinimized ? 'calc(100% - 60px)' : 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="bg-white border-b-2 border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#58cc02] rounded-full flex items-center justify-center flex-shrink-0">
                  <img src="/profile.svg" alt="Coach" className="w-6 h-6" />
                </div>
                {!isMinimized && (
                  <div>
                    <h2 className="font-extrabold text-gray-800">FinAI Coach</h2>
                    <p className="text-xs text-gray-500">Your financial guide</p>
                  </div>
                )}
              </div>
              {!isMinimized && (
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <button
                      onClick={startNewChat}
                      className="text-xs font-bold text-[#58cc02] hover:text-[#46a302] px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wide"
                    >
                      New Chat
                    </button>
                  )}
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Minimize2 className="w-5 h-5 text-gray-500" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              )}
              {isMinimized && (
                <button
                  onClick={() => setIsMinimized(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-[#58cc02]" />
                </button>
              )}
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f7f7f7]">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                      <div className="w-16 h-16 bg-[#e5f7d3] rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-8 h-8 text-[#58cc02]" />
                      </div>
                      <h3 className="font-extrabold text-gray-800 mb-2">How can I help you today?</h3>
                      <p className="text-gray-500 text-sm mb-6">
                        Ask me anything about US banking, credit, taxes, or financial planning.
                      </p>

                      {/* Quick Questions */}
                      <div className="w-full space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Popular Questions</p>
                        {quickQuestions.slice(0, 4).map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickQuestion(question)}
                            className="w-full text-left p-3 bg-white border-2 border-gray-200 hover:border-[#58cc02] rounded-xl text-sm text-gray-700 transition-colors flex items-center justify-between group"
                          >
                            <span>{question}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#58cc02]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] p-3 rounded-2xl ${
                              message.role === 'user'
                                ? 'bg-[#58cc02] text-white rounded-br-md'
                                : 'bg-white border-2 border-gray-200 text-gray-800 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white border-2 border-gray-200 p-3 rounded-2xl rounded-bl-md">
                            <div className="flex space-x-2">
                              <div className="w-2 h-2 bg-[#58cc02] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-[#58cc02] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-[#58cc02] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Follow-up Suggestions */}
                      {suggestions.length > 0 && !isLoading && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleQuickQuestion(suggestion)}
                              className="px-3 py-1.5 bg-white border-2 border-gray-200 hover:border-[#58cc02] text-gray-700 text-xs font-bold rounded-full transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 bg-white border-t-2 border-gray-200 flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about US finances..."
                      className="flex-1 px-4 py-3 bg-[#f7f7f7] border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#58cc02] transition-all"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="px-4 py-3 bg-[#58cc02] text-white rounded-xl hover:bg-[#46a302] disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    FinAI Coach provides general guidance. Consult professionals for major decisions.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

