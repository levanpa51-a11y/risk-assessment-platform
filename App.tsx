import { useState } from 'react';
import { RiskMatrix } from './components/RiskMatrix';
import { HazardIdentification } from './components/HazardIdentification';
import { ControlHierarchy } from './components/ControlHierarchy';
import { RiskAssessmentForm } from './components/RiskAssessmentForm';
import { AIAnalysis } from './components/AIAnalysis';
import { Dashboard } from './components/Dashboard';
import {
  AlertTriangle,
  BarChart3,
  FileText,
  Shield,
  Brain,
  Home
} from 'lucide-react';
import type { RiskAssessment } from './types';

type TabType = 'dashboard' | 'hazards' | 'matrix' | 'hierarchy' | 'form' | 'ai';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);

  const addAssessment = (assessment: RiskAssessment) => {
    setAssessments(prev => [...prev, assessment]);
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'მთავარი', icon: Home },
    { id: 'hazards' as TabType, label: 'საფრთხეები', icon: AlertTriangle },
    { id: 'matrix' as TabType, label: 'რისკის მატრიცა', icon: BarChart3 },
    { id: 'hierarchy' as TabType, label: 'კონტროლის იერარქია', icon: Shield },
    { id: 'form' as TabType, label: 'შეფასების ფორმა', icon: FileText },
    { id: 'ai' as TabType, label: 'AI ანალიზი', icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">რისკის შეფასების პლატფორმა</h1>
                <p className="text-slate-400 text-sm">შრომის უსაფრთხოების მართვის სისტემა</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                {assessments.length} შეფასება
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/30 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <Dashboard assessments={assessments} />}
        {activeTab === 'hazards' && <HazardIdentification onAdd={addAssessment} />}
        {activeTab === 'matrix' && <RiskMatrix />}
        {activeTab === 'hierarchy' && <ControlHierarchy />}
        {activeTab === 'form' && <RiskAssessmentForm assessments={assessments} />}
        {activeTab === 'ai' && <AIAnalysis assessments={assessments} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800/30 border-t border-slate-700/50 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          © 2026 რისკის შეფასების პლატფორმა | საქართველოს შრომის უსაფრთხოების კანონმდებლობის შესაბამისად
        </div>
      </footer>
    </div>
  );
}

export default App;
