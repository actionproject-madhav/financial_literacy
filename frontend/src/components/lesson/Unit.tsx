import React from 'react';
import { LessonButton } from './LessonButton';
import { UnitBanner } from './UnitBanner';

type Lesson = {
  id: string;
  completed: boolean;
};

type ActiveLesson = {
  id: string;
  unit?: {
    id: string;
  };
};

type UnitProps = {
  id: string;
  order: number;
  title: string;
  description: string;
  lessons: Lesson[];
  activeLesson?: ActiveLesson;
  activeLessonPercentage: number;
};

// Helper function to calculate horizontal position based on index
const calculatePosition = (index: number): number => {
  const cycleIndex = index % 8;
  const indentationLevels = [0, 1, 2, 2, 1, 0, 0, 1];
  return indentationLevels[cycleIndex] * 40;
};

// Connection line component
const ConnectionLine: React.FC<{
  fromX: number;
  toX: number;
  isCompleted: boolean;
}> = ({ fromX, toX, isCompleted }) => {
  const color = isCompleted ? '#58CC02' : '#E5E5E5';
  const strokeWidth = 6;
  const height = 24; // Spacing between buttons

  // Create curved path
  const midY = height / 2;
  const path = `M ${fromX + 35} 0 Q ${(fromX + toX) / 2 + 35} ${midY}, ${toX + 35} ${height}`;

  return (
    <svg
      className="absolute top-0 left-0 w-full pointer-events-none"
      style={{ height: `${height}px` }}
    >
      <path
        d={path}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const Unit: React.FC<UnitProps> = ({
  title,
  description,
  lessons,
  activeLesson,
  activeLessonPercentage,
}) => {
  return (
    <>
      <UnitBanner title={title} description={description} />

      <div className="relative flex flex-col items-center">
        {lessons.map((lesson, i) => {
          const isCurrent = lesson.id === activeLesson?.id;
          const isLocked = !lesson.completed && !isCurrent;
          const prevLesson = i > 0 ? lessons[i - 1] : null;

          return (
            <React.Fragment key={lesson.id}>
              {/* Add connection line before each button (except first) */}
              {prevLesson && (
                <div className="relative w-full h-6">
                  <ConnectionLine
                    fromX={calculatePosition(i - 1)}
                    toX={calculatePosition(i)}
                    isCompleted={prevLesson.completed}
                  />
                </div>
              )}

              <LessonButton
                id={lesson.id}
                index={i}
                totalCount={lessons.length - 1}
                current={isCurrent}
                locked={isLocked}
                percentage={isCurrent ? activeLessonPercentage : 0}
              />
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
};
