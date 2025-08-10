import React, { useState } from "react";
import type { Quest, Domain } from "../types";
import { Plus, Filter } from "lucide-react";

interface QuestManagerProps {
  quests: Quest[];
  onAddQuest: (title: string, domain: Domain, cadence: Quest["cadence"]) => void;
  onToggleComplete: (questId: string) => void;
}

export function QuestManager({ quests, onAddQuest, onToggleComplete }: QuestManagerProps) {
  const [filter, setFilter] = useState<Domain | "all">("all");
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDomain, setNewQuestDomain] = useState<Domain>("personal");
  const [newQuestCadence, setNewQuestCadence] = useState<Quest["cadence"]>("daily");

  const filteredQuests = quests.filter(quest => 
    filter === "all" ? true : quest.domain === filter
  );

  const handleAddQuest = () => {
    if (newQuestTitle.trim()) {
      onAddQuest(newQuestTitle, newQuestDomain, newQuestCadence);
      setNewQuestTitle("");
    }
  };

  const getDomainColor = (domain: Domain) => {
    const colors = {
      personal: "bg-green-100 text-green-800",
      ceo: "bg-blue-100 text-blue-800", 
      family: "bg-purple-100 text-purple-800"
    };
    return colors[domain];
  };

  return (
    <section className="space-y-4">
      {/* Quest Creation Form */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input 
            className="md:col-span-2 p-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" 
            placeholder="New quest title" 
            value={newQuestTitle} 
            onChange={(e) => setNewQuestTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddQuest()}
          />

          <select 
            value={newQuestDomain} 
            onChange={(e) => setNewQuestDomain(e.target.value as Domain)} 
            className="p-3 rounded-lg border border-gray-200 focus:border-indigo-500 transition-all"
          >
            <option value="personal">Personal</option>
            <option value="ceo">CEO</option>
            <option value="family">Family</option>
          </select>

          <select 
            value={newQuestCadence} 
            onChange={(e) => setNewQuestCadence(e.target.value as Quest["cadence"])} 
            className="p-3 rounded-lg border border-gray-200 focus:border-indigo-500 transition-all"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="once">Once</option>
          </select>

          <button 
            onClick={handleAddQuest} 
            className="md:col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Add Quest
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter size={16} className="text-gray-500" />
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as Domain | "all")} 
          className="p-2 rounded-lg border border-gray-200 focus:border-indigo-500 transition-all"
        >
          <option value="all">All domains</option>
          <option value="personal">Personal</option>
          <option value="ceo">CEO</option>
          <option value="family">Family</option>
        </select>
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {filteredQuests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No quests found - add one to get started!</p>
          </div>
        )}
        
        {filteredQuests.map((quest) => (
          <div key={quest.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={quest.completed} 
                onChange={() => onToggleComplete(quest.id)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <div className={`font-medium ${quest.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {quest.title}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDomainColor(quest.domain)}`}>
                    {quest.domain.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{quest.cadence}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs font-medium text-indigo-600">{quest.xp} XP</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {new Date(quest.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}