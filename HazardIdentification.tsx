import { useState, useRef } from 'react';
import { Camera, Plus, Trash2, MapPin, AlertTriangle, Save, X, ChevronDown, ChevronRight, Check, Ban, Shield, Wrench, Users, HardHat, Sparkles, Loader2, Brain, Zap } from 'lucide-react';
import type { RiskAssessment, Hazard, HazardCategory, RiskLevel, ControlType } from '../types';
import { HAZARD_CATEGORIES, PROBABILITY_LABELS, SEVERITY_LABELS, CONTROL_TYPES, calculateRiskCategory } from '../types';
import { analyzeImageWithAI, type AIAnalysisResult } from '../services/aiAnalysis';

interface Props {
  onAdd: (assessment: RiskAssessment) => void;
}

interface ControlSelection {
  type: ControlType;
  content: string;
  notApplicable: boolean;
}

// კონტროლის ზომების მაგალითები თითოეული დონისთვის
const CONTROL_EXAMPLES: Record<ControlType, string[]> = {
  elimination: [
    'საფრთხის სრული აღმოფხვრა',
    'საშიში პროცესის შეწყვეტა',
    'საშიში მასალის გამოყენების შეწყვეტა',
    'საშიში აღჭურვილობის ამოღება',
    'სამუშაო ოპერაციის გაუქმება'
  ],
  substitution: [
    'ნაკლებად საშიში მასალით ჩანაცვლება',
    'ნაკლებად საშიში აღჭურვილობით ჩანაცვლება',
    'ნაკლებად საშიში პროცესით ჩანაცვლება',
    'ხელით სამუშაოს მექანიზაციით ჩანაცვლება',
    'საშიში ქიმიკატის უსაფრთხოთი ჩანაცვლება'
  ],
  engineering: [
    'დამცავი ღობე/ბარიერი',
    'ვენტილაციის სისტემა',
    'ხმაურის იზოლაცია',
    'მანქანის მცველი',
    'ავარიული გამორთვის ღილაკი',
    'ინტერლოკი',
    'ჩაკეტვა/მონიშვნა (LOTO)',
    'ავტომატური სენსორები'
  ],
  administrative: [
    'სამუშაო ინსტრუქციები',
    'სწავლება და ტრენინგი',
    'სამუშაო ნებართვის სისტემა',
    'როტაციული გრაფიკი',
    'გამაფრთხილებელი ნიშნები',
    'პერიოდული შემოწმება',
    'ზედამხედველობა',
    'შესვენებების გრაფიკი'
  ],
  ppe: [
    'დამცავი ჩაფხუტი',
    'დამცავი სათვალე',
    'ყურის დამცველი',
    'რესპირატორი/ნიღაბი',
    'დამცავი ხელთათმანები',
    'დამცავი ფეხსაცმელი',
    'ამრეკლავი ჟილეტი',
    'დამცავი სამოსი',
    'უსაფრთხოების აბზაცი'
  ]
};

const HIERARCHY_COLORS: Record<ControlType, { bg: string; border: string; text: string; icon: string }> = {
  elimination: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'text-emerald-500' },
  substitution: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', icon: 'text-teal-500' },
  engineering: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-500' },
  administrative: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-500' },
  ppe: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: 'text-orange-500' }
};

// კონტროლის ეფექტურობის კოეფიციენტი (რამდენით ამცირებს რისკს)
const CONTROL_EFFECTIVENESS: Record<ControlType, number> = {
  elimination: 0.9,  // 90% რისკის შემცირება
  substitution: 0.7,
  engineering: 0.5,
  administrative: 0.3,
  ppe: 0.2
};

const CONTROL_ICONS: Record<ControlType, React.ReactNode> = {
  elimination: <Ban className="w-5 h-5" />,
  substitution: <Shield className="w-5 h-5" />,
  engineering: <Wrench className="w-5 h-5" />,
  administrative: <Users className="w-5 h-5" />,
  ppe: <HardHat className="w-5 h-5" />
};

export function HazardIdentification({ onAdd }: Props) {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentHazard, setCurrentHazard] = useState<Partial<Hazard>>({});
  const [assessmentData, setAssessmentData] = useState({
    affectedPersons: '',
    damageType: '',
    existingControls: '',
    probability: 3,
    severity: 3,
    recommendations: '',
    responsiblePerson: '',
    deadline: '',
    reviewDate: ''
  });

  // კონტროლის იერარქიის სტეიტი
  const [controlSelections, setControlSelections] = useState<ControlSelection[]>(
    (['elimination', 'substitution', 'engineering', 'administrative', 'ppe'] as ControlType[]).map(type => ({
      type,
      content: '',
      notApplicable: false
    }))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [showAIPreview, setShowAIPreview] = useState(false);

  // AI Analysis Function
  const handleAIAnalysis = async () => {
    if (!currentHazard.photo) return;

    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const result = await analyzeImageWithAI(currentHazard.photo);
      setAiResult(result);
      setShowAIPreview(true);
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply AI Results to Form
  const applyAIResults = () => {
    if (!aiResult) return;

    // Update hazard data
    setCurrentHazard(prev => ({
      ...prev,
      name: aiResult.hazardName,
      description: aiResult.description,
      category: aiResult.category,
      location: aiResult.location,
    }));

    // Update assessment data
    setAssessmentData(prev => ({
      ...prev,
      affectedPersons: aiResult.affectedPersons,
      damageType: aiResult.damageType,
      existingControls: aiResult.existingControls,
      probability: aiResult.probability,
      severity: aiResult.severity,
      recommendations: aiResult.recommendations,
      responsiblePerson: aiResult.responsiblePerson,
      deadline: aiResult.deadline,
      reviewDate: aiResult.reviewPeriod,
    }));

    // Update control selections
    setControlSelections([
      { type: 'elimination', content: aiResult.controlMeasures.elimination, notApplicable: !aiResult.controlMeasures.elimination },
      { type: 'substitution', content: aiResult.controlMeasures.substitution, notApplicable: !aiResult.controlMeasures.substitution },
      { type: 'engineering', content: aiResult.controlMeasures.engineering, notApplicable: !aiResult.controlMeasures.engineering },
      { type: 'administrative', content: aiResult.controlMeasures.administrative, notApplicable: !aiResult.controlMeasures.administrative },
      { type: 'ppe', content: aiResult.controlMeasures.ppe, notApplicable: !aiResult.controlMeasures.ppe },
    ]);

    setShowAIPreview(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentHazard(prev => ({ ...prev, photo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateControlContent = (type: ControlType, content: string) => {
    setControlSelections(prev => prev.map(cs => {
      if (cs.type !== type) return cs;
      return { ...cs, content, notApplicable: false };
    }));
  };

  const setControlNotApplicable = (type: ControlType, notApplicable: boolean) => {
    setControlSelections(prev => prev.map(cs => {
      if (cs.type !== type) return cs;
      return { ...cs, notApplicable, content: notApplicable ? '' : cs.content };
    }));
  };

  // ნარჩენი რისკის გაანგარიშება კონტროლის ზომების მიხედვით
  // მნიშვნელოვანი: შედეგი/სიმძიმე (severity) არასოდეს არ იცვლება!
  // კონტროლის ზომები მხოლოდ ალბათობას ამცირებს
  const calculateResidualRisk = () => {
    let totalEffectiveness = 0;
    controlSelections.forEach(cs => {
      if (!cs.notApplicable && cs.content.trim().length > 0) {
        totalEffectiveness += CONTROL_EFFECTIVENESS[cs.type];
      }
    });

    // მაქსიმუმ 80% ალბათობის შემცირება (ალბათობა მინიმუმ 1 რჩება)
    totalEffectiveness = Math.min(totalEffectiveness, 0.80);

    // შედეგი/სიმძიმე რჩება უცვლელი!
    const residualSeverity = assessmentData.severity;

    // მხოლოდ ალბათობა მცირდება კონტროლის ზომების ეფექტურობის მიხედვით
    const reducedProbability = assessmentData.probability * (1 - totalEffectiveness);
    const residualProbability = Math.max(1, Math.round(reducedProbability));

    return {
      probability: residualProbability,
      severity: residualSeverity, // შედეგი უცვლელია!
      rating: residualProbability * residualSeverity
    };
  };

  const getAllSelectedControls = (): string[] => {
    return controlSelections
      .filter(cs => !cs.notApplicable && cs.content.trim().length > 0)
      .map(cs => `${CONTROL_TYPES[cs.type].label}: ${cs.content.trim()}`);
  };

  const handleSaveHazard = () => {
    if (!currentHazard.name || !currentHazard.description) return;

    const hazard: Hazard = {
      id: Date.now().toString(),
      name: currentHazard.name,
      description: currentHazard.description,
      location: currentHazard.location || '',
      photo: currentHazard.photo,
      category: currentHazard.category || 'physical'
    };

    const initialRisk: RiskLevel = {
      probability: assessmentData.probability,
      severity: assessmentData.severity,
      rating: assessmentData.probability * assessmentData.severity,
      category: calculateRiskCategory(assessmentData.probability * assessmentData.severity)
    };

    const residualCalc = calculateResidualRisk();
    const residualRisk: RiskLevel = {
      probability: residualCalc.probability,
      severity: residualCalc.severity,
      rating: residualCalc.rating,
      category: calculateRiskCategory(residualCalc.rating)
    };

    const assessment: RiskAssessment = {
      id: Date.now().toString(),
      hazard,
      affectedPersons: assessmentData.affectedPersons.split(',').map(s => s.trim()).filter(Boolean),
      damageType: assessmentData.damageType,
      existingControls: assessmentData.existingControls.split(',').map(s => s.trim()).filter(Boolean),
      initialRisk,
      additionalControls: getAllSelectedControls(),
      residualRisk,
      responsiblePerson: assessmentData.responsiblePerson,
      deadline: assessmentData.deadline,
      reviewDate: assessmentData.reviewDate,
      createdAt: new Date().toISOString()
    };

    setHazards(prev => [...prev, hazard]);
    onAdd(assessment);
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setCurrentStep(1);
    setCurrentHazard({});
    setAssessmentData({
      affectedPersons: '',
      damageType: '',
      existingControls: '',
      probability: 3,
      severity: 3,
      recommendations: '',
      responsiblePerson: '',
      deadline: '',
      reviewDate: ''
    });
    setControlSelections(
      (['elimination', 'substitution', 'engineering', 'administrative', 'ppe'] as ControlType[]).map(type => ({
        type,
        content: '',
        notApplicable: false
      }))
    );
  };

  const getRiskColor = (rating: number) => {
    if (rating >= 15) return 'border-red-500 bg-red-500/10 text-red-400';
    if (rating >= 9) return 'border-orange-500 bg-orange-500/10 text-orange-400';
    if (rating >= 5) return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
    return 'border-green-500 bg-green-500/10 text-green-400';
  };

  const getRiskBgColor = (rating: number) => {
    if (rating >= 15) return 'bg-red-600';
    if (rating >= 9) return 'bg-orange-500';
    if (rating >= 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const canProceedToStep2 = currentHazard.name && currentHazard.description;
  const canProceedToStep3 = canProceedToStep2 && assessmentData.probability && assessmentData.severity;

  const residualPreview = calculateResidualRisk();
  const initialRating = assessmentData.probability * assessmentData.severity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
          საფრთხეების იდენტიფიცირება
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all"
        >
          <Plus className="w-5 h-5" />
          ახალი საფრთხე
        </button>
      </div>

      {/* Multi-Step Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            {/* Header with Steps */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep === step
                        ? 'bg-amber-500 text-white'
                        : currentStep > step
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700 text-slate-400'
                    }`}>
                      {currentStep > step ? <Check className="w-4 h-4" /> : step}
                    </div>
                    <span className={`text-sm hidden sm:block ${currentStep === step ? 'text-white' : 'text-slate-500'}`}>
                      {step === 1 ? 'საფრთხე' : step === 2 ? 'რისკი' : 'კონტროლი'}
                    </span>
                    {step < 3 && <div className="w-8 h-0.5 bg-slate-700" />}
                  </div>
                ))}
              </div>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step 1: Hazard Identification */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">ნაბიჯი 1: საფრთხის იდენტიფიცირება</h3>

                {/* Photo Upload with AI Analysis */}
                <div>
                  <label className="block text-slate-400 text-sm mb-2">ფოტო/ვიდეო მასალა</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-amber-500 transition-colors"
                  >
                    {currentHazard.photo ? (
                      <img src={currentHazard.photo} alt="Hazard" className="max-h-48 mx-auto rounded-lg" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Camera className="w-12 h-12" />
                        <span>დააწკაპუნეთ ფოტოს ასატვირთად</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {/* AI Analysis Button */}
                  {currentHazard.photo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAIAnalysis();
                      }}
                      disabled={isAnalyzing}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          AI ანალიზი მიმდინარეობს...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <Brain className="w-5 h-5" />
                          AI ანალიზი - ავტომატური შევსება
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* AI Analysis Preview Modal */}
                {showAIPreview && aiResult && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-violet-500/50 shadow-xl shadow-violet-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-violet-500/20 rounded-lg">
                            <Brain className="w-6 h-6 text-violet-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white">AI ანალიზის შედეგები</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                            სანდოობა: {aiResult.confidence}%
                          </span>
                          <button onClick={() => setShowAIPreview(false)} className="text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 text-sm">
                        {/* Hazard Info */}
                        <div className="p-4 bg-slate-700/50 rounded-xl">
                          <h4 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> საფრთხე
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div><span className="text-slate-400">დასახელება:</span> <span className="text-white">{aiResult.hazardName}</span></div>
                            <div><span className="text-slate-400">კატეგორია:</span> <span className="text-white">{HAZARD_CATEGORIES[aiResult.category]}</span></div>
                          </div>
                          <div className="mt-2">
                            <span className="text-slate-400">აღწერა:</span>
                            <p className="text-white mt-1">{aiResult.description}</p>
                          </div>
                        </div>

                        {/* Risk Assessment */}
                        <div className="p-4 bg-slate-700/50 rounded-xl">
                          <h4 className="text-red-400 font-semibold mb-2">რისკის შეფასება</h4>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{aiResult.probability}</div>
                              <div className="text-xs text-slate-400">ალბათობა</div>
                            </div>
                            <div className="text-slate-500">×</div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{aiResult.severity}</div>
                              <div className="text-xs text-slate-400">სიმძიმე</div>
                            </div>
                            <div className="text-slate-500">=</div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                aiResult.probability * aiResult.severity >= 15 ? 'text-red-400' :
                                aiResult.probability * aiResult.severity >= 9 ? 'text-orange-400' :
                                aiResult.probability * aiResult.severity >= 5 ? 'text-yellow-400' : 'text-green-400'
                              }`}>{aiResult.probability * aiResult.severity}</div>
                              <div className="text-xs text-slate-400">რეიტინგი</div>
                            </div>
                          </div>
                        </div>

                        {/* Control Measures Preview */}
                        <div className="p-4 bg-slate-700/50 rounded-xl">
                          <h4 className="text-blue-400 font-semibold mb-2">კონტროლის ზომები</h4>
                          <div className="space-y-2 text-xs">
                            {aiResult.controlMeasures.elimination && (
                              <div><span className="text-emerald-400">აღმოფხვრა:</span> <span className="text-white">{aiResult.controlMeasures.elimination.substring(0, 100)}...</span></div>
                            )}
                            {aiResult.controlMeasures.engineering && (
                              <div><span className="text-blue-400">საინჟინრო:</span> <span className="text-white">{aiResult.controlMeasures.engineering.substring(0, 100)}...</span></div>
                            )}
                            {aiResult.controlMeasures.ppe && (
                              <div><span className="text-orange-400">PPE:</span> <span className="text-white">{aiResult.controlMeasures.ppe.substring(0, 100)}...</span></div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => setShowAIPreview(false)}
                          className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                        >
                          გაუქმება
                        </button>
                        <button
                          onClick={applyAIResults}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                        >
                          <Check className="w-5 h-5" />
                          გამოყენება - შეავსე ყველა ველი
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">საფრთხის დასახელება *</label>
                    <input
                      type="text"
                      value={currentHazard.name || ''}
                      onChange={e => setCurrentHazard(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      placeholder="მაგ: დაუცველი ელექტრო კაბელი"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">კატეგორია</label>
                    <select
                      value={currentHazard.category || 'physical'}
                      onChange={e => setCurrentHazard(prev => ({ ...prev, category: e.target.value as HazardCategory }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    >
                      {Object.entries(HAZARD_CATEGORIES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-2">აღწერა *</label>
                  <textarea
                    value={currentHazard.description || ''}
                    onChange={e => setCurrentHazard(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500 min-h-[80px]"
                    placeholder="საფრთხის დეტალური აღწერა..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">ადგილმდებარეობა</label>
                    <input
                      type="text"
                      value={currentHazard.location || ''}
                      onChange={e => setCurrentHazard(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      placeholder="მაგ: საწარმოო დარბაზი"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">დაშავების ტიპი</label>
                    <input
                      type="text"
                      value={assessmentData.damageType}
                      onChange={e => setAssessmentData(prev => ({ ...prev, damageType: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      placeholder="მაგ: ელექტრო შოკი"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-2">პირთა წრე (მძიმით გამოყოფილი)</label>
                  <input
                    type="text"
                    value={assessmentData.affectedPersons}
                    onChange={e => setAssessmentData(prev => ({ ...prev, affectedPersons: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    placeholder="მაგ: მუშაკი, კონტრაქტორი, ვიზიტორი"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-2">არსებული კონტროლის ზომები</label>
                  <input
                    type="text"
                    value={assessmentData.existingControls}
                    onChange={e => setAssessmentData(prev => ({ ...prev, existingControls: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    placeholder="მაგ: გამაფრთხილებელი ნიშანი, იზოლაცია"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    შემდეგი: რისკის შეფასება
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Risk Assessment */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">ნაბიჯი 2: საწყისი რისკის შეფასება</h3>

                <div className={`p-6 rounded-xl border-2 ${getRiskColor(initialRating)}`}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-300 text-sm mb-3">ალბათობა (ა)</label>
                      <div className="space-y-2">
                        {Object.entries(PROBABILITY_LABELS).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                            <input
                              type="radio"
                              name="probability"
                              value={key}
                              checked={assessmentData.probability === Number(key)}
                              onChange={() => setAssessmentData(prev => ({ ...prev, probability: Number(key) }))}
                              className="w-4 h-4 text-amber-500"
                            />
                            <span className="text-white font-medium">{key}</span>
                            <span className="text-slate-400 text-sm">- {label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm mb-3">შედეგი/სიმძიმე (შ)</label>
                      <div className="space-y-2">
                        {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                            <input
                              type="radio"
                              name="severity"
                              value={key}
                              checked={assessmentData.severity === Number(key)}
                              onChange={() => setAssessmentData(prev => ({ ...prev, severity: Number(key) }))}
                              className="w-4 h-4 text-amber-500"
                            />
                            <span className="text-white font-medium">{key}</span>
                            <span className="text-slate-400 text-sm">- {label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-slate-900/50 rounded-xl text-center">
                    <div className="text-slate-400 mb-1">საწყისი რისკის რეიტინგი</div>
                    <div className="text-4xl font-bold text-white">{initialRating}</div>
                    <div className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-medium ${getRiskBgColor(initialRating)} text-white`}>
                      {initialRating >= 15 ? 'კრიტიკული' : initialRating >= 9 ? 'მაღალი' : initialRating >= 5 ? 'საშუალო' : 'დაბალი'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                  >
                    უკან
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToStep3}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    შემდეგი: კონტროლის ზომები
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Control Hierarchy */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-2">ნაბიჯი 3: დამატებითი კონტროლის ზომები</h3>
                <p className="text-slate-400 text-sm mb-4">შეავსეთ კონტროლის ზომები იერარქიის მიხედვით</p>

                {/* Control Hierarchy Text Areas */}
                <div className="space-y-4">
                  {controlSelections.map((cs, index) => {
                    const colors = HIERARCHY_COLORS[cs.type];
                    const examples = CONTROL_EXAMPLES[cs.type];

                    return (
                      <div key={cs.type} className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg bg-slate-800/50 ${colors.icon}`}>
                            {CONTROL_ICONS[cs.type]}
                          </div>
                          <div className="flex-1">
                            <span className="text-white font-semibold">{index + 1}. {CONTROL_TYPES[cs.type].label}</span>
                            <span className={`ml-2 text-xs ${colors.text}`}>
                              (ეფექტურობა: {(CONTROL_EFFECTIVENESS[cs.type] * 100).toFixed(0)}%)
                            </span>
                          </div>
                          <label className="flex items-center gap-2 text-slate-400 text-sm">
                            <input
                              type="checkbox"
                              checked={cs.notApplicable}
                              onChange={e => setControlNotApplicable(cs.type, e.target.checked)}
                              className="w-4 h-4 rounded"
                            />
                            არ შეეხება
                          </label>
                        </div>

                        {!cs.notApplicable && (
                          <>
                            <textarea
                              value={cs.content}
                              onChange={e => updateControlContent(cs.type, e.target.value)}
                              placeholder={`მაგ: ${examples.slice(0, 2).join('; ')}...`}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500 min-h-[80px] text-sm"
                            />
                            <div className="mt-2 text-xs text-slate-500">
                              მინიშნება: {examples.slice(0, 3).join(' • ')}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ნარჩენი რისკი - Residual Risk Table */}
                <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                  <h4 className="text-white font-semibold mb-4">ნარჩენი რისკი</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-slate-400 text-xs mb-2">ალბათობა (ა)</div>
                      <div className={`text-2xl font-bold ${getRiskColor(residualPreview.rating).split(' ')[2]}`}>
                        {residualPreview.probability}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 text-xs mb-2">შედეგი (შ)</div>
                      <div className={`text-2xl font-bold ${getRiskColor(residualPreview.rating).split(' ')[2]}`}>
                        {residualPreview.severity}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 text-xs mb-2">რეიტინგი (რ)</div>
                      <div className={`text-2xl font-bold ${getRiskColor(residualPreview.rating).split(' ')[2]}`}>
                        {residualPreview.rating}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 text-xs mb-2">შემცირება</div>
                      <div className="text-2xl font-bold text-green-400">
                        -{initialRating - residualPreview.rating}
                      </div>
                    </div>
                  </div>
                  <div className={`mt-3 p-2 rounded-lg text-center ${getRiskBgColor(residualPreview.rating)} text-white text-sm font-medium`}>
                    {residualPreview.rating >= 15 ? 'კრიტიკული' : residualPreview.rating >= 9 ? 'მაღალი' : residualPreview.rating >= 5 ? 'საშუალო' : 'დაბალი'} რისკი
                  </div>
                </div>

                {/* გასატარებელი ზომები / რეაგირება */}
                <div className="mt-4">
                  <label className="block text-slate-400 text-sm mb-2">გასატარებელი ზომები / რეაგირება</label>
                  <textarea
                    value={assessmentData.recommendations}
                    onChange={e => setAssessmentData(prev => ({ ...prev, recommendations: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500 min-h-[100px]"
                    placeholder="მაგ: 1. ელექტრო მოწყობილობების რეგულარული შემოწმება; 2. მონიტორინგის განხორციელება..."
                  />
                </div>

                {/* შესრულებაზე პასუხისმგებელი პირი / ვადა */}
                <div className="mt-4">
                  <label className="block text-slate-400 text-sm mb-2">შესრულებაზე პასუხისმგებელი პირი / ვადა</label>
                  <div className="grid grid-cols-2 gap-4">
                    <textarea
                      value={assessmentData.responsiblePerson}
                      onChange={e => setAssessmentData(prev => ({ ...prev, responsiblePerson: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500 min-h-[80px]"
                      placeholder="მაგ: 1. დირექტორი&#10;2. შ/უ სპეციალისტი"
                    />
                    <div>
                      <input
                        type="text"
                        value={assessmentData.deadline}
                        onChange={e => setAssessmentData(prev => ({ ...prev, deadline: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500 mb-2"
                        placeholder="მაგ: 1 თვე, დაუყოვნებლივ"
                      />
                      <input
                        type="date"
                        value={assessmentData.reviewDate}
                        onChange={e => setAssessmentData(prev => ({ ...prev, reviewDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      />
                      <div className="text-xs text-slate-500 mt-1">კონკრეტული თარიღი</div>
                    </div>
                  </div>
                </div>

                {/* გადახედვის სავარაუდო თარიღი */}
                <div className="mt-4">
                  <label className="block text-slate-400 text-sm mb-2">გადახედვის სავარაუდო თარიღი / პერიოდი</label>
                  <input
                    type="text"
                    value={assessmentData.reviewDate}
                    onChange={e => setAssessmentData(prev => ({ ...prev, reviewDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    placeholder="მაგ: შემდგომი გადახედვის პერიოდი 1 თვე / 28.03.2026"
                  />
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                  >
                    უკან
                  </button>
                  <button
                    onClick={handleSaveHazard}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                  >
                    <Save className="w-5 h-5" />
                    შენახვა
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hazards List */}
      {hazards.length === 0 ? (
        <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
          <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl text-slate-400 mb-2">საფრთხეები არ არის დამატებული</h3>
          <p className="text-slate-500">დაიწყეთ საფრთხეების იდენტიფიცირება "ახალი საფრთხე" ღილაკით</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hazards.map(hazard => (
            <div key={hazard.id} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden hover:border-amber-500/50 transition-colors">
              {hazard.photo && (
                <img src={hazard.photo} alt={hazard.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">
                      {HAZARD_CATEGORIES[hazard.category]}
                    </span>
                    <h4 className="text-white font-semibold mt-2">{hazard.name}</h4>
                  </div>
                  <button
                    onClick={() => setHazards(prev => prev.filter(h => h.id !== hazard.id))}
                    className="text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-slate-400 text-sm mt-2 line-clamp-2">{hazard.description}</p>
                {hazard.location && (
                  <div className="flex items-center gap-1 mt-3 text-slate-500 text-sm">
                    <MapPin className="w-4 h-4" />
                    {hazard.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
