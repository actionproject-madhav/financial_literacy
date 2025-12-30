import React from 'react';
import { Check, Crown, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { Button } from '../ui';
import { cn } from '../../utils/cn';
import 'react-circular-progressbar/dist/styles.css';

type LessonButtonProps = {
  id: string;
  index: number;
  totalCount: number;
  locked?: boolean;
  current?: boolean;
  percentage: number;
};

export const LessonButton: React.FC<LessonButtonProps> = ({
  id,
  index,
  totalCount,
  locked,
  current,
  percentage,
}) => {
  const cycleLength = 8;
  const cycleIndex = index % cycleLength;

  // Duolingo pattern: 0→1→2→2→1→0→0→1 (creates organic S-curve)
  let indentationLevel;
  switch (cycleIndex) {
    case 0:
      indentationLevel = 0;
      break;
    case 1:
      indentationLevel = 1;
      break;
    case 2:
      indentationLevel = 2;
      break;
    case 3:
      indentationLevel = 2; // Hold right
      break;
    case 4:
      indentationLevel = 1;
      break;
    case 5:
      indentationLevel = 0;
      break;
    case 6:
      indentationLevel = 0; // Hold left
      break;
    case 7:
      indentationLevel = 1;
      break;
    default:
      indentationLevel = 0;
  }

  const rightPosition = indentationLevel * 40; // 40px per level

  const isFirst = index === 0;
  const isLast = index === totalCount;
  const isCompleted = !current && !locked;

  const Icon = isCompleted ? Check : isLast ? Crown : Star;

  const href = isCompleted ? `/lesson/${id}` : '/lesson';

  return (
    <Link
      to={href}
      aria-disabled={locked}
      style={{ pointerEvents: locked ? 'none' : 'auto' }}
    >
      <div
        className="relative"
        style={{
          right: `${rightPosition}px`,
          marginTop: isFirst && !isCompleted ? 60 : 24,
        }}
      >
        {current ? (
          <div className="relative h-[102px] w-[102px]">
            <div className="absolute -top-6 left-2.5 z-10 animate-bounce rounded-xl border-2 border-duo-border bg-duo-surface px-3 py-2.5 font-bold uppercase tracking-wide text-duo-green">
              Start
              <div
                className="absolute -bottom-2 left-1/2 h-0 w-0 -translate-x-1/2 transform border-x-8 border-t-8 border-x-transparent"
                aria-hidden
              />
            </div>
            <CircularProgressbarWithChildren
              value={Number.isNaN(percentage) ? 0 : percentage}
              styles={{
                path: {
                  stroke: '#58CC02',
                },
                trail: {
                  stroke: '#E5E5E5',
                },
              }}
            >
              <Button
                size="lg"
                variant={locked ? 'outline' : 'secondary'}
                className="h-[70px] w-[70px] border-b-8 rounded-full"
              >
                <Icon
                  className={cn(
                    'h-10 w-10',
                    locked
                      ? 'fill-neutral-400 stroke-neutral-400 text-neutral-400'
                      : 'fill-primary-foreground text-primary-foreground',
                    isCompleted && 'fill-none stroke-[4]'
                  )}
                />
              </Button>
            </CircularProgressbarWithChildren>
          </div>
        ) : (
          <Button
            size="lg"
            variant={locked ? 'outline' : 'secondary'}
            className="h-[70px] w-[70px] border-b-8 rounded-full"
          >
            <Icon
              className={cn(
                'h-10 w-10',
                locked
                  ? 'fill-neutral-400 stroke-neutral-400 text-neutral-400'
                  : 'fill-primary-foreground text-primary-foreground',
                isCompleted && 'fill-none stroke-[4]'
              )}
            />
          </Button>
        )}
      </div>
    </Link>
  );
};
