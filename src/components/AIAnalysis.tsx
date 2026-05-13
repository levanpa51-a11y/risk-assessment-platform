import { useState } from 'react';
import { Brain, Sparkles, AlertTriangle, TrendingUp, Shield, Lightbulb, RefreshCw } from 'lucide-react';
import type { RiskAssessment } from '../types';
import { RISK_CATEGORY_LABELS, CONTROL_TYPES } from '../types';

interface Props {
  assessments: RiskAssessment[];
}

interface AIRecommendation {
  type: 'warning' | 'improvement' | 'priority' | 'best-practice';
  title: string;
  description: string;
  relatedAssessments?: string[];
}

export function AIAnalysis({ assessments }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const analyzeRisks = () => {
    setIsAnalyzing(true);

    // Simulate AI analysis
    setTimeout(() => {
      const newRecommendations: AIRecommendation[] = [];

      // Analyze critical risks
      const criticalRisks = assessments.filter(a => a.initialRisk.category === 'critical');
      if (criticalRisks.length > 0) {
        newRecommendations.push({
          type: 'warning',
          title: `კრიტიკული რისკები აღმოჩენილია (${criticalRisks.length})`,
          description: 'ეს რისკები მოითხოვს დაუყოვნებლივ ყურადღებას. სამუშაო უნდა შეჩერდეს სანამ რისკი არ შემცირდება.',
          relatedAssessments: criticalRisks.map(r => r.hazard.name)
        });
      }

      // Check for high residual risks
      const highResidualRisks = assessments.filter(a =>
        a.residualRisk.rating >= 9 && a.residualRisk.rating < a.initialRisk.rating
      );
      if (highResidualRisks.length > 0) {
        newRecommendations.push({
          type: 'improvement',
          title: 'ნარჩენი რისკები კვლავ მაღალია',
          description: 'მიუხედავად საკონტროლო ზომებისა, ზოგიერთი რისკი კვლავ მაღალ დონეზეა. გაიაროთ კონტროლის იერარქიის უფრო მაღალი საფეხურები.',
          relatedAssessments: highResidualRisks.map(r => r.hazard.name)
        });
      }

      // Priority recommendations
      const physicalHazards = assessments.filter(a => a.hazard.category === 'physical' || a.hazard.category === 'mechanical');
      if (physicalHazards.length > 2) {
        newRecommendations.push({
          type: 'priority',
          title: 'ფიზიკური/მექანიკური საფრთხეების კონცენტრაცია',
          description: 'სამუშაო გარემოში მრავალი ფიზიკური საფრთხეა. რეკომენდებულია საინჟინრო კონტროლის ზომების გაძლიერება.',
          relatedAssessments: physicalHazards.map(r => r.hazard.name)
        });
      }

      // Best practices
      const assessmentsWithoutDeadline = assessments.filter(a => !a.deadline);
      if (assessmentsWithoutDeadline.length > 0) {
        newRecommendations.push({
          type: 'best-practice',
          title: 'ვადების განსაზღვრა აუცილებელია',
          description: 'ზოგიერთ შეფასებას არ აქვს განსაზღვრული შესრულების ვადა. ვადების დაწესება აუმჯობესებს პასუხისმგებლობას.',
          relatedAssessments: assessmentsWithoutDeadline.map(r => r.hazard.name)
        });
      }

      // Control hierarchy recommendations
      const ppeOnlyControls = assessments.filter(a =>
        a.additionalControls.some(c => c.toLowerCase().includes('ინდივიდუალური') || c.toLowerCase().includes('ხელთათმანი') || c.toLowerCase().includes('სათვალე'))
      );
      if (ppeOnlyControls.length > 0) {
        newRecommendations.push({
          type: 'best-practice',
          title: 'კონტროლის იერარქიის გათვალისწინება',
          description: 'ზოგიერთ შემთხვევაში მხოლოდ ინდივიდუალური დაცვის საშუალებებია გამოყენებული. გაითვალისწინეთ კონტროლის იერარქიის უფრო მაღალი საფეხურები (აღმოფხვრა, შემცირება, იზოლირება).',
          relatedAssessments: ppeOnlyControls.map(r => r.hazard.name)
        });
      }

      // Add general recommendations if no assessments
      if (assessments.length === 0) {
        newRecommendations.push({
          type: 'best-practice',
          title: 'დაიწყეთ საფრთხეების იდენტიფიცირება',
          description: 'ჯერ არ გაქვთ დამატებული საფრთხეები. დაიწყეთ სამუშაო სივრცის დათვალიერება და საფრთხეების იდენტიფიცირება ფოტო/ვიდეო მასალით.',
        });
      }

      // Summary recommendation
      if (assessments.length > 0) {
        const avgRisk = assessments.reduce((sum, a) => sum + a.initialRisk.rating, 0) / assessments.length;
        newRecommendations.push({
          type: 'improvement',
          title: `საშუალო რისკის დონე: ${avgRisk.toFixed(1)}`,
          description: avgRisk >= 12
            ? 'სამუშაო გარემოს საშუალო რისკის დონე მაღალია. საჭიროა კომპლექსური პრევენციული ღონისძიებების გატარება.'
            : avgRisk >= 6
            ? 'სამუშაო გარემოს საშუალო რისკის დონე ზომიერია. გააგრძელეთ მონიტორინგი და პრევენციული ღონისძიებები.'
            : 'სამუშაო გარემოს საშუალო რისკის დონე მისაღებია. შეინარჩუნეთ არსებული კონტროლის ზომები.',
        });
      }

      setRecommendations(newRecommendations);
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }, 2000);
  };

  const getTypeIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'improvement': return <TrendingUp className="w-5 h-5" />;
      case 'priority': return <Shield className="w-5 h-5" />;
      case 'best-practice': return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'warning': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'improvement': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'priority': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'best-practice': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
  };

  const getTypeLabel = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'warning': return 'გაფრთხილება';
      case 'improvement': return 'გაუმჯობესება';
      case 'priority': return 'პრიორიტეტი';
      case 'best-practice': return 'საუკეთესო პრაქტიკა';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            AI ანალიზი
          </h2>
          <button
            onClick={analyzeRisks}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                ანალიზი მიმდინარეობს...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                {hasAnalyzed ? 'ხელახალი ანალიზი' : 'ანალიზის დაწყება'}
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{assessments.length}</div>
            <div className="text-slate-400 text-sm">სულ შეფასება</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">
              {assessments.filter(a => a.initialRisk.category === 'critical').length}
            </div>
            <div className="text-slate-400 text-sm">კრიტიკული</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">
              {assessments.filter(a => a.initialRisk.category === 'high').length}
            </div>
            <div className="text-slate-400 text-sm">მაღალი</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {assessments.filter(a => a.initialRisk.category === 'low').length}
            </div>
            <div className="text-slate-400 text-sm">დაბალი</div>
          </div>
        </div>

        {/* Analysis Status */}
        {!hasAnalyzed && !isAnalyzing && (
          <div className="text-center py-12">
            <Brain className="w-20 h-20 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl text-slate-400 mb-2">AI ანალიზი</h3>
            <p className="text-slate-500 mb-4">
              დააჭირეთ "ანალიზის დაწყება" ღილაკს რისკების ავტომატური ანალიზისთვის
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-12">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Brain className="w-20 h-20 text-violet-500 animate-pulse" />
              <Sparkles className="w-8 h-8 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
            </div>
            <h3 className="text-xl text-white mb-2">მიმდინარეობს ანალიზი...</h3>
            <p className="text-slate-400">AI სისტემა აანალიზებს რისკებს და გენერირებს რეკომენდაციებს</p>
          </div>
        )}

        {/* Recommendations */}
        {hasAnalyzed && !isAnalyzing && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              AI რეკომენდაციები ({recommendations.length})
            </h3>
            {recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-xl border ${getTypeColor(rec.type)}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getTypeIcon(rec.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-slate-700/50 rounded">{getTypeLabel(rec.type)}</span>
                      <h4 className="font-semibold text-white">{rec.title}</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{rec.description}</p>
                    {rec.relatedAssessments && rec.relatedAssessments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {rec.relatedAssessments.map((name, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Distribution Chart */}
      {assessments.length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">რისკების განაწილება</h3>
          <div className="space-y-3">
            {(['critical', 'high', 'medium', 'low'] as const).map(category => {
              const count = assessments.filter(a => a.initialRisk.category === category).length;
              const percentage = (count / assessments.length) * 100;
              const colors = {
                critical: 'bg-red-600',
                high: 'bg-orange-500',
                medium: 'bg-yellow-500',
                low: 'bg-green-500'
              };
              return (
                <div key={category} className="flex items-center gap-4">
                  <div className="w-24 text-slate-400 text-sm">{RISK_CATEGORY_LABELS[category]}</div>
                  <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[category]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-right text-white font-semibold">{count} ({percentage.toFixed(0)}%)</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
