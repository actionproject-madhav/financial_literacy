import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface InvestmentType {
  name: string;
  risk: string;
  returnRange: string;
  position: number;
  color: string;
  bgColor: string;
  description: string;
}

const INVESTMENTS: InvestmentType[] = [
  {
    name: 'Savings Account',
    risk: 'Very Low',
    returnRange: '0-5%',
    position: 10,
    color: '#1CB0F6',
    bgColor: '#DDF4FF',
    description: 'FDIC insured, no risk of loss, but lowest returns',
  },
  {
    name: 'Government Bonds',
    risk: 'Low',
    returnRange: '3-6%',
    position: 25,
    color: '#00CD9C',
    bgColor: '#D1FAE5',
    description: 'Backed by government, very stable with modest returns',
  },
  {
    name: 'Index Funds',
    risk: 'Medium',
    returnRange: '7-10%',
    position: 50,
    color: '#58CC02',
    bgColor: '#D7FFB8',
    description: 'Diversified across many stocks, balanced risk/reward',
  },
  {
    name: 'Individual Stocks',
    risk: 'High',
    returnRange: 'Varies Widely',
    position: 75,
    color: '#FF9600',
    bgColor: '#FFF4E6',
    description: 'Can gain or lose significantly, requires research',
  },
  {
    name: 'Cryptocurrency',
    risk: 'Very High',
    returnRange: 'Highly Volatile',
    position: 95,
    color: '#FF4B4B',
    bgColor: '#FFDFE0',
    description: 'Extreme volatility, can gain or lose value rapidly',
  },
];

export const RiskReturnSpectrum: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(2);
  const selected = INVESTMENTS[selectedIndex];

  return (
    <div className="bg-white border-2 border-[#E5E5E5] rounded-[16px] p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wide">
            Low Risk
          </span>
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wide">
            High Risk
          </span>
        </div>

        <div className="relative h-3 bg-gradient-to-r from-[#1CB0F6] via-[#58CC02] to-[#FF4B4B] rounded-full">
          {INVESTMENTS.map((investment, index) => (
            <motion.button
              key={index}
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
              style={{
                left: `${investment.position}%`,
                transform: `translate(-50%, -50%) ${selectedIndex === index ? 'scale(1.2)' : 'scale(1)'}`,
                backgroundColor: investment.color,
              }}
              onClick={() => setSelectedIndex(index)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 1.1 }}
              animate={{
                scale: selectedIndex === index ? 1.2 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              <span className="sr-only">{investment.name}</span>
            </motion.button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wide">
            Low Return
          </span>
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wide">
            High Return Potential
          </span>
        </div>
      </div>

      <motion.div
        key={selectedIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-[12px] border-2 p-6 space-y-4"
        style={{
          backgroundColor: selected.bgColor,
          borderColor: selected.color,
        }}
      >
        <h3 className="text-xl font-bold" style={{ color: selected.color }}>
          {selected.name}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: selected.color }}>
              Risk Level
            </div>
            <div className="text-lg font-bold text-[#4B4B4B]">
              {selected.risk}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: selected.color }}>
              Typical Return
            </div>
            <div className="text-lg font-bold text-[#4B4B4B]">
              {selected.returnRange}
            </div>
          </div>
        </div>

        <p className="text-sm text-[#4B4B4B] leading-relaxed">
          {selected.description}
        </p>
      </motion.div>

      <div className="grid grid-cols-5 gap-2">
        {INVESTMENTS.map((investment, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={`p-2 rounded-[8px] border-2 transition-all ${
              selectedIndex === index
                ? 'border-current shadow-md'
                : 'border-[#E5E5E5] hover:border-current'
            }`}
            style={{
              backgroundColor: selectedIndex === index ? investment.bgColor : '#FFFFFF',
              color: investment.color,
            }}
          >
            <div className="text-xs font-bold text-center">
              {investment.name.split(' ')[0]}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-[#DDF4FF] border-l-4 border-[#1CB0F6] rounded-[8px] p-3">
        <p className="text-xs text-[#4B4B4B] font-medium">
          Higher potential returns generally require accepting higher risk. Choose investments that match your goals and risk tolerance.
        </p>
      </div>
    </div>
  );
};
