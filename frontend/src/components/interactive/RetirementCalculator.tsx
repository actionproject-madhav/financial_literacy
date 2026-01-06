import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface RetirementCalculatorProps {
  default_contribution?: number;
  default_match?: number;
  default_years?: number;
}

export const RetirementCalculator: React.FC<RetirementCalculatorProps> = ({
  default_contribution = 500,
  default_match = 50,
  default_years = 30
}) => {
  const [monthlyContribution, setMonthlyContribution] = useState(default_contribution);
  const [employerMatch, setEmployerMatch] = useState(default_match);
  const [years, setYears] = useState(default_years);
  const [annualReturn, setAnnualReturn] = useState(7);

  const calculateRetirement = () => {
    const monthlyRate = annualReturn / 100 / 12;
    const months = years * 12;
    const matchMultiplier = employerMatch / 100;
    const totalMonthlyContribution = monthlyContribution * (1 + matchMultiplier);
    
    let balance = 0;
    const data: { year: number; balance: number; contributed: number; match: number }[] = [];

    for (let month = 1; month <= months; month++) {
      balance = (balance + totalMonthlyContribution) * (1 + monthlyRate);

      if (month % 12 === 0) {
        const year = month / 12;
        const contributed = monthlyContribution * month;
        const matchReceived = contributed * matchMultiplier;
        data.push({
          year,
          balance: Math.round(balance),
          contributed: Math.round(contributed),
          match: Math.round(matchReceived)
        });
      }
    }

    const finalYear = data[data.length - 1] || { balance: 0, contributed: 0, match: 0 };
    const totalGrowth = finalYear.balance - finalYear.contributed - finalYear.match;

    return { data, totalGrowth, finalYear };
  };

  const { data, totalGrowth, finalYear } = calculateRetirement();
  const maxBalance = Math.max(...data.map(d => d.balance));

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wide">
            Monthly Contribution
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] font-bold">
              $
            </span>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full pl-7 pr-3 py-2 text-sm font-bold text-[#4B4B4B] bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
              min="0"
              step="50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wide">
            Employer Match
          </label>
          <div className="relative">
            <input
              type="number"
              value={employerMatch}
              onChange={(e) => setEmployerMatch(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
              className="w-full pr-8 pl-3 py-2 text-sm font-bold text-[#4B4B4B] bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
              min="0"
              max="100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] font-bold">
              %
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wide">
            Years Until Retirement
          </label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Math.max(1, Math.min(50, parseInt(e.target.value) || 0)))}
            className="w-full px-3 py-2 text-sm font-bold text-[#4B4B4B] bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
            min="1"
            max="50"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wide">
            Expected Return
          </label>
          <div className="relative">
            <input
              type="number"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Math.max(0, Math.min(15, parseFloat(e.target.value) || 0)))}
              className="w-full pr-8 pl-3 py-2 text-sm font-bold text-[#4B4B4B] bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
              min="0"
              max="15"
              step="0.5"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] font-bold">
              %
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] p-3">
          <div className="text-xs font-bold text-[#4B4B4B] uppercase tracking-wide mb-1">
            Your Contributions
          </div>
          <div className="text-lg font-bold text-[#4B4B4B]">
            {formatCurrency(finalYear.contributed)}
          </div>
        </div>

        <div className="bg-[#FFF4E6] border-2 border-[#FF9600] rounded-[12px] p-3">
          <div className="text-xs font-bold text-[#FF9600] uppercase tracking-wide mb-1">
            Employer Match
          </div>
          <div className="text-lg font-bold text-[#FF9600]">
            {formatCurrency(finalYear.match)}
          </div>
        </div>

        <div className="bg-[#DDF4FF] border-2 border-[#1CB0F6] rounded-[12px] p-3">
          <div className="text-xs font-bold text-[#1CB0F6] uppercase tracking-wide mb-1">
            Investment Growth
          </div>
          <div className="text-lg font-bold text-[#1CB0F6]">
            {formatCurrency(totalGrowth)}
          </div>
        </div>

        <div className="bg-[#D7FFB8] border-2 border-[#58CC02] rounded-[12px] p-3">
          <div className="text-xs font-bold text-[#58CC02] uppercase tracking-wide mb-1">
            Total Value
          </div>
          <div className="text-lg font-bold text-[#58CC02]">
            {formatCurrency(finalYear.balance)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-[#4B4B4B] uppercase tracking-wide">
          Retirement Savings Growth
        </h4>
        <div className="relative h-64 bg-[#F7F7F7] rounded-[12px] p-4">
          <div className="h-full flex items-end justify-between gap-1">
            {data.filter((_, i) => i % Math.ceil(data.length / 12) === 0 || i === data.length - 1).map((point, index) => {
              const heightPercentage = (point.balance / maxBalance) * 100;
              const contributedHeight = ((point.contributed + point.match) / maxBalance) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <motion.div
                    className="w-full rounded-t-[4px] relative"
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05, ease: 'easeOut' }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-[#4B4B4B] rounded-t-[4px]"
                      style={{ height: `${(point.contributed / (point.contributed + point.match)) * (contributedHeight / heightPercentage) * 100}%` }}
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-[#FF9600] rounded-t-[4px]"
                      style={{ 
                        height: `${(point.match / (point.contributed + point.match)) * (contributedHeight / heightPercentage) * 100}%`,
                        bottom: `${(point.contributed / (point.contributed + point.match)) * (contributedHeight / heightPercentage) * 100}%`
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 right-0 bg-[#1CB0F6] rounded-t-[4px]"
                      style={{ height: `${((heightPercentage - contributedHeight) / heightPercentage) * 100}%` }}
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
        <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#4B4B4B] rounded-[4px]"></div>
            <span className="text-xs font-bold text-[#737373]">Your Contributions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FF9600] rounded-[4px]"></div>
            <span className="text-xs font-bold text-[#737373]">Employer Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#1CB0F6] rounded-[4px]"></div>
            <span className="text-xs font-bold text-[#737373]">Investment Growth</span>
          </div>
        </div>
      </div>

      <div className="bg-[#DDF4FF] border-l-4 border-[#1CB0F6] rounded-[8px] p-3">
        <p className="text-xs text-[#4B4B4B] font-medium">
          Employer matches are free money. Always contribute at least enough to get the full employer match.
        </p>
      </div>
    </div>
  );
};

