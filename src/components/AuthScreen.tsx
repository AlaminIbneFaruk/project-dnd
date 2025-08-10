import React, { useState } from "react";

interface AuthScreenProps {
  onLogin: (name: string) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [inputName, setInputName] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">D&D Life</h1>
        <p className="text-gray-600 mb-6">
          Play a role-playing approach to becoming a better person, CEO, and family member.
        </p>
        
        <div className="space-y-4">
          <input
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-4 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            onKeyDown={(e) => e.key === "Enter" && onLogin(inputName)}
          />
          
          <div className="flex gap-3">
            <button
              onClick={() => onLogin(inputName)}
              className="flex-1 py-3 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Start Your Journey
            </button>
            <button
              onClick={() => {
                setInputName("Demo Player");
                onLogin("Demo Player");
              }}
              className="py-3 px-6 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Try Demo
            </button>
          </div>
        </div>
        
        <p className="mt-6 text-sm text-gray-400 text-center">
          This demo stores data in your browser only. For a production app we'll wire Firebase Auth and Firestore.
        </p>
      </div>
    </div>
  );
}