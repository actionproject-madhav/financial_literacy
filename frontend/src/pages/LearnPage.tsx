import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SkillBubble } from '../components/lesson/SkillBubble';
import { DailyGoalProgress } from '../components/gamification/DailyGoalProgress';

// Mock data - replace with actual API calls
const skillPaths = [
  {
    id: 'banking',
    name: 'Banking Basics',
    skills: [
      { id: 'currency', name: 'US Currency', icon: '💵', status: 'mastered' as const, level: 5 },
      { id: 'checking', name: 'Checking', icon: '🏦', status: 'in_progress' as const, progress: 60, level: 2 },
      { id: 'savings', name: 'Savings', icon: '💰', status: 'available' as const, level: 0 },
      { id: 'mobile', name: 'Mobile Banking', icon: '📱', status: 'locked' as const, level: 0 },
    ],
  },
  {
    id: 'credit',
    name: 'Credit & Debt',
    skills: [
      { id: 'credit-score', name: 'Credit Score', icon: '📊', status: 'available' as const, level: 0 },
      { id: 'cards', name: 'Credit Cards', icon: '💳', status: 'locked' as const, level: 0 },
      { id: 'building', name: 'Building Credit', icon: '📈', status: 'locked' as const, level: 0 },
    ],
  },
];

export const LearnPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Daily Goal */}
      <DailyGoalProgress current={35} target={50} />

      {/* Current Progress Card */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-duo-text">Banking Basics</h2>
            <p className="text-sm text-duo-text-muted">Module 1 of 11</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-duo-green">60%</p>
            <p className="text-sm text-duo-text-muted">complete</p>
          </div>
        </div>
        <ProgressBar value={60} max={100} variant="default" size="lg" />
      </Card>

      {/* Skill Paths */}
      {skillPaths.map((path, pathIndex) => (
        <motion.section
          key={path.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: pathIndex * 0.1 }}
        >
          <h3 className="text-lg font-bold text-duo-text mb-4 px-2">
            {path.name}
          </h3>

          {/* Skill Path with connecting line */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-duo-border -translate-x-1/2 z-0" />

            {/* Skills */}
            <div className="relative z-10 flex flex-col items-center gap-4">
              {path.skills.map((skill, skillIndex) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: pathIndex * 0.1 + skillIndex * 0.05 }}
                  className={skillIndex % 2 === 0 ? 'self-start ml-8' : 'self-end mr-8'}
                >
                  <SkillBubble
                    name={skill.name}
                    icon={skill.icon}
                    status={skill.status}
                    progress={skill.progress}
                    level={skill.level}
                    onClick={() => console.log('Start skill:', skill.id)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      ))}
    </div>
  );
};

