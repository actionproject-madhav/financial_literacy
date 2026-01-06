import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BudgetCalculatorProps {
  defaultIncome?: number;
}

export const BudgetCalculator: React.FC<BudgetCalculatorProps> = ({
  defaultIncome = 4000
}) => {
  const [income, setIncome] = useState(defaultIncome);

  const needs = Math.round(income * 0.5);
  const wants = Math.round(income * 0.3);
  const savings = Math.round(income * 0.2);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white border-2 border-[#E5E5E5] rounded-[16px] p-6 space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#4B4B4B] uppercase tracking-wide">
          Monthly Income
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373] font-bold text-lg">
            $
          </span>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full pl-8 pr-4 py-3 text-lg font-bold text-[#4B4B4B] bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
            min="0"
            step="100"
          />
        </div>
        <input
          type="range"
          min="0"
          max="15000"
          step="100"
          value={income}
          onChange={(e) => setIncome(parseInt(e.target.value))}
          className="w-full h-2 bg-[#E5E5E5] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1CB0F6] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#1CB0F6] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
        />
      </div>

      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#DDF4FF] border-2 border-[#1CB0F6] rounded-[12px] p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#1CB0F6] uppercase tracking-wide">
              Needs (50%)
            </span>
            <span className="text-xl font-bold text-[#1CB0F6]">
              {formatCurrency(needs)}
            </span>
          </div>
          <div className="w-full bg-white rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-[#1CB0F6]"
              initial={{ width: 0 }}
              animate={{ width: '50%' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-[#737373] mt-2">
            Rent, utilities, groceries, insurance, transportation
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#FFF4E6] border-2 border-[#FF9600] rounded-[12px] p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#FF9600] uppercase tracking-wide">
              Wants (30%)
            </span>
            <span className="text-xl font-bold text-[#FF9600]">
              {formatCurrency(wants)}
            </span>
          </div>
          <div className="w-full bg-white rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-[#FF9600]"
              initial={{ width: 0 }}
              animate={{ width: '30%' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
          <p className="text-xs text-[#737373] mt-2">
            Dining out, entertainment, subscriptions, shopping
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-[#D7FFB8] border-2 border-[#58CC02] rounded-[12px] p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#58CC02] uppercase tracking-wide">
              Savings & Debt (20%)
            </span>
            <span className="text-xl font-bold text-[#58CC02]">
              {formatCurrency(savings)}
            </span>
          </div>
          <div className="w-full bg-white rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-[#58CC02]"
              initial={{ width: 0 }}
              animate={{ width: '20%' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
          <p className="text-xs text-[#737373] mt-2">
            Emergency fund, retirement, extra debt payments
          </p>
        </motion.div>
      </div>

      <div className="pt-4 border-t-2 border-[#E5E5E5]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#737373] uppercase tracking-wide">
            Total Allocated
          </span>
          <span className="text-2xl font-bold text-[#4B4B4B]">
            {formatCurrency(income)}
          </span>
        </div>
      </div>
    </div>
  );
};
