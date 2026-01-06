import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  color: string;
  bgColor: string;
}

const TAX_BRACKETS_2024: TaxBracket[] = [
  { min: 0, max: 11600, rate: 10, color: '#1CB0F6', bgColor: '#DDF4FF' },
  { min: 11600, max: 47150, rate: 12, color: '#00CD9C', bgColor: '#D1FAE5' },
  { min: 47150, max: 100525, rate: 22, color: '#FF9600', bgColor: '#FFF4E6' },
  { min: 100525, max: 191950, rate: 24, color: '#CE82FF', bgColor: '#F3E8FF' },
  { min: 191950, max: 243725, rate: 32, color: '#FF4B4B', bgColor: '#FFDFE0' },
  { min: 243725, max: 609350, rate: 35, color: '#8549BA', bgColor: '#E9D5FF' },
  { min: 609350, max: null, rate: 37, color: '#4B4B4B', bgColor: '#F7F7F7' },
];

export const TaxBracketVisualizer: React.FC = () => {
  const [income, setIncome] = useState(60000);

  const calculateTax = (income: number) => {
    let totalTax = 0;
    const breakdown: { bracket: string; taxed: number; tax: number; rate: number }[] = [];

    for (let i = 0; i < TAX_BRACKETS_2024.length; i++) {
      const bracket = TAX_BRACKETS_2024[i];
      const bracketMin = bracket.min;
      const bracketMax = bracket.max || Infinity;

      if (income <= bracketMin) break;

      const taxableInBracket = Math.min(income, bracketMax) - bracketMin;
      const taxForBracket = taxableInBracket * (bracket.rate / 100);

      if (taxableInBracket > 0) {
        totalTax += taxForBracket;
        breakdown.push({
          bracket: bracket.max
            ? `$${bracketMin.toLocaleString()} - $${bracketMax.toLocaleString()}`
            : `Over $${bracketMin.toLocaleString()}`,
          taxed: taxableInBracket,
          tax: taxForBracket,
          rate: bracket.rate,
        });
      }
    }

    return { totalTax, breakdown, effectiveRate: (totalTax / income) * 100 };
  };

  const { totalTax, breakdown, effectiveRate } = calculateTax(income);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActiveBrackets = () => {
    return TAX_BRACKETS_2024.filter((bracket) => {
      return income > bracket.min;
    });
  };

  return (
    <div className="bg-white border-2 border-[#E5E5E5] rounded-[16px] p-6 space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#4B4B4B] uppercase tracking-wide">
          Your Taxable Income
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
            step="1000"
          />
        </div>
        <input
          type="range"
          min="0"
          max="250000"
          step="1000"
          value={Math.min(income, 250000)}
          onChange={(e) => setIncome(parseInt(e.target.value))}
          className="w-full h-2 bg-[#E5E5E5] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1CB0F6] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#1CB0F6] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
        />
      </div>

      <div className="bg-[#F7F7F7] rounded-[12px] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#737373] uppercase tracking-wide">
            Total Tax
          </span>
          <span className="text-2xl font-bold text-[#4B4B4B]">
            {formatCurrency(totalTax)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#737373] uppercase tracking-wide">
            Effective Rate
          </span>
          <span className="text-xl font-bold text-[#1CB0F6]">
            {effectiveRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#737373] uppercase tracking-wide">
            After-Tax Income
          </span>
          <span className="text-xl font-bold text-[#58CC02]">
            {formatCurrency(income - totalTax)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-[#4B4B4B] uppercase tracking-wide">
          Tax Breakdown by Bracket
        </h4>
        <div className="space-y-2">
          {breakdown.map((item, index) => {
            const activeBrackets = getActiveBrackets();
            const bracket = activeBrackets[index];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="rounded-[12px] border-2 p-3"
                style={{
                  backgroundColor: bracket.bgColor,
                  borderColor: bracket.color,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: bracket.color }}>
                    {item.rate}% Bracket
                  </span>
                  <span className="text-sm font-bold" style={{ color: bracket.color }}>
                    {formatCurrency(item.tax)}
                  </span>
                </div>
                <p className="text-xs text-[#737373]">
                  {formatCurrency(item.taxed)} taxed at {item.rate}%
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#DDF4FF] border-l-4 border-[#1CB0F6] rounded-[8px] p-3">
        <p className="text-xs text-[#4B4B4B] font-medium">
          Your income is not all taxed at your highest bracket rate. Different portions are taxed at different rates.
        </p>
      </div>
    </div>
  );
};
