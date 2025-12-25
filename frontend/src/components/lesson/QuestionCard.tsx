import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChoiceButton, ChoiceState } from '../ui/ChoiceButton';
import { IconButton } from '../ui/IconButton';
import { cn } from '../../utils/cn';

interface Choice {
  id: string;
  text: string;
}

interface QuestionCardProps {
  question: string;
  choices: Choice[];
  correctAnswerId: string;
  onAnswer: (isCorrect: boolean, selectedId: string) => void;
  onContinue: () => void;
  showTTS?: boolean;
  onPlayAudio?: () => void;
  isAudioLoading?: boolean;
  explanation?: string;
  culturalBridge?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  choices,
  correctAnswerId,
  onAnswer,
  onContinue,
  showTTS = true,
  onPlayAudio,
  isAudioLoading = false,
  explanation,
  culturalBridge,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleCheck = () => {
    if (!selectedId) return;
    
    const correct = selectedId === correctAnswerId;
    setIsCorrect(correct);
    setIsChecked(true);
    onAnswer(correct, selectedId);
  };

  const handleContinue = () => {
    onContinue();
  };

  const getChoiceState = (choiceId: string): ChoiceState => {
    if (!isChecked) {
      return selectedId === choiceId ? 'selected' : 'default';
    }
    
    if (choiceId === correctAnswerId) {
      return 'correct';
    }
    
    if (choiceId === selectedId && !isCorrect) {
      return 'incorrect';
    }
    
    return 'disabled';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Question */}
      <Card variant="elevated" padding="lg" className="mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-[19px] font-bold text-[#4B4B4B] leading-[28px]">
              {question}
            </p>
          </div>
          {showTTS && (
            <IconButton
              aria-label="Listen to question"
              onClick={onPlayAudio}
              size="md"
            >
              {isAudioLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#1CB0F6]" />
              ) : (
                <Volume2 className="w-5 h-5 text-[#1CB0F6]" />
              )}
            </IconButton>
          )}
        </div>
      </Card>

      {/* Choices */}
      <div className="flex-1 space-y-3 mb-6">
        {choices.map((choice, index) => (
          <ChoiceButton
            key={choice.id}
            index={index}
            state={getChoiceState(choice.id)}
            onClick={() => !isChecked && setSelectedId(choice.id)}
            disabled={isChecked}
          >
            {choice.text}
          </ChoiceButton>
        ))}
      </div>

      {/* Result Feedback */}
      <AnimatePresence>
        {isChecked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              'p-4 rounded-[16px] mb-4',
              isCorrect ? 'bg-[#D7FFB8]' : 'bg-[#FFDFE0]'
            )}
          >
            <p
              className={cn(
                'font-bold text-[17px] mb-2',
                isCorrect ? 'text-[#58CC02]' : 'text-[#FF4B4B]'
              )}
              style={{ lineHeight: '24px' }}
            >
              {isCorrect ? 'Correct!' : 'Not quite'}
            </p>
            
            {explanation && !isCorrect && (
              <p className="text-[#4B4B4B] text-[15px] mb-2" style={{ lineHeight: '24px' }}>{explanation}</p>
            )}
            
            {culturalBridge && (
              <p className="text-[#737373] text-[15px] italic" style={{ lineHeight: '24px' }}>
                {culturalBridge}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button */}
      <div className="mt-auto">
        {!isChecked ? (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isDisabled={!selectedId}
            onClick={handleCheck}
          >
            Check
          </Button>
        ) : (
          <Button
            variant={isCorrect ? 'primary' : 'secondary'}
            size="lg"
            fullWidth
            onClick={handleContinue}
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
};

