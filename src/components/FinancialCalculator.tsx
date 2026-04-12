import { useState, useEffect } from 'react';
import { Calculator, DollarSign, Percent, TrendingUp, PiggyBank, X } from 'lucide-react';

interface FinancialCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CalculationHistory {
  expression: string;
  result: number;
  timestamp: number;
}

export default function FinancialCalculator({ isOpen, onClose }: FinancialCalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [mode, setMode] = useState<'basic' | 'savings' | 'percentage'>('basic');

  // Load calculation history
  useEffect(() => {
    const stored = localStorage.getItem('calculator_history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  // Save to history
  const saveToHistory = (expression: string, result: number) => {
    const entry: CalculationHistory = {
      expression,
      result,
      timestamp: Date.now()
    };
    const newHistory = [entry, ...history.slice(0, 9)]; // Keep last 10
    setHistory(newHistory);
    localStorage.setItem('calculator_history', JSON.stringify(newHistory));
  };

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const result = calculate(currentValue, inputValue, operation);
      
      const expression = `${currentValue} ${operation} ${inputValue}`;
      saveToHistory(expression, result);
      
      setDisplay(`${parseFloat(result.toFixed(7))}`);
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  // Special financial calculations
  const calculateSavings = (principal: number, rate: number, time: number) => {
    // Simple interest calculation for kids
    const interest = principal * (rate / 100) * time;
    return principal + interest;
  };

  const calculatePercentage = (value: number, percentage: number) => {
    return (value * percentage) / 100;
  };

  const presetCalculations = {
    savings: [
      { label: 'Save $5/week for 1 year', calc: () => 5 * 52 },
      { label: 'Save $10/month for 6 months', calc: () => 10 * 6 },
      { label: '10% of $50 allowance', calc: () => calculatePercentage(50, 10) },
      { label: '20% of $25 gift money', calc: () => calculatePercentage(25, 20) }
    ],
    percentage: [
      { label: '50% of $20', calc: () => calculatePercentage(20, 50) },
      { label: '30% of $15', calc: () => calculatePercentage(15, 30) },
      { label: '20% of $30', calc: () => calculatePercentage(30, 20) },
      { label: '15% tip on $12 meal', calc: () => calculatePercentage(12, 15) }
    ]
  };

  const runPresetCalculation = (calc: () => number, label: string) => {
    const result = calc();
    setDisplay(String(result));
    saveToHistory(label, result);
    setWaitingForOperand(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Calculator className="text-brand" size={20} />
            <h3 className="font-semibold text-slate-100">Financial Calculator</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            data-testid="button-close-calculator"
          >
            <X className="text-slate-400" size={16} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex gap-2">
            {(['basic', 'savings', 'percentage'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m 
                    ? 'bg-brand text-slate-900' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                data-testid={`button-mode-${m}`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Display */}
        <div className="p-4 bg-slate-800">
          <div className="text-right text-2xl font-mono text-slate-100 bg-slate-900 p-4 rounded-lg border">
            ${display}
          </div>
        </div>

        {mode === 'basic' && (
          <div className="p-4">
            {/* Calculator Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={clear}
                className="col-span-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
                data-testid="button-clear"
              >
                Clear
              </button>
              <button
                onClick={() => performOperation('÷')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
                data-testid="button-divide"
              >
                ÷
              </button>
              <button
                onClick={() => performOperation('×')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
                data-testid="button-multiply"
              >
                ×
              </button>

              {/* Number buttons */}
              {[7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => inputNumber(String(num))}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  data-testid={`button-${num}`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => performOperation('-')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
                data-testid="button-subtract"
              >
                -
              </button>

              {[4, 5, 6].map(num => (
                <button
                  key={num}
                  onClick={() => inputNumber(String(num))}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  data-testid={`button-${num}`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => performOperation('+')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
                data-testid="button-add"
              >
                +
              </button>

              {[1, 2, 3].map(num => (
                <button
                  key={num}
                  onClick={() => inputNumber(String(num))}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  data-testid={`button-${num}`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => performOperation('=')}
                className="bg-brand hover:bg-brand/90 text-slate-900 font-semibold py-3 rounded-lg transition-colors row-span-2"
                data-testid="button-equals"
              >
                =
              </button>

              <button
                onClick={() => inputNumber('0')}
                className="col-span-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
                data-testid="button-0"
              >
                0
              </button>
              <button
                onClick={inputDecimal}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
                data-testid="button-decimal"
              >
                .
              </button>
            </div>
          </div>
        )}

        {(mode === 'savings' || mode === 'percentage') && (
          <div className="p-4">
            <h4 className="font-semibold text-slate-100 mb-3 flex items-center gap-2">
              {mode === 'savings' ? <PiggyBank size={16} /> : <Percent size={16} />}
              Quick {mode === 'savings' ? 'Savings' : 'Percentage'} Calculations
            </h4>
            <div className="space-y-2">
              {presetCalculations[mode]?.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => runPresetCalculation(preset.calc, preset.label)}
                  className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm text-slate-300"
                  data-testid={`preset-${index}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-700">
            <h4 className="font-semibold text-slate-100 mb-2 text-sm">Recent Calculations</h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {history.slice(0, 3).map((entry, index) => (
                <div
                  key={index}
                  className="text-xs text-slate-400 font-mono flex justify-between"
                >
                  <span className="truncate">{entry.expression}</span>
                  <span className="font-semibold">${entry.result}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
          <div className="flex items-start gap-2">
            <DollarSign className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <h5 className="font-semibold text-slate-100 text-sm mb-1">Calculator Tip</h5>
              <p className="text-xs text-slate-300">
                {mode === 'basic' && "Use this calculator for any math problems in the chapters!"}
                {mode === 'savings' && "Try these savings scenarios to see how money grows over time."}
                {mode === 'percentage' && "Practice percentage calculations for budgeting and saving goals."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick access calculator button component
export function CalculatorButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-brand hover:bg-brand/90 text-slate-900 p-3 rounded-full shadow-lg transition-all hover:scale-110 z-40"
        data-testid="button-open-calculator"
        title="Open Calculator"
      >
        <Calculator size={20} />
      </button>
      
      <FinancialCalculator isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}