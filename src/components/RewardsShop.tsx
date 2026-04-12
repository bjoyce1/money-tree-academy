import { useState, useEffect } from 'react';
import { ShoppingCart, Palette, TreePine, Sparkles, Crown, Eye, Check, Lock } from 'lucide-react';
import { useCoins } from './CoinsSystem';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'themes' | 'tree' | 'character' | 'effects' | 'premium';
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  equipped?: boolean;
}

interface PurchasedItems {
  [itemId: string]: {
    purchased: boolean;
    equipped: boolean;
    purchaseDate: string;
  };
}

export default function RewardsShop() {
  const [showShop, setShowShop] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ShopItem['category']>('themes');
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItems>({});
  const [currentCoins, setCurrentCoins] = useState(0);
  const { spendCoins, getCurrentCoins } = useCoins();

  const shopItems: ShopItem[] = [
    // Themes
    {
      id: 'forest-theme',
      name: 'Forest Theme',
      description: 'Green nature-inspired reading theme with forest backgrounds',
      price: 50,
      category: 'themes',
      icon: <TreePine className="text-green-400" size={20} />,
      rarity: 'common',
      unlocked: false
    },
    {
      id: 'sunset-theme',
      name: 'Sunset Theme',
      description: 'Warm orange and pink gradients for evening reading',
      price: 75,
      category: 'themes',
      icon: <Palette className="text-orange-400" size={20} />,
      rarity: 'rare',
      unlocked: false
    },
    {
      id: 'ocean-theme',
      name: 'Ocean Theme',
      description: 'Calming blue tones with wave animations',
      price: 100,
      category: 'themes',
      icon: <Palette className="text-blue-400" size={20} />,
      rarity: 'epic',
      unlocked: false
    },
    {
      id: 'gold-theme',
      name: 'Golden Luxury',
      description: 'Premium gold accents and elegant typography',
      price: 150,
      category: 'themes',
      icon: <Crown className="text-yellow-400" size={20} />,
      rarity: 'legendary',
      unlocked: false
    },

    // Tree Decorations
    {
      id: 'fairy-lights',
      name: 'Fairy Lights',
      description: 'Twinkling lights around your money tree',
      price: 40,
      category: 'tree',
      icon: <Sparkles className="text-yellow-300" size={20} />,
      rarity: 'common',
      unlocked: false
    },
    {
      id: 'golden-branches',
      name: 'Golden Branches',
      description: 'Shimmering gold-plated tree branches',
      price: 80,
      category: 'tree',
      icon: <TreePine className="text-yellow-500" size={20} />,
      rarity: 'rare',
      unlocked: false
    },
    {
      id: 'rainbow-leaves',
      name: 'Rainbow Leaves',
      description: 'Multicolored leaves that change with the seasons',
      price: 120,
      category: 'tree',
      icon: <TreePine className="text-purple-400" size={20} />,
      rarity: 'epic',
      unlocked: false
    },
    {
      id: 'crystal-tree',
      name: 'Crystal Tree',
      description: 'Transform your tree into a magical crystal formation',
      price: 200,
      category: 'tree',
      icon: <Sparkles className="text-cyan-400" size={20} />,
      rarity: 'legendary',
      unlocked: false
    },

    // Character Items for Aisha
    {
      id: 'aisha-suit',
      name: 'Executive Blazer',
      description: 'Professional blazer for Aisha\'s business meetings',
      price: 40,
      category: 'character',
      icon: <Crown className="text-purple-400" size={20} />,
      rarity: 'common',
      unlocked: false
    },
    {
      id: 'aisha-watch',
      name: 'Strategic Timepiece',
      description: 'Luxury watch for timing perfect investment decisions',
      price: 75,
      category: 'character',
      icon: <Eye className="text-blue-400" size={20} />,
      rarity: 'rare',
      unlocked: false
    },

    // Character Items for Emma
    {
      id: 'emma-scarf',
      name: 'Creative Scarf',
      description: 'Colorful scarf that sparks Emma\'s innovation',
      price: 35,
      category: 'character',
      icon: <Sparkles className="text-pink-400" size={20} />,
      rarity: 'common',
      unlocked: false
    },
    {
      id: 'emma-notebook',
      name: 'Idea Journal',
      description: 'Special notebook for Emma\'s brilliant business ideas',
      price: 65,
      category: 'character',
      icon: <Crown className="text-green-400" size={20} />,
      rarity: 'rare',
      unlocked: false
    },

    // Character Items for Liam
    {
      id: 'liam-tie',
      name: 'Focus Tie',
      description: 'Sharp tie that helps Liam stay focused on goals',
      price: 30,
      category: 'character',
      icon: <Eye className="text-orange-400" size={20} />,
      rarity: 'common',
      unlocked: false
    },
    {
      id: 'liam-badge',
      name: 'Achievement Pin',
      description: 'Special badge celebrating Liam\'s accomplishments',
      price: 80,
      category: 'character',
      icon: <Crown className="text-red-400" size={20} />,
      rarity: 'rare',
      unlocked: false
    },

    // Character Items for Mateo
    {
      id: 'mateo-glasses',
      name: 'Analytical Glasses',
      description: 'Smart glasses that help Mateo research faster',
      price: 45,
      category: 'character',
      icon: <Eye className="text-blue-400" size={20} />,
      rarity: 'common',
      unlocked: false
    },
    {
      id: 'mateo-calculator',
      name: 'Knowledge Calculator',
      description: 'Advanced calculator for Mateo\'s complex analyses',
      price: 70,
      category: 'character',
      icon: <Sparkles className="text-cyan-400" size={20} />,
      rarity: 'rare',
      unlocked: false
    },

    // Effects
    {
      id: 'particle-effects',
      name: 'Magic Particles',
      description: 'Floating sparkles when you achieve milestones',
      price: 70,
      category: 'effects',
      icon: <Sparkles className="text-pink-400" size={20} />,
      rarity: 'rare',
      unlocked: false
    },
    {
      id: 'confetti-burst',
      name: 'Confetti Burst',
      description: 'Colorful confetti explosion for achievements',
      price: 110,
      category: 'effects',
      icon: <Sparkles className="text-rainbow" size={20} />,
      rarity: 'epic',
      unlocked: false
    },

    // Premium Features
    {
      id: 'speed-reading',
      name: 'Speed Reading Mode',
      description: 'Advanced reading tools and speed tracking',
      price: 250,
      category: 'premium',
      icon: <Eye className="text-red-400" size={20} />,
      rarity: 'legendary',
      unlocked: false
    }
  ];

  useEffect(() => {
    loadPurchasedItems();
    setCurrentCoins(getCurrentCoins());

    // Listen for coin updates
    const handleCoinsUpdate = () => {
      setCurrentCoins(getCurrentCoins());
    };

    window.addEventListener('coins-updated', handleCoinsUpdate);
    return () => window.removeEventListener('coins-updated', handleCoinsUpdate);
  }, []);

  const loadPurchasedItems = () => {
    const stored = localStorage.getItem('purchased_items');
    if (stored) {
      setPurchasedItems(JSON.parse(stored));
    }
  };

  const purchaseItem = (item: ShopItem) => {
    if (currentCoins < item.price) {
      showNotification('Not enough coins! 💸', 'error');
      return;
    }

    if (spendCoins(item.price, `Purchased ${item.name}`)) {
      const updatedPurchases = {
        ...purchasedItems,
        [item.id]: {
          purchased: true,
          equipped: false,
          purchaseDate: new Date().toISOString()
        }
      };

      setPurchasedItems(updatedPurchases);
      localStorage.setItem('purchased_items', JSON.stringify(updatedPurchases));
      setCurrentCoins(getCurrentCoins());
      
      showNotification(`${item.name} purchased! ✨`, 'success');
    }
  };

  const equipItem = (item: ShopItem) => {
    const updatedPurchases = {
      ...purchasedItems,
      [item.id]: {
        ...purchasedItems[item.id],
        equipped: !purchasedItems[item.id]?.equipped
      }
    };

    setPurchasedItems(updatedPurchases);
    localStorage.setItem('purchased_items', JSON.stringify(updatedPurchases));
    
    const action = updatedPurchases[item.id].equipped ? 'equipped' : 'unequipped';
    showNotification(`${item.name} ${action}! 🎯`, 'success');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500';
    
    notification.className = `fixed top-4 right-4 bg-gradient-to-r ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce`;
    notification.innerHTML = `<div class="font-semibold">${message}</div>`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-slate-500/30 bg-slate-900/30';
      case 'rare': return 'border-blue-500/30 bg-blue-950/20';
      case 'epic': return 'border-purple-500/30 bg-purple-950/20';
      case 'legendary': return 'border-yellow-500/30 bg-yellow-950/20';
      default: return 'border-slate-500/30 bg-slate-900/30';
    }
  };

  const categories = [
    { id: 'themes', name: 'Themes', icon: <Palette size={16} /> },
    { id: 'tree', name: 'Tree Decor', icon: <TreePine size={16} /> },
    { id: 'character', name: 'Character', icon: <Crown size={16} /> },
    { id: 'effects', name: 'Effects', icon: <Sparkles size={16} /> },
    { id: 'premium', name: 'Premium', icon: <Eye size={16} /> }
  ];

  const filteredItems = shopItems.filter(item => item.category === selectedCategory);
  const purchasedCount = Object.values(purchasedItems).filter(item => item.purchased).length;

  return (
    <div className="mb-6">
      {/* Shop Summary */}
      <div 
        className="bg-gradient-to-r from-purple-950/20 to-pink-950/20 border border-purple-500/30 rounded-xl p-4 cursor-pointer hover:border-purple-400/50 transition-colors"
        onClick={() => setShowShop(!showShop)}
        data-testid="rewards-shop-summary"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-purple-400" size={20} />
            <div>
              <h3 className="font-semibold text-slate-100">Rewards Shop</h3>
              <p className="text-slate-400 text-sm">
                {purchasedCount}/{shopItems.length} items unlocked • {currentCoins.toLocaleString()} coins
              </p>
            </div>
          </div>
          <div className="text-2xl">🛒</div>
        </div>
      </div>

      {/* Expanded Shop */}
      {showShop && (
        <div className="mt-4 bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as ShopItem['category'])}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                data-testid={`category-${category.id}`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>

          {/* Current Coins Display */}
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-950/30 to-amber-950/30 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-yellow-300">
              <Sparkles size={20} />
              {currentCoins.toLocaleString()} Coins Available
            </div>
          </div>

          {/* Shop Items */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isPurchased = purchasedItems[item.id]?.purchased || false;
              const isEquipped = purchasedItems[item.id]?.equipped || false;
              const canAfford = currentCoins >= item.price;
              
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border transition-all ${getRarityColor(item.rarity)} ${
                    isPurchased ? 'opacity-90' : canAfford ? 'hover:scale-105' : 'opacity-60'
                  }`}
                  data-testid={`shop-item-${item.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {item.icon}
                      <div>
                        <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                          {item.name}
                          {isEquipped && <span className="text-green-400">✓</span>}
                        </h4>
                        <p className="text-sm text-slate-300 mb-2">{item.description}</p>
                      </div>
                    </div>
                    {isPurchased && <Check className="text-green-400" size={20} />}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.rarity === 'legendary' ? 'bg-yellow-900/30 text-yellow-300' :
                        item.rarity === 'epic' ? 'bg-purple-900/30 text-purple-300' :
                        item.rarity === 'rare' ? 'bg-blue-900/30 text-blue-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {item.rarity}
                      </span>
                      <span className="text-sm font-semibold text-yellow-400">
                        {item.price} coins
                      </span>
                    </div>
                    
                    {isPurchased ? (
                      <button
                        onClick={() => equipItem(item)}
                        className={`px-3 py-1 rounded font-medium text-sm transition-colors ${
                          isEquipped 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        data-testid={`equip-${item.id}`}
                      >
                        {isEquipped ? 'Unequip' : 'Equip'}
                      </button>
                    ) : (
                      <button
                        onClick={() => purchaseItem(item)}
                        disabled={!canAfford}
                        className={`px-3 py-1 rounded font-medium text-sm transition-colors ${
                          canAfford 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                        data-testid={`buy-${item.id}`}
                      >
                        {canAfford ? 'Buy' : <Lock size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
              <p>No items in this category yet. Check back for new arrivals!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}