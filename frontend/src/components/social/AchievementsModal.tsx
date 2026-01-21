import React from 'react';
import { X } from 'lucide-react';
import { Modal } from './Modal';

interface Achievement {
  achievement_id: string;
  name: string;
  description: string;
  icon_url?: string;
  earned?: boolean;
  earned_at?: string;
  progress?: number;
  threshold?: number;
}

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  earnedAchievements: Achievement[];
  availableAchievements: Achievement[];
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  earnedAchievements,
  availableAchievements,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="All Achievements" maxWidth="2xl">
      <div className="p-6">
        {/* Earned Achievements Section */}
        {earnedAchievements.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#3c3c3c] mb-4 flex items-center gap-2">
              <span className="text-[#58cc02]">✓</span> Earned Achievements ({earnedAchievements.length})
            </h3>
            <div className="space-y-3">
              {earnedAchievements.map((achievement) => (
                <div
                  key={achievement.achievement_id}
                  className="border-2 border-[#e5e5e5] rounded-2xl p-4 flex gap-4 items-center hover:border-[#58cc02] transition-colors"
                >
                  {/* Achievement Badge */}
                  <div className="w-16 h-20 bg-[#58cc02] rounded-xl flex flex-col items-center justify-center relative shrink-0 transform rotate-[2deg] shadow-sm border-b-4 border-[#46a302]">
                    {achievement.icon_url ? (
                      <img
                        src={achievement.icon_url}
                        alt={achievement.name}
                        className="w-10 h-10 mb-1 object-contain"
                      />
                    ) : (
                      <img
                        src="/trophy.svg"
                        alt={achievement.name}
                        className="w-8 h-8 mb-1 filter brightness-0 invert"
                      />
                    )}
                    <div className="absolute bottom-1 text-[8px] font-black text-white uppercase tracking-wide">
                      Earned
                    </div>
                  </div>

                  {/* Achievement Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#3c3c3c] text-base mb-1">
                      {achievement.name}
                    </h4>
                    <p className="text-[#777] text-sm font-medium mb-1">
                      {achievement.description}
                    </p>
                    {achievement.earned_at && (
                      <p className="text-[#58cc02] text-xs font-bold">
                        Earned on {new Date(achievement.earned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Achievements Section */}
        {availableAchievements.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-[#3c3c3c] mb-4 flex items-center gap-2">
              <span className="text-[#ff4b4b]">◯</span> In Progress ({availableAchievements.length})
            </h3>
            <div className="space-y-3">
              {availableAchievements.map((achievement) => {
                const progress = achievement.progress || 0;
                const threshold = achievement.threshold || 1;
                const progressPercent = Math.min((progress / threshold) * 100, 100);

                return (
                  <div
                    key={achievement.achievement_id}
                    className="border-2 border-[#e5e5e5] rounded-2xl p-4 flex gap-4 items-center hover:border-[#ff4b4b] transition-colors"
                  >
                    {/* Achievement Badge */}
                    <div className="w-16 h-20 bg-[#ff4b4b] rounded-xl flex flex-col items-center justify-center relative shrink-0 transform rotate-[-3deg] shadow-sm border-b-4 border-[#ce3a3a]">
                      {achievement.icon_url ? (
                        <img
                          src={achievement.icon_url}
                          alt={achievement.name}
                          className="w-8 h-8 mb-1 filter brightness-0 invert"
                        />
                      ) : (
                        <img
                          src="/fire.svg"
                          alt={achievement.name}
                          className="w-8 h-8 mb-1 filter brightness-0 invert"
                        />
                      )}
                      <div className="absolute bottom-1 text-[8px] font-black text-white uppercase tracking-wide">
                        Locked
                      </div>
                    </div>

                    {/* Achievement Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#3c3c3c] text-base mb-1">
                        {achievement.name}
                      </h4>
                      <p className="text-[#777] text-sm font-medium mb-2">
                        {achievement.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-[#777]">Progress</span>
                          <span className="text-[#ff4b4b]">
                            {progress} / {threshold}
                          </span>
                        </div>
                        <div className="w-full bg-[#e5e5e5] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#ff4b4b] h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Achievements State */}
        {earnedAchievements.length === 0 && availableAchievements.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-[#e5e5e5] rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/trophy.svg" alt="No achievements" className="w-12 h-12 opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-[#3c3c3c] mb-2">No Achievements Yet</h3>
            <p className="text-[#777] font-medium">
              Keep learning to unlock achievements!
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
