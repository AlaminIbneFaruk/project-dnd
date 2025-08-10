import React from "react";
import { TrendingUp, Users, Heart, BookOpen } from "lucide-react";

interface DashboardProps {
  playerName: string;
}

function DashboardCard({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h4 className="font-semibold text-gray-800">{title}</h4>
      </div>
      <div>{children}</div>
    </div>
  );
}

export function Dashboard({ playerName }: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {playerName}
        </h1>
        <div className="text-sm text-gray-600 bg-green-100 px-3 py-2 rounded-full">
          Daily streak: <strong className="text-green-800">3</strong>
        </div>
      </header>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard 
          title="Company Snapshot" 
          icon={<TrendingUp size={20} className="text-blue-600" />}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Revenue: <strong className="text-green-600">$3,200</strong>
            </p>
            <p className="text-sm text-gray-600">
              Morale: <strong className="text-blue-600">75%</strong>
            </p>
            <button className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline transition-colors">
              Run 15-min retro
            </button>
          </div>
        </DashboardCard>

        <DashboardCard 
          title="Family Hub" 
          icon={<Heart size={20} className="text-purple-600" />}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Next event: <strong>Device-free dinner — Sat</strong>
            </p>
            <p className="text-sm text-gray-600">
              Relationship score: <strong className="text-purple-600">82</strong>
            </p>
          </div>
        </DashboardCard>

        <DashboardCard 
          title="Daily Coaching" 
          icon={<BookOpen size={20} className="text-indigo-600" />}
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Today's micro-lesson: Active listening techniques
            </p>
            <button className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors">
              Start 5-min Lesson
            </button>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}