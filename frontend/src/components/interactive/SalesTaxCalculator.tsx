import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SalesTaxCalculatorProps {
  default_rate?: number;
  min_rate?: number;
  max_rate?: number;
  show_breakdown?: boolean;
}

export const SalesTaxCalculator: React.FC<SalesTaxCalculatorProps> = ({
  default_rate = 8.0,
  min_rate = 0,
  max_rate = 15,
  show_breakdown = true
}) => {
  const [price, setPrice] = useState(100);
  const [taxRate, setTaxRate] = useState(default_rate);

  const taxAmount = Math.round((price * taxRate / 100) * 100) / 100;
  const totalPrice = price + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-white border-2 border-[#E5E5E5] rounded-[16px] p-6 space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#4B4B4B] uppercase tracking-wide">
          Item Price
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373] font-bold text-lg">
            $
          </span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full pl-8 pr-4 py-3 text-lg font-bold text-[#4B4B4B] bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-[#4B4B4B] uppercase tracking-wide">
            Sales Tax Rate
          </label>
          <span className="text-lg font-bold text-[#1CB0F6]">
            {taxRate.toFixed(2)}%
          </span>
        </div>
        <input
          type="range"
          min={min_rate}
          max={max_rate}
          step="0.1"
          value={taxRate}
          onChange={(e) => setTaxRate(parseFloat(e.target.value))}
          className="w-full h-2 bg-[#E5E5E5] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1CB0F6] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#1CB0F6] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
        />
        <div className="flex justify-between text-xs text-[#737373]">
          <span>{min_rate}%</span>
          <span>{max_rate}%</span>
        </div>
      </div>

      {show_breakdown && (
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-[12px] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[#4B4B4B] uppercase tracking-wide">
                Subtotal
              </span>
              <span className="text-xl font-bold text-[#4B4B4B]">
                {formatCurrency(price)}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-[#DDF4FF] border-2 border-[#1CB0F6] rounded-[12px] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[#1CB0F6] uppercase tracking-wide">
                Sales Tax ({taxRate.toFixed(2)}%)
              </span>
              <span className="text-xl font-bold text-[#1CB0F6]">
                {formatCurrency(taxAmount)}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-[#D7FFB8] border-2 border-[#58CC02] rounded-[12px] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[#58CC02] uppercase tracking-wide">
                Total Amount
              </span>
              <span className="text-2xl font-bold text-[#58CC02]">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </motion.div>
        </div>
      )}

      <div className="bg-[#DDF4FF] border-l-4 border-[#1CB0F6] rounded-[8px] p-3">
        <p className="text-xs text-[#4B4B4B] font-medium">
          Sales tax rates vary by state and sometimes by city. Always check the local rate when shopping.
        </p>
      </div>
    </div>
  );
};

