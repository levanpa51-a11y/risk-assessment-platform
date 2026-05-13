import { BarChart3, AlertTriangle, CheckCircle, Clock, TrendingDown, Shield } from 'lucide-react';
import type { RiskAssessment } from '../types';
import { RISK_CATEGORY_LABELS, HAZARD_CATEGORIES } from '../types';

interface Props {
  assessments: RiskAssessment[];
}

export function Dashboard({ assessments }: Props) {
  const criticalCount = assessments.filter(a => a.initialRisk.category === 'critical').length;
  const highCount = assessments.filter(a => a.initialRisk.category === 'high').length;
  const mediumCount = assessments.filter(a => a.initialRisk.category === 'medium').length;
  const lowCount = assessments.filter(a => a.initialRisk.category === 'low').length;

  const avgInitialRisk = assessments.length > 0
    ? assessments.reduce((sum, a) => sum + a.initialRisk.rating, 0) / assessments.length
    : 0;

  const avgResidualRisk = assessments.length > 0
    ? assessments.reduce((sum, a) => sum + a.residualRisk.rating, 0) / assessments.length
    : 0;

  const riskReduction = avgInitialRisk > 0
    ? ((avgInitialRisk - avgResidualRisk) / avgInitialRisk * 100).toFixed(1)
    : '0';

  const upcomingDeadlines = assessments
    .filter(a => a.deadline)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const categoryDistribution = Object.keys(HAZARD_CATEGORIES).map(cat => ({
    category: cat,
    label: HAZARD_CATEGORIES[cat as keyof typeof HAZARD_CATEGORIES],
    count: assessments.filter(a => a.hazard.category === cat).length
  })).filter(c => c.count > 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-2xl p-6 border border-amber-500/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">კეთილი იყოს თქვენი მობრძანება</h1>
            <p className="text-slate-300">რისკის შეფასების პლატფორმა - შრომის უსაფრთხოების მართვის სისტემა</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-amber-500" />
            <span className="text-3xl font-bold text-white">{assessments.length}</span>
          </div>
          <div className="text-slate-400">სულ შეფასება</div>
        </div>

        <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-red-400">{criticalCount + highCount}</span>
          </div>
          <div className="text-slate-400">მაღალი რისკი</div>
        </div>

        <div className="bg-green-500/10 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-3xl font-bold text-green-400">{lowCount}</span>
          </div>
          <div className="text-slate-400">მისაღები რისკი</div>
        </div>

        <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="w-8 h-8 text-blue-500" />
            <span className="text-3xl font-bold text-blue-400">{riskReduction}%</span>
          </div>
          <div className="text-slate-400">რისკის შემცირება</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk Overview */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            რისკების მიმოხილვა
          </h3>

          {assessments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>შეფასებები არ არის დამატებული</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <span className="text-red-400">კრიტიკული (15-25)</span>
                <span className="text-white font-bold">{criticalCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <span className="text-orange-400">მაღალი (9-12)</span>
                <span className="text-white font-bold">{highCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <span className="text-yellow-400">საშუალო (5-8)</span>
                <span className="text-white font-bold">{mediumCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <span className="text-green-400">დაბალი (1-4)</span>
                <span className="text-white font-bold">{lowCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            მოახლოებული ვადები
          </h3>

          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ვადები არ არის დაგეგმილი</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map(assessment => (
                <div key={assessment.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                  <div>
                    <div className="text-white font-medium">{assessment.hazard.name}</div>
                    <div className="text-slate-400 text-sm">{assessment.responsiblePerson}</div>
                  </div>
                  <div className="text-amber-400 text-sm">
                    {new Date(assessment.deadline).toLocaleDateString('ka-GE')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Distribution */}
      {categoryDistribution.length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            საფრთხეების კატეგორიები
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryDistribution.map(cat => (
              <div key={cat.category} className="bg-slate-700/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{cat.count}</div>
                <div className="text-slate-400 text-sm">{cat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
          სწრაფი მოქმედებები
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-xl p-4 border border-amber-500/30">
            <h4 className="text-white font-medium mb-2">1. საფრთხეების იდენტიფიცირება</h4>
            <p className="text-slate-400 text-sm">დაიწყეთ სამუშაო სივრცის დათვალიერება და საფრთხეების გამოვლენა</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-xl p-4 border border-blue-500/30">
            <h4 className="text-white font-medium mb-2">2. რისკის შეფასება</h4>
            <p className="text-slate-400 text-sm">გამოიყენეთ რისკის მატრიცა ალბათობისა და შედეგის შესაფასებლად</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl p-4 border border-emerald-500/30">
            <h4 className="text-white font-medium mb-2">3. კონტროლის ზომები</h4>
            <p className="text-slate-400 text-sm">განსაზღვრეთ საკონტროლო ღონისძიებები კონტროლის იერარქიის მიხედვით</p>
          </div>
        </div>
      </div>
    </div>
  );
}
