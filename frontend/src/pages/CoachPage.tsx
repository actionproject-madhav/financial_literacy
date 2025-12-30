import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, ChevronRight } from 'lucide-react'
import { chatApi, ChatMessage } from '../services/api'
import { useUserStore } from '../stores/userStore'

export const CoachPage = () => {
    const { learnerId } = useUserStore()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [quickQuestions, setQuickQuestions] = useState<string[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (quickQuestions.length === 0) {
            chatApi.getQuickQuestions().then((data) => {
                setQuickQuestions(data.questions)
            }).catch(console.error)
        }
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return

        const userMessage: ChatMessage = {
            role: 'user',
            content: messageText.trim(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput('')
        setIsLoading(true)
        setSuggestions([])

        try {
            const response = await chatApi.sendMessage({
                message: messageText.trim(),
                learner_id: learnerId || undefined,
                conversation_id: conversationId || undefined,
            })

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.response,
            }

            setMessages((prev) => [...prev, assistantMessage])
            setConversationId(response.conversation_id)
            setSuggestions(response.suggestions || [])
        } catch (error) {
            console.error('Chat error:', error)
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendMessage(input)
    }

    const handleQuickQuestion = (question: string) => {
        sendMessage(question)
    }

    const startNewChat = () => {
        setMessages([])
        setConversationId(null)
        setSuggestions([])
    }

    return (
        <div className="min-h-screen bg-[#f7f7f7]">
            <div className="max-w-3xl mx-auto flex flex-col h-screen">
                {/* Header */}
                <div className="bg-white border-b-2 border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#58cc02] rounded-full flex items-center justify-center">
                            <img src="/profile.svg" alt="Coach" className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="font-extrabold text-xl text-gray-800">FinAI Coach</h1>
                            <p className="text-sm text-gray-500">Your personal financial guide</p>
                        </div>
                    </div>
                    {messages.length > 0 && (
                        <button
                            onClick={startNewChat}
                            className="px-4 py-2 text-sm font-bold text-[#58cc02] hover:bg-[#e5f7d3] rounded-xl transition-colors uppercase tracking-wide border-2 border-[#58cc02]"
                        >
                            New Chat
                        </button>
                    )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
                            <div className="w-20 h-20 bg-[#e5f7d3] rounded-full flex items-center justify-center mb-6">
                                <MessageCircle className="w-10 h-10 text-[#58cc02]" />
                            </div>
                            <h2 className="font-extrabold text-2xl text-gray-800 mb-3">How can I help you today?</h2>
                            <p className="text-gray-500 mb-8 max-w-md">
                                Ask me anything about US banking, credit, taxes, investing, or financial planning for immigrants.
                            </p>

                            {/* Quick Questions */}
                            <div className="w-full max-w-lg space-y-3">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Popular Questions</p>
                                {quickQuestions.slice(0, 6).map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleQuickQuestion(question)}
                                        className="w-full text-left p-4 bg-white border-2 border-gray-200 hover:border-[#58cc02] rounded-2xl text-sm text-gray-700 transition-all flex items-center justify-between group hover:shadow-md"
                                    >
                                        <span className="font-medium">{question}</span>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#58cc02] transition-colors" />
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
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 bg-[#58cc02] rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                            <img src="/profile.svg" alt="Coach" className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[75%] p-4 rounded-2xl ${
                                            message.role === 'user'
                                                ? 'bg-[#58cc02] text-white rounded-br-md'
                                                : 'bg-white border-2 border-gray-200 text-gray-800 rounded-bl-md'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="w-8 h-8 bg-[#58cc02] rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                        <img src="/profile.svg" alt="Coach" className="w-5 h-5" />
                                    </div>
                                    <div className="bg-white border-2 border-gray-200 p-4 rounded-2xl rounded-bl-md">
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
                                <div className="flex flex-wrap gap-2 pl-10">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleQuickQuestion(suggestion)}
                                            className="px-4 py-2 bg-white border-2 border-gray-200 hover:border-[#58cc02] text-gray-700 text-xs font-bold rounded-full transition-colors"
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

                {/* Input Area */}
                <div className="bg-white border-t-2 border-gray-200 p-4 sticky bottom-0">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about US finances..."
                            className="flex-1 px-4 py-3 bg-[#f7f7f7] border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#58cc02] transition-all font-medium"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="px-5 py-3 bg-[#58cc02] text-white rounded-2xl hover:bg-[#46a302] disabled:opacity-50 disabled:cursor-not-allowed transition-all border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 font-bold"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="text-xs text-gray-400 mt-3 text-center">
                        FinAI Coach provides general guidance. Consult professionals for major financial decisions.
                    </p>
                </div>
            </div>
        </div>
    )
}
