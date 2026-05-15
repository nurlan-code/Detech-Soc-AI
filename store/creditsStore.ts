import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CreditsState {
  credits: number;
  streak: number;
  lastClaimed: string | null; // ISO date string YYYY-MM-DD
  totalEarned: number;
  claimDaily: () => { success: boolean; earned: number; message: string };
  spendCredits: (amount: number) => boolean;
  earnCredits: (amount: number) => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isConsecutiveDay(lastDate: string) {
  const last = new Date(lastDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - last.getTime()) / 86400000);
  return diff === 1;
}

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      credits: 650,
      streak: 3,
      lastClaimed: null,
      totalEarned: 650,

      claimDaily: () => {
        const { lastClaimed, streak, credits, totalEarned } = get();
        const t = today();

        if (lastClaimed === t) {
          return { success: false, earned: 0, message: "Already claimed today! Come back tomorrow." };
        }

        const newStreak = lastClaimed && isConsecutiveDay(lastClaimed) ? streak + 1 : 1;
        // Bonus: +10 per streak day, capped at +100 bonus
        const base = 100;
        const bonus = Math.min((newStreak - 1) * 10, 100);
        const earned = base + bonus;

        set({
          credits: credits + earned,
          streak: newStreak,
          lastClaimed: t,
          totalEarned: totalEarned + earned,
        });

        return { success: true, earned, message: `+${earned} credits! ${newStreak > 1 ? `🔥 ${newStreak}-day streak!` : ""}` };
      },

      spendCredits: (amount) => {
        const { credits } = get();
        if (credits < amount) return false;
        set({ credits: credits - amount });
        return true;
      },

      earnCredits: (amount) => {
        const { credits, totalEarned } = get();
        set({ credits: credits + amount, totalEarned: totalEarned + amount });
      },
    }),
    { name: "soc-credits" }
  )
);
