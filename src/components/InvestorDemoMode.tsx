import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle, ArrowRight, BookOpen, Users, Award, Coins, Volume2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  estimatedTime: string;
  features: string[];
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 'landing',
    title: 'Welcome & Overview',
    description: 'Introduction to the Money Tree of Life educational platform',
    path: '/',
    icon: <BookOpen className="w-5 h-5" />,
    estimatedTime: '2 min',
    features: ['Interactive landing page', 'Character voice introductions', 'Educational positioning']
  },
  {
    id: 'characters',
    title: 'AI Learning Companions',
    description: 'Meet the personalized AI tutors with unique specialties',
    path: '/characters',
    icon: <Users className="w-5 h-5" />,
    estimatedTime: '3 min',
    features: ['4 unique AI characters', 'Voice-powered interactions', 'Personalized learning paths']
  },
  {
    id: 'reading',
    title: 'Interactive Reading Experience',
    description: 'Immersive chapter reading with AI narration and features',
    path: '/read/the-seed',
    icon: <Volume2 className="w-5 h-5" />,
    estimatedTime: '5 min',
    features: ['AI voice narration', 'Interactive glossary', 'Real-time companion guidance']
  },
  {
    id: 'gamification',
    title: 'Engagement & Progress',
    description: 'Coins, achievements, and progress tracking system',
    path: '/dashboard',
    icon: <Award className="w-5 h-5" />,
    estimatedTime: '2 min',
    features: ['Achievement system', 'Coin rewards', 'Progress analytics']
  }
];

interface InvestorDemoModeProps {
  isActive: boolean;
  onToggle: () => void;
}

export default function InvestorDemoMode({ isActive, onToggle }: InvestorDemoModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const goToNextStep = () => {
    if (currentStep < DEMO_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  if (!isActive) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={onToggle}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          data-testid="button-enable-demo-mode"
        >
          <Play className="mr-2 w-4 h-4" />
          Demo Mode
        </Button>
      </div>
    );
  }

  const currentDemoStep = DEMO_STEPS[currentStep];

  return (
    <>
      {/* Demo Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onToggle} />
      
      {/* Demo Guide Panel */}
      <div className="fixed right-4 top-4 bottom-4 w-80 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 border border-purple-500/30 rounded-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-300 w-5 h-5" />
              <h2 className="font-bold text-white text-lg">Investor Demo</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="text-purple-300 hover:text-white"
              data-testid="button-close-demo-mode"
            >
              ×
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="text-purple-200 text-sm">
              Step {currentStep + 1} of {DEMO_STEPS.length}
            </div>
            <div className="w-full bg-purple-800 rounded-full h-2">
              <div 
                className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / DEMO_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Step */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Card className="bg-purple-800/50 border-purple-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentDemoStep.icon}
                  <CardTitle className="text-white text-lg">
                    {currentDemoStep.title}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="bg-purple-700 text-purple-200">
                  {currentDemoStep.estimatedTime}
                </Badge>
              </div>
              <CardDescription className="text-purple-200">
                {currentDemoStep.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Key Features:</h4>
                <ul className="space-y-1">
                  {currentDemoStep.features.map((feature, index) => (
                    <li key={index} className="text-purple-200 text-sm flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex flex-col gap-2">
                <Link to={currentDemoStep.path}>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => markStepCompleted(currentDemoStep.id)}
                    data-testid={`button-goto-${currentDemoStep.id}`}
                  >
                    <Play className="mr-2 w-4 h-4" />
                    Experience This Step
                  </Button>
                </Link>
                
                {currentStep < DEMO_STEPS.length - 1 && (
                  <Button 
                    variant="outline" 
                    onClick={goToNextStep}
                    className="w-full border-purple-500 text-purple-200 hover:bg-purple-800"
                    data-testid="button-next-demo-step"
                  >
                    Next Step
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Steps Overview */}
          <div className="mt-4 space-y-2">
            <h4 className="text-white font-medium text-sm">Demo Progress:</h4>
            {DEMO_STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  index === currentStep 
                    ? 'bg-purple-700/50 border border-purple-500/50' 
                    : completedSteps.has(step.id)
                    ? 'bg-green-800/30'
                    : 'bg-purple-800/30'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  completedSteps.has(step.id)
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-700 text-purple-300'
                }`}>
                  {completedSteps.has(step.id) ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    index === currentStep ? 'text-white' : 'text-purple-200'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-purple-400">
                    {step.estimatedTime}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-purple-500/30">
          <div className="text-xs text-purple-300 text-center">
            Total Demo Time: ~12 minutes
          </div>
        </div>
      </div>
    </>
  );
}