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

          return (
            <LessonButton
              key={lesson.id}
              id={lesson.id}
              index={i}
              totalCount={lessons.length - 1}
              current={isCurrent}
              locked={isLocked}
              percentage={activeLessonPercentage}
            />
          );
        })}
      </div>
    </>
  );
};
