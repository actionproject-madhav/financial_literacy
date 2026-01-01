import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CoachButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export function CoachButton({ onClick, isOpen = false }: CoachButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-[9997] w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all overflow-hidden ${isOpen
          ? 'bg-gray-200 hover:bg-gray-300'
          : 'bg-[#FFF9E6] hover:bg-[#FFE082]'
        }`}
      style={{
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}
    >
      <img
        src="/3d-models/monster-1.png"
        alt="FinAI Coach"
        className="w-12 h-12 object-contain"
      />
    </motion.button>
  );
}

