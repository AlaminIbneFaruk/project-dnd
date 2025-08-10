export type Domain = "personal" | "ceo" | "family";

export type Quest = {
  id: string;
  title: string;
  description?: string;
  domain: Domain;
  cadence: "daily" | "weekly" | "once";
  xp: number;
  completed: boolean;
  createdAt: string;
};

export type Character = {
  name: string;
  level: number;
  xp: number;
  attributes: { 
    empathy: number; 
    discipline: number; 
    strategy: number; 
    communication: number;
  };
};