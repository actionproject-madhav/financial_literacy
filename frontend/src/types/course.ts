export interface Quiz {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

export interface ModuleContent {
    text: string;
    video?: string;
    quiz?: Quiz[];
    interactive?: boolean;
}

export interface Module {
    id: number;
    title: string;
    type: 'lesson' | 'video' | 'interactive' | 'chest' | 'trophy';
    content: ModuleContent;
}

export interface Course {
    id: number;
    title: string;
    emoji: string;
    description: string;
    duration: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    unlocked: boolean;
    rating: number;
    students: number;
    modules: Module[];
    completed: boolean;
}
