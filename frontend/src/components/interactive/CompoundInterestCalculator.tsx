import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CompoundInterestCalculatorProps {
  initial_amount?: number;
  interest_rate?: number;
  years?: number;
  show_chart?: boolean;
}

export const CompoundInterestCalculator: React.FC<CompoundInterestCalculatorProps> = ({
  initial_amount = 1000,
  interest_rate = 2.0,
  years = 10,
  show_chart = true
}) => {
  const [principal, setPrincipal] = useState(initial_amount);
  const [rate, setRate] = useState(interest_rate);
  const [timeYears, setTimeYears] = useState(years);

  const calculateCompoundInterest = () => {
    const amount = principal * Math.pow(1 + (rate / 100) / 12, timeYears * 12);
    const interestEarned = amount - principal;
    return { finalAmount: amount, interestEarned, principal };
  };

  const generateYearlyData = () => {
    const data: { year: number; balance: number; interest: number }[] = [];
    let balance = principal;
    
    for (let year = 1; year <= timeYears; year++) {
      const yearlyInterest = balance * (Math.pow(1 + (rate / 100) / 12, 12) - 1);
      balance = balance + yearlyInterest;
      data.push({
        year,
        balance: Math.round(balance),
        interest: Math.round(yearlyInterest)
      });
    }
    
    return data;
  };

  const { finalAmount, interestEarned } = calculateCompoundInterest();
  const yearlyData = generateYearlyData();
  const maxBalance = Math.max(...yearlyData.map(d => d.balance));

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wide">
            Initial Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] font-bold">
              $
            </span>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full pl-7 pr-3 py-2 text-sm font-bold text-[#4B4B4B] bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
              min="0"
              step="100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wide">
            Annual Interest Rate
          </label>
          <div className="relative">
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(Math.max(0, Math.min(20, parseFloat(e.target.value) || 0)))}
              className="w-full pr-8 pl-3 py-2 text-sm font-bold text-[#4B4B4B] bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
              min="0"
              max="20"
              step="0.1"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] font-bold">
              %
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wide">
            Years
          </label>
          <input
            type="number"
            value={timeYears}
            onChange={(e) => setTimeYears(Math.max(1, Math.min(40, parseInt(e.target.value) || 0)))}
            className="w-full px-3 py-2 text-sm font-bold text-[#4B4B4B] bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
            min="1"
            max="40"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] p-3">
          <div className="text-xs font-bold text-[#4B4B4B] uppercase tracking-wide mb-1">
            Principal
          </div>
          <div className="text-lg font-bold text-[#4B4B4B]">
            {formatCurrency(principal)}
          </div>
        </div>

        <div className="bg-[#DDF4FF] border-2 border-[#1CB0F6] rounded-[12px] p-3">
          <div className="text-xs font-bold text-[#1CB0F6] uppercase tracking-wide mb-1">
            Interest Earned
          </div>
          <div className="text-lg font-bold text-[#1CB0F6]">
            {formatCurrency(interestEarned)}
          </div>
        </div>

        <div className="bg-[#D7FFB8] border-2 border-[#58CC02] rounded-[12px] p-3">
          <div className="text-xs font-bold text-[#58CC02] uppercase tracking-wide mb-1">
            Final Amount
          </div>
          <div className="text-lg font-bold text-[#58CC02]">
            {formatCurrency(finalAmount)}
          </div>
        </div>
      </div>

      {show_chart && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#4B4B4B] uppercase tracking-wide">
            Growth Over Time
          </h4>
          <div className="relative h-48 bg-[#F7F7F7] rounded-[12px] p-4">
            <div className="h-full flex items-end justify-between gap-1">
              {yearlyData.filter((_, i) => i % Math.max(1, Math.floor(yearlyData.length / 10)) === 0 || i === yearlyData.length - 1).map((point, index) => {
                const heightPercentage = (point.balance / maxBalance) * 100;
                const principalHeight = (principal / maxBalance) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <motion.div
                      className="w-full rounded-t-[4px] relative"
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05, ease: 'easeOut' }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-[#E5E5E5] rounded-t-[4px]"
                        style={{ height: `${Math.min((principalHeight / heightPercentage) * 100, 100)}%` }}
                      />
                      <div
                        className="absolute top-0 left-0 right-0 bg-[#1CB0F6] rounded-t-[4px]"
                        style={{ height: `${Math.max(((heightPercentage - principalHeight) / heightPercentage) * 100, 0)}%` }}
                      />
                    </motion.div>

                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-[#4B4B4B] text-white text-xs font-bold px-2 py-1 rounded-[6px] whitespace-nowrap transition-opacity">
                      Year {point.year}: {formatCurrency(point.balance)}
                    </div>

                    <span className="text-xs font-bold text-[#737373] mt-1">
                      {point.year}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#E5E5E5] rounded-[4px]"></div>
              <span className="text-xs font-bold text-[#737373]">Principal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#1CB0F6] rounded-[4px]"></div>
              <span className="text-xs font-bold text-[#737373]">Interest</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#DDF4FF] border-l-4 border-[#1CB0F6] rounded-[8px] p-3">
        <p className="text-xs text-[#4B4B4B] font-medium">
          Compound interest means your interest earns interest. The longer you save, the faster your money grows.
        </p>
      </div>
    </div>
  );
};

