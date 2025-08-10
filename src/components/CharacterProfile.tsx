import React from "react";
import type { Character } from "../types";
import { xpForNextLevel } from "../utils/game";

interface CharacterProfileProps {
  character: Character;
  onReset: () => void;
}

function Attribute({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700">{label}</span>
      <div className="w-32 bg-gray-200 h-2 rounded-full overflow-hidden">
        <div 
          className="h-2 bg-indigo-500 rounded-full transition-all duration-300" 
          style={{ width: `${Math.min((value / 10) * 100, 100)}%` }} 
        />
      </div>
    </div>
  );
}

export function CharacterProfile({ character, onReset }: CharacterProfileProps) {
  const xpNeeded = xpForNextLevel(character.level) - character.xp;
  const xpProgress = (character.xp / xpForNextLevel(character.level)) * 100;

  return (
    <div className="space-y-6">
      {/* Character Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
          {character.name?.[0]?.toUpperCase() || "Y"}
        </div>
        <div>
          <h2 className="font-semibold text-xl text-gray-800">{character.name}</h2>
          <p className="text-sm text-gray-500">Level {character.level} • {character.xp} XP</p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
          <div 
            className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out" 
            style={{ width: `${xpProgress}%` }} 
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">{xpNeeded} XP to next level</p>
      </div>

      {/* Attributes */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">Attributes</h3>
        <div className="space-y-2">
          <Attribute label="Empathy" value={character.attributes.empathy} />
          <Attribute label="Discipline" value={character.attributes.discipline} />
          <Attribute label="Strategy" value={character.attributes.strategy} />
          <Attribute label="Communication" value={character.attributes.communication} />
        </div>
      </div>

      {/* Reset Demo */}
      <div className="pt-4 border-t border-gray-200">
        <button 
          className="text-sm text-indigo-600 hover:text-indigo-800 underline transition-colors"
          onClick={onReset}
        >
          Reset Demo
        </button>
        <p className="mt-2 text-xs text-gray-500">
          Tip: To make this real, swap localStorage persistence with Firestore and the auth screen with Firebase Auth.
        </p>
      </div>
    </div>
  );
}