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
      className={`fixed bottom-6 right-6 z-[9997] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
        isOpen 
          ? 'bg-gray-400 hover:bg-gray-500' 
          : 'bg-[#58cc02] hover:bg-[#46a302]'
      }`}
      style={{
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
    >
      {isOpen ? (
        <MessageCircle className="w-6 h-6 text-white" />
      ) : (
        <img src="/profile.svg" alt="Coach" className="w-7 h-7 filter brightness-0 invert" />
      )}
    </motion.button>
  );
}

