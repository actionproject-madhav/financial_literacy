import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SkillBubble } from '../components/lesson/SkillBubble';
import { DailyGoalProgress } from '../components/gamification/DailyGoalProgress';
import { useUserStore } from '../stores/userStore';
import { learnerApi, adaptiveApi } from '../services/api';

interface Skill {
  id: string;
  name: string;
  icon: string;
  status: 'locked' | 'available' | 'in_progress' | 'mastered';
  progress?: number;
  level: number;
}

interface SkillPath {
  id: string;
  name: string;
  skills: Skill[];
}

export const LearnPage: React.FC = () => {
  const navigate = useNavigate();
  const { learnerId, user, updateStreak } = useUserStore();
  const [skillPaths, setSkillPaths] = useState<SkillPath[]>([]);
  const [dailyProgress, setDailyProgress] = useState({ current: 0, target: 50 });
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!learnerId) {
      navigate('/auth');
    }
  }, [learnerId, navigate]);

  // Load learner data
  useEffect(() => {
    if (!learnerId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load skills
        const skills = await learnerApi.getSkills(learnerId);
        
        // Load all KCs to group by domain
        const allKCs = await adaptiveApi.getAllKCs();
        
        // Group KCs by domain
        const domainsMap = new Map<string, any[]>();
        allKCs.forEach((kc: any) => {
          const domain = kc.domain || 'general';
          if (!domainsMap.has(domain)) {
            domainsMap.set(domain, []);
          }
          domainsMap.get(domain)!.push(kc);
        });

        // Convert to skill paths
        const paths: SkillPath[] = [];
        domainsMap.forEach((kcs, domain) => {
          const domainSkills: Skill[] = kcs.map((kc: any) => {
            // Find matching skill state
            const skillState = skills.find((s: any) => s.kc_id === String(kc._id));
            
            let status: Skill['status'] = 'locked';
            let progress = 0;
            let level = 0;

            if (skillState) {
              status = skillState.status || 'available';
              progress = skillState.p_mastery ? Math.round(skillState.p_mastery * 100) : 0;
              level = skillState.level || 0;
            } else {
              // Check if skill has prerequisites met
              status = 'locked'; // Simplified - should check prerequisites
            }

            return {
              id: String(kc._id),
              name: kc.name || kc.kc_name || 'Unknown',
              icon: kc.icon || '📚',
              status,
              progress: status === 'in_progress' ? progress : undefined,
              level,
            };
          });

          paths.push({
            id: domain,
            name: domain.charAt(0).toUpperCase() + domain.slice(1).replace('_', ' '),
            skills: domainSkills,
          });
        });

        setSkillPaths(paths);

        // Load daily progress
        try {
          const progress = await learnerApi.getDailyProgress(learnerId);
          setDailyProgress({
            current: progress.xp_earned_today || 0,
            target: progress.daily_goal_xp || 50,
          });
        } catch (error) {
          console.warn('Could not load daily progress:', error);
        }

      } catch (error) {
        console.error('Failed to load learn page data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [learnerId]);

  const handleSkillClick = (skillId: string) => {
    navigate(`/lesson/${skillId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-duo-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-duo-green mx-auto mb-4"></div>
          <p className="text-duo-text-muted">Loading skills...</p>
        </div>
      </div>
    );
  }

  // Calculate overall progress (simplified)
  const overallProgress = skillPaths.length > 0
    ? skillPaths.reduce((acc, path) => {
        const pathProgress = path.skills.reduce((sum, skill) => {
          if (skill.status === 'mastered') return sum + 100;
          if (skill.status === 'in_progress') return sum + (skill.progress || 0);
          return sum;
        }, 0) / (path.skills.length * 100) * 100;
        return acc + pathProgress;
      }, 0) / skillPaths.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Daily Goal */}
      <DailyGoalProgress
        current={dailyProgress.current}
        target={dailyProgress.target}
      />

      {/* Overall Progress Card */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-duo-text">Overall Progress</h2>
            <p className="text-sm text-duo-text-muted">
              {skillPaths.length} skill path{skillPaths.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-duo-green">
              {Math.round(overallProgress)}%
            </p>
            <p className="text-sm text-duo-text-muted">complete</p>
          </div>
        </div>
        <ProgressBar value={overallProgress} max={100} variant="default" size="lg" />
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
                    onClick={() => skill.status !== 'locked' && handleSkillClick(skill.id)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      ))}

      {skillPaths.length === 0 && !isLoading && (
        <Card variant="elevated" padding="lg">
          <p className="text-center text-duo-text-muted">
            No skills available. Complete onboarding to get started!
          </p>
        </Card>
      )}
    </div>
  );
};
