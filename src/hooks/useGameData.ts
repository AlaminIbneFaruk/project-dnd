import { useEffect, useState } from "react";
import type { Character, Quest } from "../types";
import { uid, nowISO, calculateLevel } from "../utils/game";

// LocalStorage keys
const LS_USER = "dnd_user_demo";
const LS_QUESTS = "dnd_quests_demo";

// Initial demo data
const defaultCharacter: Character = {
  name: "You",
  level: 1,
  xp: 0,
  attributes: { empathy: 3, discipline: 3, strategy: 2, communication: 3 },
};

const starterQuests: Quest[] = [
  { 
    id: uid(), 
    title: "Compliment someone genuinely", 
    domain: "personal", 
    cadence: "daily", 
    xp: 10, 
    completed: false, 
    createdAt: nowISO() 
  },
  { 
    id: uid(), 
    title: "Schedule a 1:1 with a team member", 
    domain: "ceo", 
    cadence: "weekly", 
    xp: 25, 
    completed: false, 
    createdAt: nowISO() 
  },
  { 
    id: uid(), 
    title: "Have a device-free dinner with family", 
    domain: "family", 
    cadence: "weekly", 
    xp: 30, 
    completed: false, 
    createdAt: nowISO() 
  },
];

export function useGameData() {
  const [name, setName] = useState<string | null>(null);
  const [character, setCharacter] = useState<Character>(defaultCharacter);
  const [quests, setQuests] = useState<Quest[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const lsUser = localStorage.getItem(LS_USER);
    if (lsUser) {
      try {
        const parsed = JSON.parse(lsUser) as { name?: string };
        if (parsed.name) setName(parsed.name);
      } catch {}
    }

    const lsChar = localStorage.getItem(LS_QUESTS);
    if (lsChar) {
      try {
        const parsed = JSON.parse(lsChar) as { quests?: Quest[]; character?: Character };
        if (parsed.quests) setQuests(parsed.quests);
        if (parsed.character) setCharacter(parsed.character);
      } catch {}
    } else {
      // seed demo data
      setQuests(starterQuests);
      setCharacter(defaultCharacter);
    }
  }, []);

  // Persist to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(LS_QUESTS, JSON.stringify({ quests, character }));
  }, [quests, character]);

  useEffect(() => {
    localStorage.setItem(LS_USER, JSON.stringify({ name }));
  }, [name]);

  const loginDemo = (inputName: string) => {
    setName(inputName || "You");
    setCharacter(prev => ({ ...prev, name: inputName || "You" }));
  };

  const addQuest = (title: string, domain: Quest["domain"], cadence: Quest["cadence"]) => {
    if (!title.trim()) return;
    
    const quest: Quest = {
      id: uid(),
      title: title.trim(),
      domain,
      cadence,
      xp: Math.max(5, Math.floor(Math.random() * 30) + 5),
      completed: false,
      createdAt: nowISO(),
    };
    
    setQuests(prev => [quest, ...prev]);
  };

  const toggleComplete = (questId: string) => {
    setQuests(prev => {
      return prev.map(quest => {
        if (quest.id !== questId) return quest;
        
        const newCompleted = !quest.completed;
        
        // If completing, award XP
        if (!quest.completed && newCompleted) {
          awardXP(quest.xp);
        }
        
        return { ...quest, completed: newCompleted };
      });
    });
  };

  const awardXP = (amount: number) => {
    setCharacter(prev => {
      const newXPTotal = prev.xp + amount;
      const { level, xp } = calculateLevel(newXPTotal, prev.level);
      
      return { ...prev, xp, level };
    });
  };

  const resetDemo = () => {
    localStorage.removeItem(LS_QUESTS);
    localStorage.removeItem(LS_USER);
    setName(null);
    setQuests(starterQuests);
    setCharacter(defaultCharacter);
  };

  return {
    name,
    character,
    quests,
    loginDemo,
    addQuest,
    toggleComplete,
    resetDemo,
  };
}