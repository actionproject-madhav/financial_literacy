import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, ChevronRight, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi, ChatMessage } from '../services/api';
import { useUserStore } from '../stores/userStore';
import { useLanguage } from '../contexts/LanguageContext';
import { LottieAnimation } from './LottieAnimation';

interface FinAICoachPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FinAICoachPanel({ isOpen, onClose }: FinAICoachPanelProps) {
  const { learnerId } = useUserStore();
  const { language, t } = useLanguage();
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
      chatApi.getQuickQuestions(language).then((data) => {
        setQuickQuestions(data.questions);
      }).catch(console.error);
    }
  }, [isOpen, language]);

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
        language: language,  // Pass current language
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
        content: t('coach.error'),
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
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src="/3d-models/monster-1.png"
                  alt="FinAI Mascot"
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h2 className="font-extrabold text-gray-800">{t('coach.title')}</h2>
                  <p className="text-xs text-gray-500">{t('coach.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={startNewChat}
                    className="text-xs font-bold text-[#58cc02] hover:text-[#46a302] px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wide"
                  >
                    {t('coach.newChat')}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col px-2">
                    {/* Hero Section with Mascot */}
                    <div className="text-center py-6">
                      <img
                        src="/3d-models/monster-1.png"
                        alt="FinAI Mascot"
                        className="w-20 h-20 object-contain mx-auto mb-4"
                      />
                      <h3 className="text-xl font-extrabold text-gray-800 mb-2">{t('coach.greeting')}</h3>
                      <p className="text-gray-500 text-sm">
                        {t('coach.description')}
                      </p>
                    </div>

                    {/* Colorful Suggestion Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div
                        className="bg-[#E8F5E9] rounded-xl p-4 cursor-pointer hover:brightness-95 transition-all"
                        onClick={() => handleQuickQuestion('How do I open a bank account?')}
                      >
                        <div className="w-8 h-8 mb-2 flex items-center justify-center bg-white/60 rounded-lg overflow-hidden">
                          <LottieAnimation 
                            src="document.json" 
                            className="w-full h-full"
                            loop={true}
                          />
                        </div>
                        <p className="text-sm font-bold text-gray-700">Open a bank account</p>
                        <p className="text-xs text-gray-500 mt-1">Without an SSN...</p>
                      </div>
                      <div
                        className="bg-[#F3E5F5] rounded-xl p-4 cursor-pointer hover:brightness-95 transition-all"
                        onClick={() => handleQuickQuestion('How do I build credit as a new immigrant?')}
                      >
                        <div className="w-8 h-8 mb-2 flex items-center justify-center bg-white/60 rounded-lg overflow-hidden">
                          <LottieAnimation 
                            src="card.json" 
                            className="w-full h-full"
                            loop={true}
                          />
                        </div>
                        <p className="text-sm font-bold text-gray-700">Build credit score</p>
                        <p className="text-xs text-gray-500 mt-1">As a new immigrant...</p>
                      </div>
                    </div>

                    {/* Quick Questions List */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{t('coach.popularQuestions')}</p>
                      {quickQuestions.slice(0, 4).map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickQuestion(question)}
                          className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-700 transition-colors flex items-center justify-between group"
                        >
                          <span className="font-medium">{question}</span>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
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
                          className={`max-w-[85%] p-3 rounded-2xl ${message.role === 'user'
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
              <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-3 items-center bg-gray-100 rounded-full px-4 py-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('coach.inputPlaceholder')}
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 bg-[#4ECDC4] text-white rounded-full hover:bg-[#3DBDB5] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  {t('coach.disclaimer')}
                </p>
              </form>
            </>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

