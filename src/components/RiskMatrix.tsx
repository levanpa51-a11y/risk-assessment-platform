import { useState } from 'react';
import { Info } from 'lucide-react';
import { PROBABILITY_LABELS, SEVERITY_LABELS, calculateRiskCategory, RISK_CATEGORY_LABELS } from '../types';

export function RiskMatrix() {
  const [selectedCell, setSelectedCell] = useState<{ prob: number; sev: number } | null>(null);

  const getCellColor = (prob: number, sev: number) => {
    const rating = prob * sev;
    if (rating >= 15) return 'bg-red-600 hover:bg-red-500';
    if (rating >= 9) return 'bg-orange-500 hover:bg-orange-400';
    if (rating >= 5) return 'bg-yellow-500 hover:bg-yellow-400';
    return 'bg-green-500 hover:bg-green-400';
  };

  const getCellTextColor = (prob: number, sev: number) => {
    const rating = prob * sev;
    if (rating >= 15) return 'text-white';
    if (rating >= 9) return 'text-white';
    return 'text-slate-900';
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
          რისკის შეფასების მატრიცა
        </h2>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header - Severity */}
            <div className="flex mb-2">
              <div className="w-32 flex-shrink-0"></div>
              <div className="flex-1 grid grid-cols-5 gap-1 text-center">
                {[1, 2, 3, 4, 5].map(sev => (
                  <div key={sev} className="text-slate-400 text-xs px-2 py-1">
                    <div className="font-semibold text-white">{sev}</div>
                    <div className="truncate">{SEVERITY_LABELS[sev]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Label for severity axis */}
            <div className="flex mb-4">
              <div className="w-32 flex-shrink-0"></div>
              <div className="flex-1 text-center text-slate-500 text-sm font-medium">
                შედეგი (სიმძიმე) →
              </div>
            </div>

            {/* Matrix body */}
            <div className="flex">
              {/* Probability labels */}
              <div className="w-32 flex-shrink-0 flex flex-col justify-center">
                <div className="text-slate-500 text-sm font-medium mb-2 transform -rotate-0 text-right pr-2">
                  ალბათობა ↓
                </div>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map(prob => (
                  <div key={prob} className="flex items-center gap-1 mb-1">
                    <div className="w-28 text-right pr-2 flex-shrink-0">
                      <div className="text-white font-semibold text-sm">{prob}</div>
                      <div className="text-slate-400 text-xs truncate">{PROBABILITY_LABELS[prob]}</div>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map(sev => (
                        <button
                          key={sev}
                          onClick={() => setSelectedCell({ prob, sev })}
                          className={`
                            aspect-square rounded-lg flex items-center justify-center
                            font-bold text-lg transition-all transform hover:scale-105
                            ${getCellColor(prob, sev)} ${getCellTextColor(prob, sev)}
                            ${selectedCell?.prob === prob && selectedCell?.sev === sev
                              ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-800'
                              : ''}
                          `}
                        >
                          {prob * sev}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected cell info */}
        {selectedCell && (
          <div className="mt-6 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold">
                  რისკის დონე: {selectedCell.prob * selectedCell.sev}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  ალბათობა: {PROBABILITY_LABELS[selectedCell.prob]} ({selectedCell.prob}) ×
                  შედეგი: {SEVERITY_LABELS[selectedCell.sev]} ({selectedCell.sev})
                </p>
                <div className={`mt-2 inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  selectedCell.prob * selectedCell.sev >= 15 ? 'bg-red-500/20 text-red-400' :
                  selectedCell.prob * selectedCell.sev >= 9 ? 'bg-orange-500/20 text-orange-400' :
                  selectedCell.prob * selectedCell.sev >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {RISK_CATEGORY_LABELS[calculateRiskCategory(selectedCell.prob * selectedCell.sev)]}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">რისკის კატეგორიები და საჭირო ღონისძიებები</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-red-400 font-semibold">კრიტიკული (15-25)</span>
            </div>
            <p className="text-slate-300 text-sm">
              სამუშაო უნდა შეჩერდეს დაუყოვნებლივ. მიღებულ უნდა იქნეს ზომები რისკის შესამცირებლად.
            </p>
          </div>
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-orange-400 font-semibold">მაღალი (9-12)</span>
            </div>
            <p className="text-slate-300 text-sm">
              ღონისძიებების გატარება სავალდებულოა დაუყოვნებლივ, სამუშაოების შეჩერების გარეშე.
            </p>
          </div>
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-yellow-400 font-semibold">საშუალო (5-8)</span>
            </div>
            <p className="text-slate-300 text-sm">
              ღონისძიებების გატარება სავალდებულოა, მაგრამ არა დაუყოვნებლივ. შემუშავდეს რისკის შემცირების პროცედურები.
            </p>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-green-400 font-semibold">დაბალი (1-4)</span>
            </div>
            <p className="text-slate-300 text-sm">
              მისაღები რისკი. სამუშაოს შესრულების მონიტორინგი.
            </p>
          </div>
        </div>
      </div>

      {/* Formula */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">რისკის გაანგარიშების ფორმულა</h3>
        <div className="bg-slate-900/50 p-4 rounded-xl text-center">
          <span className="text-2xl font-mono text-amber-500">
            რისკი = ალბათობა × შედეგი (სიმძიმე)
          </span>
        </div>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-white font-medium mb-2">ალბათობის შკალა:</h4>
            <ul className="space-y-1 text-sm text-slate-400">
              {Object.entries(PROBABILITY_LABELS).map(([key, label]) => (
                <li key={key}><span className="text-white">{key}</span> - {label}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">შედეგის შკალა:</h4>
            <ul className="space-y-1 text-sm text-slate-400">
              {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                <li key={key}><span className="text-white">{key}</span> - {label}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
