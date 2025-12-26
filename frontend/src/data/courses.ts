import { Course } from '../types/course';

export const COMPREHENSIVE_COURSES: Course[] = [
    {
        id: 1,
        title: "Investing Fundamentals",
        emoji: "📚",
        description: "Master the core concepts of investing with practical examples and real-world applications.",
        duration: "45 min",
        level: "beginner",
        unlocked: true,
        rating: 4.9,
        students: 2847,
        modules: [
            {
                id: 1,
                title: "What is Investing?",
                type: "lesson",
                content: {
                    text: "",
                    video: "intro-to-investing.mp4",
                    quiz: [
                        {
                            question: "What is the best description of 'Investing'?",
                            options: [
                                "Hiding money under your mattress",
                                "Putting money to work to generate returns over time",
                                "Spending money on luxury goods",
                                "Asking friends for loans"
                            ],
                            correct: 1,
                            explanation: "Exactly! Investing is like planting seeds. You put money to work now so it can grow into something bigger in the future! 🌱"
                        },
                        {
                            question: "Which statement about Risk and Return is generally true?",
                            options: [
                                "Higher returns usually come with lower risk",
                                "Risk and return are not related",
                                "Higher potential returns usually come with higher risk",
                                "Safe investments always have the highest returns"
                            ],
                            correct: 2,
                            explanation: "Correct! It's like climbing a mountain 🏔️. The higher you go (higher return), the better the view, but the climb is more dangerous (higher risk)."
                        },
                        {
                            question: "What is a 'Time Horizon' in investing?",
                            options: [
                                "The time of day you buy stocks",
                                "How long you plan to keep your money invested",
                                "The time it takes to open an account",
                                "A sci-fi movie about finance"
                            ],
                            correct: 1,
                            explanation: "Spot on! ⏳ Your time horizon helps determine your strategy. If you have a long time (like 30 years), you can afford to take more risks for higher growth."
                        },
                        {
                            question: "Einstein called this the 'eighth wonder of the world'. What is it?",
                            options: [
                                "The Stock Market",
                                "Bitcoin",
                                "Compound Interest",
                                "Gold"
                            ],
                            correct: 2,
                            explanation: "Yes! Compound Interest is when your money earns returns, and then those returns earn MORE returns. It's exponential growth! 🚀"
                        }
                    ]
                }
            },
            {
                id: 2,
                title: "Types of Investments",
                type: "lesson",
                content: {
                    text: "",
                    quiz: [
                        {
                            question: "What does buying a stock represent?",
                            options: [
                                "Lending money to a company",
                                "Owning a piece of the company",
                                "Buying the company's products",
                                "Working for the company"
                            ],
                            correct: 1,
                            explanation: "When you buy stock, you become a partial owner of that company! You share in its successes (and risks). 🏢"
                        },
                        {
                            question: "Which investment is like being the bank and lending money?",
                            options: [
                                "Stocks",
                                "Bonds",
                                "Real Estate",
                                "Commodities"
                            ],
                            correct: 1,
                            explanation: "Exactly! With Bonds, you lend money to a government or company, and they pay you interest in return. 🏦"
                        },
                        {
                            question: "What is an ETF (Exchange Traded Fund)?",
                            options: [
                                "A single very expensive stock",
                                "A basket of many investments bundled together",
                                "A type of cryptocurrency",
                                "A fee you pay to brokers"
                            ],
                            correct: 1,
                            explanation: "Perfect! An ETF is like a fruit basket 🧺. Instead of buying just one apple (stock), you buy a basket with many different fruits (diversification)!"
                        }
                    ]
                }
            },
            {
                id: 3,
                title: "Building Your First Portfolio",
                type: "interactive",
                content: {
                    text: `
# Building Your First Portfolio 🎨

A portfolio is your collection of investments. Like a balanced meal, you want variety!

## The 60/40 Rule (Traditional)
- 60% Stocks (growth potential)
- 40% Bonds (stability)

## Modern Approach for Young Investors
- 70-80% Stock ETFs
- 10-20% International ETFs
- 5-10% Bonds
- 5% Alternative investments

## Sample $1,000 Student Portfolio:
- $400 - US Total Market ETF (VTI)
- $200 - International ETF (VTIAX)
- $200 - Individual growth stocks
- $150 - Bond ETF (BND)
- $50 - Fun money (crypto, individual picks)
          `,
                    interactive: true
                }
            }
        ],
        completed: false
    },
    {
        id: 2,
        title: "Stock Market Mastery",
        emoji: "📈",
        description: "Deep dive into stock analysis, market trends, and advanced trading strategies.",
        duration: "60 min",
        level: "intermediate",
        unlocked: true,
        rating: 4.8,
        students: 1923,
        modules: [
            {
                id: 1,
                title: "Reading Stock Charts",
                type: "lesson",
                content: {
                    text: "Learn to read candlesticks, trends, and volume.",
                    quiz: []
                }
            }
        ],
        completed: false
    },
    {
        id: 3,
        title: "Crypto & Web3",
        emoji: "₿",
        description: "Understand blockchain technology, cryptocurrencies, and the future of finance.",
        duration: "30 min",
        level: "advanced",
        unlocked: false,
        rating: 4.7,
        students: 1542,
        modules: [],
        completed: false
    },
    {
        id: 4,
        title: "Financial Independence",
        emoji: "🔥",
        description: "Strategies for FIRE (Financial Independence, Retire Early) and wealth building.",
        duration: "50 min",
        level: "intermediate",
        unlocked: false,
        rating: 4.9,
        students: 3102,
        modules: [],
        completed: false
    }
];
