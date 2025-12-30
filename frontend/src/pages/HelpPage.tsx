import { useState } from 'react'
import { ChevronDown, ChevronUp, Mail, MessageCircle, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface FAQItem {
    question: string
    answer: string
}

const faqs: FAQItem[] = [
    {
        question: "How do I earn XP?",
        answer: "You earn XP by completing lessons, maintaining your daily streak, and completing quests. The more accurate you are, the more XP you earn!"
    },
    {
        question: "What is a streak?",
        answer: "A streak is the number of consecutive days you've practiced. Keep your streak going by completing at least one lesson every day!"
    },
    {
        question: "How does the leaderboard work?",
        answer: "The leaderboard ranks users by XP earned during the current week. Top performers advance to higher leagues, while those at the bottom may be demoted."
    },
    {
        question: "Can I change my daily goal?",
        answer: "Yes! Go to Settings > Daily Goal to adjust how many minutes you want to practice each day."
    },
    {
        question: "How do I use the FinAI Coach?",
        answer: "Click on 'Coach' in the sidebar to chat with our AI financial advisor. Ask questions about banking, credit, taxes, and more!"
    },
    {
        question: "What topics are covered?",
        answer: "FinLit covers banking basics, credit building, US tax system, investing fundamentals, and financial topics specifically relevant to immigrants in the US."
    },
    {
        question: "Is my data private?",
        answer: "Yes, your learning data is private and secure. We only use it to personalize your learning experience. See our Privacy Policy for details."
    },
    {
        question: "How do I delete my account?",
        answer: "Go to Settings > Data > Delete Account. Please note this action is permanent and cannot be undone."
    },
]

export const HelpPage = () => {
    const navigate = useNavigate()
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <div className="min-h-screen bg-[#f7f7f7] pb-20">
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Help Center</h1>
                    <p className="text-gray-500">Find answers to common questions</p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => {
                            const event = new CustomEvent('openCoach');
                            window.dispatchEvent(event);
                        }}
                        className="bg-white border-2 border-gray-200 rounded-2xl p-4 text-left hover:border-[#58cc02] transition-colors"
                    >
                        <div className="w-10 h-10 bg-[#e5f7d3] rounded-xl flex items-center justify-center mb-3">
                            <MessageCircle className="w-5 h-5 text-[#58cc02]" />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">Chat with AI</h3>
                        <p className="text-sm text-gray-500">Get instant answers from FinAI Coach</p>
                    </button>

                    <a
                        href="mailto:support@finlit.app"
                        className="bg-white border-2 border-gray-200 rounded-2xl p-4 text-left hover:border-[#58cc02] transition-colors"
                    >
                        <div className="w-10 h-10 bg-[#e5f7d3] rounded-xl flex items-center justify-center mb-3">
                            <Mail className="w-5 h-5 text-[#58cc02]" />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">Email Support</h3>
                        <p className="text-sm text-gray-500">Get help from our team</p>
                    </a>
                </div>

                {/* FAQ Section */}
                <div className="mb-8">
                    <h2 className="font-extrabold text-gray-800 text-lg mb-4">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full flex items-center justify-between p-4 text-left"
                                >
                                    <span className="font-bold text-gray-800">{faq.question}</span>
                                    {openIndex === index ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                {openIndex === index && (
                                    <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Links */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
                    <h3 className="font-bold text-gray-800 mb-3">Legal</h3>
                    <div className="space-y-2">
                        <a
                            href="#"
                            className="flex items-center justify-between text-gray-600 hover:text-[#58cc02] transition-colors"
                        >
                            <span>Privacy Policy</span>
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        <a
                            href="#"
                            className="flex items-center justify-between text-gray-600 hover:text-[#58cc02] transition-colors"
                        >
                            <span>Terms of Service</span>
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
