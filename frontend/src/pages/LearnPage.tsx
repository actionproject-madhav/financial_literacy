import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Unit } from '../components/lesson/Unit';
import { DailyGoalProgress } from '../components/gamification/DailyGoalProgress';
import { useUserStore } from '../stores/userStore';
import { learnerApi, adaptiveApi } from '../services/api';
import { mockSkillPaths, mockDailyProgress } from '../data/mockData';

interface Lesson {
  id: string;
  name: string;
  icon: string;
  completed: boolean;
  progress?: number;
}

interface UnitData {
  id: string;
  order: number;
  title: string;
  description: string;
  lessons: Lesson[];
}

export const LearnPage: React.FC = () => {
  const navigate = useNavigate();
  const { learnerId, user } = useUserStore();
  const [units, setUnits] = useState<UnitData[]>([]);
  const [dailyProgress, setDailyProgress] = useState({ current: 0, target: 50 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<{ id: string; unit?: { id: string } }>();
  const [activeLessonPercentage, setActiveLessonPercentage] = useState(0);

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

        // Convert to units with lessons
        const unitsData: UnitData[] = [];
        let orderIndex = 0;

        domainsMap.forEach((kcs, domain) => {
          const domainLessons: Lesson[] = kcs.map((kc: any) => {
            // Find matching skill state
            const skillState = skills.find((s: any) => s.kc_id === String(kc._id));

            let completed = false;
            let progress = 0;

            if (skillState) {
              completed = skillState.status === 'mastered';
              progress = skillState.p_mastery ? Math.round(skillState.p_mastery * 100) : 0;
            }

            return {
              id: String(kc._id),
              name: kc.name || kc.kc_name || 'Unknown',
              icon: kc.icon || '📚',
              completed,
              progress,
            };
          });

          unitsData.push({
            id: domain,
            order: orderIndex++,
            title: domain.charAt(0).toUpperCase() + domain.slice(1).replace('_', ' '),
            description: `Learn essential ${domain.replace('_', ' ')} concepts`,
            lessons: domainLessons,
          });
        });

        setUnits(unitsData);

        // Find the first incomplete lesson as active
        for (const unit of unitsData) {
          const incompleteLesson = unit.lessons.find((lesson) => !lesson.completed);
          if (incompleteLesson) {
            setActiveLesson({
              id: incompleteLesson.id,
              unit: { id: unit.id },
            });
            setActiveLessonPercentage(incompleteLesson.progress || 0);
            break;
          }
        }

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
        // Fallback to mock data if API fails
        const mockUnits: UnitData[] = mockSkillPaths.map((path, index) => ({
          id: path.id,
          order: index,
          title: path.name,
          description: `Learn essential ${path.name.toLowerCase()} concepts`,
          lessons: path.skills.map((skill) => ({
            id: skill.id,
            name: skill.name,
            icon: skill.icon,
            completed: skill.status === 'mastered',
            progress: skill.progress || 0,
          })),
        }));
        setUnits(mockUnits);
        setDailyProgress(mockDailyProgress);
      } finally {
        setIsLoading(false);
      }
    };

    if (learnerId) {
      loadData();
    } else {
      // Use mock data if not authenticated
      const mockUnits: UnitData[] = mockSkillPaths.map((path, index) => ({
        id: path.id,
        order: index,
        title: path.name,
        description: `Learn essential ${path.name.toLowerCase()} concepts`,
        lessons: path.skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          icon: skill.icon,
          completed: skill.status === 'mastered',
          progress: skill.progress || 0,
        })),
      }));
      setUnits(mockUnits);
      setDailyProgress(mockDailyProgress);
      setIsLoading(false);
    }
  }, [learnerId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-duo-bg">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-duo-green"></div>
          <p className="text-duo-text-muted">Loading your path...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row-reverse gap-12 px-6 max-w-[1140px] mx-auto">
      {/* Sticky Sidebar */}
      <div className="sticky top-6 hidden lg:block h-fit w-[360px] flex-none">
        <DailyGoalProgress current={dailyProgress.current} target={dailyProgress.target} />
      </div>

      {/* Main Content */}
      <div className="flex-1 py-8">
        {/* Mobile Daily Goal */}
        <div className="mb-8 lg:hidden">
          <DailyGoalProgress current={dailyProgress.current} target={dailyProgress.target} />
        </div>

        {/* Units */}
        <div className="space-y-8">
          {units.map((unit) => (
            <Unit
              key={unit.id}
              id={unit.id}
              order={unit.order}
              title={unit.title}
              description={unit.description}
              lessons={unit.lessons}
              activeLesson={activeLesson}
              activeLessonPercentage={activeLessonPercentage}
            />
          ))}
        </div>

        {units.length === 0 && !isLoading && (
          <div className="rounded-xl border-2 border-duo-border bg-duo-surface p-12 text-center">
            <p className="text-duo-text-muted">
              No learning paths available. Complete onboarding to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
