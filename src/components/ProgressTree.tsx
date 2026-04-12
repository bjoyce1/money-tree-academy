import { useState, useEffect } from 'react';
import { TreePine, Coins, Leaf, Sparkles, Crown } from 'lucide-react';
import chapters from '../data/chapters.json';
import { useCharacterCompanion } from './CharacterCompanion';

interface TreeGrowthStage {
  stage: number;
  name: string;
  description: string;
  requiredChapters: number;
  trunkHeight: number;
  branchCount: number;
  leafCount: number;
  fruitCount: number;
  color: string;
  bgGradient: string;
}

export default function ProgressTree() {
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<TreeGrowthStage | null>(null);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const growthStages: TreeGrowthStage[] = [
    {
      stage: 0,
      name: "Seed",
      description: "Your financial journey begins!",
      requiredChapters: 0,
      trunkHeight: 20,
      branchCount: 0,
      leafCount: 0,
      fruitCount: 0,
      color: "text-amber-600",
      bgGradient: "from-amber-900/10 to-yellow-900/10"
    },
    {
      stage: 1,
      name: "Sprout",
      description: "First roots of financial knowledge",
      requiredChapters: 1,
      trunkHeight: 40,
      branchCount: 2,
      leafCount: 3,
      fruitCount: 0,
      color: "text-green-600",
      bgGradient: "from-green-900/10 to-emerald-900/10"
    },
    {
      stage: 2,
      name: "Sapling",
      description: "Growing understanding of money",
      requiredChapters: 3,
      trunkHeight: 60,
      branchCount: 4,
      leafCount: 8,
      fruitCount: 1,
      color: "text-green-500",
      bgGradient: "from-green-900/20 to-emerald-900/20"
    },
    {
      stage: 3,
      name: "Young Tree",
      description: "Branching into financial wisdom",
      requiredChapters: 5,
      trunkHeight: 80,
      branchCount: 6,
      leafCount: 15,
      fruitCount: 3,
      color: "text-emerald-500",
      bgGradient: "from-emerald-900/20 to-green-900/20"
    },
    {
      stage: 4,
      name: "Mature Tree",
      description: "Strong financial foundation",
      requiredChapters: 7,
      trunkHeight: 100,
      branchCount: 8,
      leafCount: 25,
      fruitCount: 6,
      color: "text-emerald-400",
      bgGradient: "from-emerald-900/30 to-green-900/30"
    },
    {
      stage: 5,
      name: "Money Tree",
      description: "Master of financial literacy!",
      requiredChapters: 10,
      trunkHeight: 120,
      branchCount: 12,
      leafCount: 40,
      fruitCount: 10,
      color: "text-yellow-400",
      bgGradient: "from-yellow-900/30 to-amber-900/30"
    }
  ];

  useEffect(() => {
    // Load completed chapters
    const completed = JSON.parse(localStorage.getItem('completed_chapters') || '[]');
    setCompletedChapters(completed);
    
    // Get total achievement count
    const achievements = JSON.parse(localStorage.getItem('unlocked_streak_badges') || '[]');
    const achievementStats = JSON.parse(localStorage.getItem('achievement_stats') || '{}');
    setTotalAchievements(achievements.length + Object.keys(achievementStats).length);

    // Determine current tree stage
    const stage = growthStages.reverse().find(stage => completed.length >= stage.requiredChapters) || growthStages[0];
    setCurrentStage(stage);
  }, []);

  if (!currentStage) return null;

  const progressToNext = (() => {
    const nextStage = growthStages.find(stage => stage.requiredChapters > completedChapters.length);
    if (!nextStage) return 100; // Fully grown
    return (completedChapters.length / nextStage.requiredChapters) * 100;
  })();

  const nextStage = growthStages.find(stage => stage.requiredChapters > completedChapters.length);

  return (
    <div className={`bg-gradient-to-br ${currentStage.bgGradient} border border-green-500/30 rounded-xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TreePine className={currentStage.color} size={24} />
          <div>
            <h3 className="text-xl font-bold text-slate-100">Your Money Tree</h3>
            <p className="text-slate-400 text-sm">{currentStage.name} • {currentStage.description}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          data-testid="button-tree-details"
        >
          <Sparkles size={20} />
        </button>
      </div>

      {/* Tree Visualization */}
      <div className="relative flex flex-col items-center mb-6">
        {/* Tree Crown/Canopy */}
        <div className="relative mb-2">
          {/* Fruits/Coins */}
          {Array.from({ length: currentStage.fruitCount }).map((_, index) => (
            <div
              key={`fruit-${index}`}
              className="absolute animate-pulse"
              style={{
                left: `${20 + (index % 5) * 15}%`,
                top: `${10 + Math.floor(index / 5) * 20}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Coins className="text-yellow-400" size={12} />
            </div>
          ))}

          {/* Leaves */}
          <div className="relative w-32 h-20 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full opacity-80">
            {Array.from({ length: Math.min(currentStage.leafCount, 20) }).map((_, index) => (
              <Leaf
                key={`leaf-${index}`}
                className="absolute text-green-400 animate-pulse"
                size={8}
                style={{
                  left: `${10 + (index % 8) * 10}%`,
                  top: `${15 + Math.floor(index / 8) * 20}%`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${index * 0.2}s`
                }}
              />
            ))}
          </div>

          {/* Branches */}
          {Array.from({ length: currentStage.branchCount }).map((_, index) => (
            <div
              key={`branch-${index}`}
              className="absolute w-1 bg-amber-800 rounded"
              style={{
                height: `${15 + index * 2}px`,
                left: `${40 + (index % 4) * 20}%`,
                top: '80%',
                transform: `translate(-50%, -50%) rotate(${(index % 2 === 0 ? 1 : -1) * (20 + index * 10)}deg)`,
                transformOrigin: 'bottom center'
              }}
            />
          ))}
        </div>

        {/* Tree Trunk */}
        <div className="relative">
          <div 
            className="w-6 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-lg shadow-lg"
            style={{ height: `${currentStage.trunkHeight}px` }}
          />
          
          {/* Chapter markers on trunk */}
          {completedChapters.slice(0, 10).map((chapterId, index) => {
            const chapter = chapters.find(c => c.id === chapterId);
            return (
              <div
                key={chapterId}
                className="absolute w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg"
                style={{
                  left: index % 2 === 0 ? '-8px' : '26px',
                  bottom: `${10 + index * (currentStage.trunkHeight / 12)}px`
                }}
                title={`Chapter ${chapter?.order}: ${chapter?.title}`}
              />
            );
          })}
        </div>

        {/* Tree Roots */}
        <div className="flex justify-center mt-1">
          <div className="w-16 h-1 bg-amber-900 rounded-full opacity-60" />
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
          <div className="text-lg font-bold text-green-400">{completedChapters.length}</div>
          <div className="text-xs text-slate-400">Chapters</div>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
          <div className="text-lg font-bold text-yellow-400">{currentStage.fruitCount}</div>
          <div className="text-xs text-slate-400">Golden Coins</div>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
          <div className="text-lg font-bold text-emerald-400">{currentStage.leafCount}</div>
          <div className="text-xs text-slate-400">Knowledge Leaves</div>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
          <div className="text-lg font-bold text-purple-400">{totalAchievements}</div>
          <div className="text-xs text-slate-400">Achievements</div>
        </div>
      </div>

      {/* Progress to Next Stage */}
      {nextStage && (
        <div>
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Next: {nextStage.name}</span>
            <span>{completedChapters.length}/{nextStage.requiredChapters} chapters</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1 text-center">
            Complete {nextStage.requiredChapters - completedChapters.length} more chapters to grow your tree!
          </p>
        </div>
      )}

      {/* Fully Grown Message */}
      {!nextStage && currentStage.stage === 5 && (
        <div className="text-center p-4 bg-gradient-to-r from-yellow-950/30 to-amber-950/30 border border-yellow-500/30 rounded-lg">
          <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <h4 className="text-lg font-bold text-yellow-300 mb-1">Congratulations! 🎉</h4>
          <p className="text-yellow-200 text-sm">
            Your Money Tree is fully grown! You've mastered financial literacy and built a strong foundation for your future.
          </p>
        </div>
      )}

      {/* Detailed Tree Info */}
      {showDetails && (
        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
          <h4 className="font-semibold text-slate-100 mb-3">Growth Stages</h4>
          <div className="space-y-2">
            {growthStages.map((stage) => (
              <div
                key={stage.stage}
                className={`flex items-center justify-between p-2 rounded ${
                  currentStage.stage === stage.stage 
                    ? 'bg-green-950/30 border border-green-500/30' 
                    : completedChapters.length >= stage.requiredChapters
                    ? 'bg-slate-800/50'
                    : 'bg-slate-900/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TreePine className={stage.color} size={16} />
                  <span className={`font-medium ${
                    completedChapters.length >= stage.requiredChapters ? 'text-slate-200' : 'text-slate-500'
                  }`}>
                    {stage.name}
                  </span>
                </div>
                <div className="text-sm text-slate-400">
                  {stage.requiredChapters} chapters
                  {currentStage.stage === stage.stage && ' (Current)'}
                  {completedChapters.length >= stage.requiredChapters && stage.stage < currentStage.stage && ' ✓'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}