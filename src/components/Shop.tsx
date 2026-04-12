import { useAppStore } from "@/state/store";

export default function Shop(){
  const { shop, progress, spendCoins } = useAppStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Rewards Shop</h2>
        <div className="text-amber-400 font-bold">Coins: {progress.coins}</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shop.map(item=>{
          const owned = !!progress.purchasedItems[item.sku];
          const canBuy = progress.coins >= item.price && !owned;
          return (
            <div key={item.sku} className="rounded-2xl p-4 border border-zinc-700 bg-zinc-800/40">
              <div className="text-3xl">{item.icon}</div>
              <div className="mt-2 font-semibold">{item.name}</div>
              <p className="text-sm opacity-80">{item.description}</p>
              <div className="mt-2 text-xs">Price: {item.price} coins</div>
              <button disabled={!canBuy}
                onClick={()=>spendCoins(item.sku, item.price)}
                className="mt-3 px-3 py-1 rounded bg-amber-500 text-black font-semibold disabled:opacity-50">
                {owned ? "Owned" : canBuy ? "Buy" : "Not enough coins"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}