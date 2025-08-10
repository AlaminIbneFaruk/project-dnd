import React from 'react';
import { useGameData } from './hooks/useGameData';
import { AuthScreen } from './components/AuthScreen';
import { CharacterProfile } from './components/CharacterProfile';
import { QuestManager } from './components/QuestManager';
import { Dashboard } from './components/Dashboard';

function App() {
  const {
    name,
    character,
    quests,
    loginDemo,
    addQuest,
    toggleComplete,
    resetDemo,
  } = useGameData();

  if (!name) {
    return <AuthScreen onLogin={loginDemo} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Sidebar: Character Profile */}
            <aside className="lg:col-span-1">
              <CharacterProfile 
                character={character} 
                onReset={resetDemo} 
              />
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-2 space-y-8">
              <Dashboard playerName={name} />
              
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Quests</h2>
                <QuestManager
                  quests={quests}
                  onAddQuest={addQuest}
                  onToggleComplete={toggleComplete}
                />
              </div>
            </main>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>
            Built as a demo. Ready to turn this into a full product with Firebase/Firestore integration.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;