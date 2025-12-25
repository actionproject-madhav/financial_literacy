// Comprehensive mock data for all pages

export interface MockSkill {
  id: string;
  name: string;
  icon: string;
  status: 'locked' | 'available' | 'in_progress' | 'mastered';
  progress?: number;
  level: number;
}

export interface MockSkillPath {
  id: string;
  name: string;
  skills: MockSkill[];
}

export interface MockQuestion {
  question: string;
  choices: { id: string; text: string }[];
  correctAnswerId: string;
  explanation: string;
  culturalBridge?: string;
}

export interface MockUser {
  name: string;
  email: string;
  avatar?: string;
  country: string;
  visaType: string;
  streak: number;
  totalXp: number;
  hearts: number;
  gems: number;
  level: number;
  levelProgress: number;
}

export const mockUser: MockUser = {
  name: 'Rajesh Kumar',
  email: 'rajesh@example.com',
  country: 'India',
  visaType: 'F1',
  streak: 42,
  totalXp: 4250,
  hearts: 5,
  gems: 350,
  level: 12,
  levelProgress: 65,
};

export const mockSkillPaths: MockSkillPath[] = [
  {
    id: 'banking',
    name: 'Banking Basics',
    skills: [
      {
        id: '1',
        name: 'Opening a Bank Account',
        icon: '🏦',
        status: 'mastered',
        level: 5,
      },
      {
        id: '2',
        name: 'Checking vs Savings',
        icon: '💳',
        status: 'mastered',
        level: 4,
      },
      {
        id: '3',
        name: 'Online Banking',
        icon: '📱',
        status: 'in_progress',
        progress: 65,
        level: 3,
      },
      {
        id: '4',
        name: 'Bank Fees',
        icon: '💰',
        status: 'available',
        level: 0,
      },
      {
        id: '5',
        name: 'Wire Transfers',
        icon: '🌐',
        status: 'locked',
        level: 0,
      },
    ],
  },
  {
    id: 'credit',
    name: 'Credit & Loans',
    skills: [
      {
        id: '6',
        name: 'Credit Score Basics',
        icon: '📊',
        status: 'mastered',
        level: 5,
      },
      {
        id: '7',
        name: 'Building Credit',
        icon: '📈',
        status: 'in_progress',
        progress: 80,
        level: 4,
      },
      {
        id: '8',
        name: 'Student Loans',
        icon: '🎓',
        status: 'available',
        level: 0,
      },
      {
        id: '9',
        name: 'Credit Cards',
        icon: '💳',
        status: 'locked',
        level: 0,
      },
    ],
  },
  {
    id: 'taxes',
    name: 'Taxes',
    skills: [
      {
        id: '10',
        name: 'Tax Filing Basics',
        icon: '📝',
        status: 'in_progress',
        progress: 45,
        level: 2,
      },
      {
        id: '11',
        name: 'W-2 and W-4 Forms',
        icon: '📄',
        status: 'available',
        level: 0,
      },
      {
        id: '12',
        name: 'Tax Deductions',
        icon: '✂️',
        status: 'locked',
        level: 0,
      },
    ],
  },
  {
    id: 'budgeting',
    name: 'Budgeting',
    skills: [
      {
        id: '13',
        name: 'Creating a Budget',
        icon: '📋',
        status: 'mastered',
        level: 5,
      },
      {
        id: '14',
        name: 'Tracking Expenses',
        icon: '📊',
        status: 'mastered',
        level: 4,
      },
      {
        id: '15',
        name: 'Emergency Fund',
        icon: '🛡️',
        status: 'available',
        level: 0,
      },
    ],
  },
];

export const mockQuestions: Record<string, MockQuestion[]> = {
  '1': [
    {
      question: 'What document is typically required to open a bank account in the US?',
      choices: [
        { id: 'A', text: 'Social Security Number (SSN)' },
        { id: 'B', text: 'Driver\'s license only' },
        { id: 'C', text: 'Credit card statement' },
        { id: 'D', text: 'Utility bill only' },
      ],
      correctAnswerId: 'A',
      explanation: 'A Social Security Number (SSN) or Individual Taxpayer Identification Number (ITIN) is typically required for opening a bank account in the US due to federal regulations.',
      culturalBridge: 'In the US, banks use your SSN to verify your identity and report interest income to the IRS. If you don\'t have an SSN, you can apply for an ITIN at an IRS office.',
    },
    {
      question: 'What is a common monthly fee for a checking account?',
      choices: [
        { id: 'A', text: '$0-$15' },
        { id: 'B', text: '$50-$100' },
        { id: 'C', text: '$200-$300' },
        { id: 'D', text: 'Free for everyone' },
      ],
      correctAnswerId: 'A',
      explanation: 'Most checking accounts charge between $0-$15 per month. Many banks waive fees if you maintain a minimum balance or set up direct deposit.',
      culturalBridge: 'Student checking accounts often have no monthly fees and special benefits for students.',
    },
    {
      question: 'Which type of account typically earns interest?',
      choices: [
        { id: 'A', text: 'Checking account' },
        { id: 'B', text: 'Savings account' },
        { id: 'C', text: 'Both checking and savings' },
        { id: 'D', text: 'Neither' },
      ],
      correctAnswerId: 'B',
      explanation: 'Savings accounts earn interest on your balance, while checking accounts typically don\'t (or earn very little).',
      culturalBridge: 'Interest rates vary by bank. Online banks often offer higher rates than traditional brick-and-mortar banks.',
    },
  ],
  '3': [
    {
      question: 'What is two-factor authentication (2FA) used for in online banking?',
      choices: [
        { id: 'A', text: 'To make transactions faster' },
        { id: 'B', text: 'To add an extra layer of security' },
        { id: 'C', text: 'To reduce fees' },
        { id: 'D', text: 'To increase interest rates' },
      ],
      correctAnswerId: 'B',
      explanation: 'Two-factor authentication adds an extra layer of security by requiring two forms of verification (like password + SMS code) when logging in.',
      culturalBridge: 'Always enable 2FA on your bank accounts to protect against fraud. It\'s free and takes just a minute to set up.',
    },
    {
      question: 'What should you do if you notice an unauthorized transaction?',
      choices: [
        { id: 'A', text: 'Wait and see if it happens again' },
        { id: 'B', text: 'Contact your bank immediately' },
        { id: 'C', text: 'Ignore it if it\'s small' },
        { id: 'D', text: 'Close your account immediately' },
      ],
      correctAnswerId: 'B',
      explanation: 'Contact your bank immediately. Federal law protects you from fraud, but you must report it promptly (usually within 60 days).',
      culturalBridge: 'Most US banks offer 24/7 fraud protection. Report unauthorized charges as soon as you notice them to minimize liability.',
    },
  ],
  '6': [
    {
      question: 'What is a good credit score range in the US?',
      choices: [
        { id: 'A', text: '300-500' },
        { id: 'B', text: '670-850' },
        { id: 'C', text: '850-1000' },
        { id: 'D', text: '500-600' },
      ],
      correctAnswerId: 'B',
      explanation: 'A good credit score ranges from 670-850. Scores above 750 are considered excellent and qualify for the best interest rates.',
      culturalBridge: 'Your credit score is crucial in the US. Landlords, employers, and insurers may check it, not just lenders.',
    },
    {
      question: 'What is the most important factor in calculating your credit score?',
      choices: [
        { id: 'A', text: 'Length of credit history' },
        { id: 'B', text: 'Payment history' },
        { id: 'C', text: 'Number of credit cards' },
        { id: 'D', text: 'Annual income' },
      ],
      correctAnswerId: 'B',
      explanation: 'Payment history accounts for 35% of your credit score, making it the most important factor. Always pay bills on time!',
      culturalBridge: 'Even one missed payment can significantly hurt your score. Set up automatic payments to avoid this mistake.',
    },
  ],
  'default': [
    {
      question: 'What is the emergency fund rule of thumb?',
      choices: [
        { id: 'A', text: '1 month of expenses' },
        { id: 'B', text: '3-6 months of expenses' },
        { id: 'C', text: '1 year of expenses' },
        { id: 'D', text: 'No emergency fund needed' },
      ],
      correctAnswerId: 'B',
      explanation: 'Financial experts recommend saving 3-6 months of expenses in an emergency fund to cover unexpected situations.',
      culturalBridge: 'As an international student, consider saving more (6-9 months) to account for visa-related uncertainties.',
    },
    {
      question: 'When should you start investing?',
      choices: [
        { id: 'A', text: 'After building an emergency fund' },
        { id: 'B', text: 'Immediately' },
        { id: 'C', text: 'After retirement' },
        { id: 'D', text: 'Only if you have $100,000' },
      ],
      correctAnswerId: 'A',
      explanation: 'Start investing after you have an emergency fund, paid off high-interest debt, and have extra money you won\'t need soon.',
      culturalBridge: 'Time in the market beats timing the market. Start small and invest consistently, even if it\'s just $50/month.',
    },
  ],
};

export const mockDailyProgress = {
  current: 35,
  target: 50,
};

