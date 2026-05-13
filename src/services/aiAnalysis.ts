// AI Vision Analysis Service for Risk Assessment
// Handles both photo-based and video frame analysis

export interface AIAnalysisResult {
  hazardName: string;
  description: string;
  category: 'physical' | 'chemical' | 'biological' | 'ergonomic' | 'psychological' | 'electrical' | 'fire' | 'mechanical';
  location: string;
  affectedPersons: string;
  damageType: string;
  existingControls: string;
  probability: number;
  severity: number;
  controlMeasures: {
    elimination: string;
    substitution: string;
    engineering: string;
    administrative: string;
    ppe: string;
  };
  recommendations: string;
  responsiblePerson: string;
  deadline: string;
  reviewPeriod: string;
  confidence: number;
}

const API_CONFIG = {
  backendEndpoint: import.meta.env.VITE_API_ENDPOINT || '/api/analyze-image',
  timeout: 60000,
};

const ANALYSIS_PROMPT = `შენ ხარ შრომის უსაფრთხოების ექსპერტი. გაანალიზე ეს სურათი და მომეცი რისკის შეფასების სრული ინფორმაცია.

დააბრუნე მხოლოდ JSON ობიექტი (არანაირი დამატებითი ტექსტი) შემდეგი სტრუქტურით:

{
  "hazardName": "საფრთხის მოკლე დასახელება ქართულად",
  "description": "დეტალური აღწერა რა საფრთხეა სურათზე, ქართულად",
  "category": "physical/chemical/biological/ergonomic/psychological/electrical/fire/mechanical",
  "location": "სავარაუდო ადგილმდებარეობა",
  "affectedPersons": "ვინ შეიძლება დაშავდეს (მძიმით გამოყოფილი)",
  "damageType": "რა ტიპის დაშავება/დაზიანება შეიძლება მოხდეს",
  "existingControls": "რა კონტროლის ზომები ჩანს უკვე (თუ არაფერი, დაწერე 'არ არის')",
  "probability": "1-5 რიცხვი (1=იშვიათი, 5=თითქმის გარდაუვალი)",
  "severity": "1-5 რიცხვი (1=უმნიშვნელო, 5=კატასტროფული/სიკვდილი)",
  "controlMeasures": {
    "elimination": "როგორ შეიძლება საფრთხის სრულად აღმოფხვრა, ქართულად",
    "substitution": "ნაკლებად საშიშით ჩანაცვლების გზები, ქართულად",
    "engineering": "საინჟინრო კონტროლის ზომები (ბარიერები, ვენტილაცია, იზოლაცია), ქართულად",
    "administrative": "ადმინისტრაციული ზომები (ტრენინგი, პროცედურები, ნიშნები), ქართულად",
    "ppe": "პერსონალური დამცავი საშუალებები, ქართულად"
  },
  "recommendations": "გასატარებელი ზომები/რეაგირება (დანომრილი სია), ქართულად",
  "responsiblePerson": "ვინ უნდა იყოს პასუხისმგებელი",
  "deadline": "რეკომენდებული ვადა (მაგ: დაუყოვნებლივ, 1 კვირა, 1 თვე)",
  "reviewPeriod": "გადახედვის პერიოდი",
  "confidence": "70-95 რიცხვი"
}`;

const VIDEO_FRAME_PROMPT = `შენ ხარ შრომის უსაფრთხოების ექსპერტი. ეს კადრი გადაღებულია ვიდეო ანალიზის სისტემის მიერ სამუშაო ადგილზე.
გაანალიზე კადრი და გამოავლინე ნებისმიერი საფრთხე ან სახიფათო სიტუაცია.
თუ კადრზე მძიმე საფრთხე არ ჩანს, მიუთითე ყველაზე სავარაუდო ლატენტური რისკი.

დააბრუნე მხოლოდ JSON ობიექტი შემდეგი სტრუქტურით:

{
  "hazardName": "საფრთხის მოკლე დასახელება ქართულად",
  "description": "დეტალური აღწერა, ქართულად",
  "category": "physical/chemical/biological/ergonomic/psychological/electrical/fire/mechanical",
  "location": "სამუშაო ადგილის ზონა (კადრიდან)",
  "affectedPersons": "ვინ შეიძლება დაშავდეს",
  "damageType": "შესაძლო ტრავმის ტიპი",
  "existingControls": "კადრზე ჩანს თუ არა კონტროლი",
  "probability": "1-5",
  "severity": "1-5",
  "controlMeasures": {
    "elimination": "საფრთხის სრული აღმოფხვრა",
    "substitution": "ნაკლებად საშიში ალტერნატივა",
    "engineering": "საინჟინრო ზომები",
    "administrative": "ადმინისტრაციული ზომები",
    "ppe": "პირადი დამცავი საშუალებები"
  },
  "recommendations": "სასწრაფო ქმედებები ქართულად",
  "responsiblePerson": "პასუხისმგებელი პირი",
  "deadline": "ვადა",
  "reviewPeriod": "გადახედვის სიხშირე",
  "confidence": "60-95"
}`;

export async function analyzeImageWithAI(imageBase64: string): Promise<AIAnalysisResult> {
  try {
    const result = await tryBackendAPI(imageBase64, ANALYSIS_PROMPT);
    if (result) return validateAndNormalizeResult(result);
  } catch {
    console.log('Backend API not available, running in demo mode');
  }

  return generateIntelligentDemoAnalysis(imageBase64);
}

export async function analyzeVideoFrame(frameBase64: string): Promise<AIAnalysisResult> {
  // Try dedicated video frame endpoint first
  try {
    const result = await tryBackendAPI(frameBase64, VIDEO_FRAME_PROMPT, '/api/analyze-video-frame');
    if (result) return validateAndNormalizeResult(result);
  } catch {
    // fall through
  }

  // Fall back to standard image endpoint with video prompt
  try {
    const result = await tryBackendAPI(frameBase64, VIDEO_FRAME_PROMPT);
    if (result) return validateAndNormalizeResult(result);
  } catch {
    console.log('Backend not available for video frame, running in demo mode');
  }

  return generateIntelligentDemoAnalysis(frameBase64);
}

async function tryBackendAPI(imageBase64: string, prompt?: string, endpoint?: string): Promise<any> {
  const url = endpoint || API_CONFIG.backendEndpoint;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, prompt }),
    signal: AbortSignal.timeout(API_CONFIG.timeout),
  });

  if (!response.ok) throw new Error(`Backend API error: ${response.status}`);
  return response.json();
}


function validateAndNormalizeResult(result: any): AIAnalysisResult {
  return {
    hazardName: result.hazardName || 'უცნობი საფრთხე',
    description: result.description || '',
    category: normalizeCategory(result.category),
    location: result.location || '',
    affectedPersons: result.affectedPersons || '',
    damageType: result.damageType || '',
    existingControls: result.existingControls || '',
    probability: Math.min(5, Math.max(1, parseInt(result.probability) || 3)),
    severity: Math.min(5, Math.max(1, parseInt(result.severity) || 3)),
    controlMeasures: {
      elimination: result.controlMeasures?.elimination || '',
      substitution: result.controlMeasures?.substitution || '',
      engineering: result.controlMeasures?.engineering || '',
      administrative: result.controlMeasures?.administrative || '',
      ppe: result.controlMeasures?.ppe || '',
    },
    recommendations: result.recommendations || '',
    responsiblePerson: result.responsiblePerson || '',
    deadline: result.deadline || '',
    reviewPeriod: result.reviewPeriod || '',
    confidence: Math.min(100, Math.max(0, parseInt(result.confidence) || 75)),
  };
}

function normalizeCategory(category: string): AIAnalysisResult['category'] {
  const valid: AIAnalysisResult['category'][] = [
    'physical', 'chemical', 'biological', 'ergonomic', 'psychological', 'electrical', 'fire', 'mechanical'
  ];
  const normalized = category?.toLowerCase() || 'physical';
  return valid.includes(normalized as any) ? normalized as AIAnalysisResult['category'] : 'physical';
}

function generateIntelligentDemoAnalysis(imageBase64: string): AIAnalysisResult {
  const seed = imageBase64.length % 8;
  const scenarios: AIAnalysisResult[] = [
    {
      hazardName: '⚠️ DEMO: ელექტრო საფრთხე',
      description: 'ეს არის DEMO რეჟიმი. რეალური AI ანალიზისთვის საჭიროა ANTHROPIC_API_KEY კონფიგურაცია სერვერზე.',
      category: 'electrical',
      location: 'სამუშაო სივრცე',
      affectedPersons: 'ელექტრიკოსი, ტექნიკური პერსონალი',
      damageType: 'ელექტრო შოკი, დამწვრობა',
      existingControls: 'DEMO',
      probability: 3,
      severity: 4,
      controlMeasures: {
        elimination: 'DEMO: საფრთხის წყაროს აღმოფხვრა',
        substitution: 'DEMO: უსაფრთხო ალტერნატივა',
        engineering: 'DEMO: LOTO სისტემა',
        administrative: 'DEMO: ტრენინგი',
        ppe: 'DEMO: დიელექტრიკული ხელთათმანები',
      },
      recommendations: '⚠️ DEMO - დააყენეთ ANTHROPIC_API_KEY სერვერზე და გაუშვით backend',
      responsiblePerson: 'შ/უ სპეციალისტი',
      deadline: '1 კვირა',
      reviewPeriod: 'ყოველთვიური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: სიმაღლეზე მუშაობა',
      description: 'DEMO - სიმაღლის ზონა.',
      category: 'physical',
      location: 'სამშენებლო უბანი',
      affectedPersons: 'მშენებელი, ტექნიკოსი',
      damageType: 'დაცემა, მოტეხილობა',
      existingControls: 'DEMO',
      probability: 4,
      severity: 5,
      controlMeasures: {
        elimination: 'DEMO: მიწის დონე',
        substitution: 'DEMO: მექანიზირებული პლატფორმა',
        engineering: 'DEMO: მოაჯირი, ბადე',
        administrative: 'DEMO: ნებართვა',
        ppe: 'DEMO: აბზაცი',
      },
      recommendations: '⚠️ DEMO',
      responsiblePerson: 'უბნის მენეჯერი',
      deadline: 'მუშაობამდე',
      reviewPeriod: 'ყოველდღე',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: ქიმიური საფრთხე',
      description: 'DEMO.',
      category: 'chemical',
      location: 'ლაბორატორია',
      affectedPersons: 'ლაბორანტი',
      damageType: 'მოწამვლა',
      existingControls: 'DEMO',
      probability: 3,
      severity: 4,
      controlMeasures: {
        elimination: 'DEMO',
        substitution: 'DEMO',
        engineering: 'DEMO: ვენტილაცია',
        administrative: 'DEMO',
        ppe: 'DEMO: რესპირატორი',
      },
      recommendations: '⚠️ DEMO',
      responsiblePerson: 'ქიმ. უსაფრთხოების ოფიცერი',
      deadline: '1 კვირა',
      reviewPeriod: 'კვარტალური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: მექანიკური საფრთხე',
      description: 'DEMO.',
      category: 'mechanical',
      location: 'საწარმოო დარბაზი',
      affectedPersons: 'ოპერატორი',
      damageType: 'მოჭრა',
      existingControls: 'DEMO',
      probability: 3,
      severity: 4,
      controlMeasures: {
        elimination: 'DEMO',
        substitution: 'DEMO',
        engineering: 'DEMO: ინტერლოკი',
        administrative: 'DEMO',
        ppe: 'DEMO: ხელთათმანები',
      },
      recommendations: '⚠️ DEMO',
      responsiblePerson: 'წარმოების მენეჯერი',
      deadline: '2 კვირა',
      reviewPeriod: 'თვიური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: ხანძრის საფრთხე',
      description: 'DEMO.',
      category: 'fire',
      location: 'შენობა',
      affectedPersons: 'ყველა',
      damageType: 'დამწვრობა',
      existingControls: 'DEMO',
      probability: 2,
      severity: 5,
      controlMeasures: {
        elimination: 'DEMO',
        substitution: 'DEMO',
        engineering: 'DEMO: სპრინკლერი',
        administrative: 'DEMO: ევაკუაცია',
        ppe: 'DEMO: ცეცხლმაქრი',
      },
      recommendations: '⚠️ DEMO',
      responsiblePerson: 'ხანძარსაწინააღმდეგო ოფიცერი',
      deadline: 'დაუყოვნებლივ',
      reviewPeriod: 'კვარტალური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: ერგონომიული საფრთხე',
      description: 'DEMO.',
      category: 'ergonomic',
      location: 'ოფისი',
      affectedPersons: 'მუშაკი',
      damageType: 'ზურგის ტრავმა',
      existingControls: 'DEMO',
      probability: 4,
      severity: 3,
      controlMeasures: {
        elimination: 'DEMO',
        substitution: 'DEMO: მექანიზაცია',
        engineering: 'DEMO: რეგულირებადი მაგიდა',
        administrative: 'DEMO',
        ppe: 'DEMO: სარტყელი',
      },
      recommendations: '⚠️ DEMO',
      responsiblePerson: 'შ/უ სპეციალისტი',
      deadline: '2 კვირა',
      reviewPeriod: 'თვიური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: ბიოლოგიური საფრთხე',
      description: 'DEMO.',
      category: 'biological',
      location: 'სამედიცინო',
      affectedPersons: 'სამედ. პერსონალი',
      damageType: 'ინფექცია',
      existingControls: 'DEMO',
      probability: 3,
      severity: 4,
      controlMeasures: {
        elimination: 'DEMO',
        substitution: 'DEMO',
        engineering: 'DEMO: იზოლატორი',
        administrative: 'DEMO: ვაქცინაცია',
        ppe: 'DEMO: ნიღაბი',
      },
      recommendations: '⚠️ DEMO',
      responsiblePerson: 'ინფ. კონტროლის ოფიცერი',
      deadline: '1 კვირა',
      reviewPeriod: 'თვიური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: ფსიქოლოგიური საფრთხე',
      description: 'DEMO.',
      category: 'psychological',
      location: 'სამუშაო ადგილი',
      affectedPersons: 'ყველა',
      damageType: 'სტრესი',
      existingControls: 'DEMO',
      probability: 3,
      severity: 3,
      controlMeasures: {
        elimination: 'DEMO',
        substitution: 'DEMO',
        engineering: 'DEMO: ხმაურის იზოლაცია',
        administrative: 'DEMO: მხარდაჭერა',
        ppe: 'DEMO: ყურის დამცველი',
      },
      recommendations: '⚠️ DEMO',
      responsiblePerson: 'HR მენეჯერი',
      deadline: '1 თვე',
      reviewPeriod: 'კვარტალური',
      confidence: 50,
    },
  ];
  return scenarios[seed] || scenarios[0];
}

export async function checkAIServiceAvailability(): Promise<{
  backendAvailable: boolean;
  apiKeyConfigured: boolean;
}> {
  let backendAvailable = false;
  const apiKeyConfigured = false;

  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const data = await response.json();
      backendAvailable = true;
      return { backendAvailable, apiKeyConfigured: apiKeyConfigured || data.hasApiKey };
    }
  } catch {
    backendAvailable = false;
  }

  return { backendAvailable, apiKeyConfigured };
}
