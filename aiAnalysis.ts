// AI Vision Analysis Service for Risk Assessment
// This service analyzes uploaded images and returns structured risk assessment data

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

// API Configuration - can be overridden via environment variables
const API_CONFIG = {
  // Backend API endpoint (if running separate backend server)
  backendEndpoint: import.meta.env.VITE_API_ENDPOINT || '/api/analyze-image',
  // OpenAI API key for direct client-side calls (fallback)
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  timeout: 60000, // 60 seconds for AI analysis
};

// Georgian-specific hazard analysis prompt
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

/**
 * Analyze an image using AI Vision and return risk assessment data
 */
export async function analyzeImageWithAI(imageBase64: string): Promise<AIAnalysisResult> {
  // Try backend API first
  try {
    const backendResult = await tryBackendAPI(imageBase64);
    if (backendResult) {
      return validateAndNormalizeResult(backendResult);
    }
  } catch (error) {
    console.log('Backend API not available, trying direct OpenAI call');
  }

  // Try direct OpenAI API call if API key is configured
  if (API_CONFIG.openaiApiKey) {
    try {
      const openaiResult = await callOpenAIDirectly(imageBase64);
      return validateAndNormalizeResult(openaiResult);
    } catch (error) {
      console.error('OpenAI API call failed:', error);
    }
  }

  // Fallback to intelligent demo analysis
  console.log('Using intelligent demo analysis');
  return generateIntelligentDemoAnalysis(imageBase64);
}

/**
 * Try to call backend API
 */
async function tryBackendAPI(imageBase64: string): Promise<any> {
  const response = await fetch(API_CONFIG.backendEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageBase64 }),
    signal: AbortSignal.timeout(API_CONFIG.timeout),
  });

  if (!response.ok) {
    throw new Error(`Backend API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Call OpenAI Vision API directly from client
 */
async function callOpenAIDirectly(imageBase64: string): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_CONFIG.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: ANALYSIS_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(API_CONFIG.timeout),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenAI');
  }

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from OpenAI response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Validate and normalize AI response
 */
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

/**
 * Normalize category to valid type
 */
function normalizeCategory(category: string): AIAnalysisResult['category'] {
  const validCategories: AIAnalysisResult['category'][] = [
    'physical', 'chemical', 'biological', 'ergonomic', 'psychological', 'electrical', 'fire', 'mechanical'
  ];

  const normalized = category?.toLowerCase() || 'physical';
  return validCategories.includes(normalized as any) ? normalized as AIAnalysisResult['category'] : 'physical';
}

/**
 * Generate intelligent demo analysis with message about API configuration
 * This provides useful placeholder data while informing user about real AI setup
 */
function generateIntelligentDemoAnalysis(imageBase64: string): AIAnalysisResult {
  // Use image characteristics to vary the demo response
  const imageSize = imageBase64.length;
  const seed = (imageSize % 8);

  // Different demo scenarios
  const scenarios: AIAnalysisResult[] = [
    {
      hazardName: '⚠️ DEMO: ელექტრო საფრთხე',
      description: 'ეს არის DEMO რეჟიმი. რეალური AI ანალიზისთვის საჭიროა OpenAI API Key-ის კონფიგურაცია. \n\nდემო აღწერა: გამოვლინდა ელექტრო მოწყობილობა რომელიც მოითხოვს შემოწმებას.',
      category: 'electrical',
      location: 'სამუშაო სივრცე',
      affectedPersons: 'ელექტრიკოსი, ტექნიკური პერსონალი, მუშაკები',
      damageType: 'ელექტრო შოკი, დამწვრობა',
      existingControls: 'DEMO - შეამოწმეთ ვიზუალურად',
      probability: 3,
      severity: 4,
      controlMeasures: {
        elimination: 'DEMO: საფრთხის წყაროს აღმოფხვრა',
        substitution: 'DEMO: უსაფრთხო ალტერნატივით ჩანაცვლება',
        engineering: 'DEMO: დამცავი ბარიერები, იზოლაცია, LOTO სისტემა',
        administrative: 'DEMO: ტრენინგი, პროცედურები, გამაფრთხილებელი ნიშნები',
        ppe: 'DEMO: დიელექტრიკული ხელთათმანები, დამცავი ფეხსაცმელი',
      },
      recommendations: '⚠️ ეს არის DEMO რეჟიმი!\n\nრეალური AI ანალიზისთვის:\n1. დააკონფიგურირეთ VITE_OPENAI_API_KEY\n2. ან გაუშვით backend სერვერი',
      responsiblePerson: 'შ/უ სპეციალისტი',
      deadline: '1 კვირა',
      reviewPeriod: 'ყოველთვიური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: სიმაღლეზე მუშაობა',
      description: 'DEMO რეჟიმი - რეალური ანალიზისთვის საჭიროა API კონფიგურაცია.\n\nდემო: სიმაღლეზე მუშაობის ზონა.',
      category: 'physical',
      location: 'სამშენებლო უბანი / სახურავი',
      affectedPersons: 'მშენებელი, ტექნიკოსი',
      damageType: 'დაცემა, მოტეხილობა',
      existingControls: 'DEMO - შეამოწმეთ ვიზუალურად',
      probability: 4,
      severity: 5,
      controlMeasures: {
        elimination: 'DEMO: მიწის დონეზე მუშაობა',
        substitution: 'DEMO: მექანიზირებული პლატფორმა',
        engineering: 'DEMO: მოაჯირი, უსაფრთხოების ბადე',
        administrative: 'DEMO: ნებართვა, ტრენინგი',
        ppe: 'DEMO: აბზაცი, ჩაფხუტი',
      },
      recommendations: '⚠️ DEMO რეჟიმი - დააკონფიგურირეთ API',
      responsiblePerson: 'უბნის მენეჯერი',
      deadline: 'მუშაობის დაწყებამდე',
      reviewPeriod: 'ყოველდღიური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: ქიმიური საფრთხე',
      description: 'DEMO რეჟიმი.\n\nრეალური AI ანალიზისთვის დააკონფიგურირეთ OpenAI API Key.',
      category: 'chemical',
      location: 'ქიმიური საწყობი / ლაბორატორია',
      affectedPersons: 'ლაბორანტი, საწყობის მუშაკი',
      damageType: 'მოწამვლა, დამწვრობა',
      existingControls: 'DEMO',
      probability: 3,
      severity: 4,
      controlMeasures: {
        elimination: 'DEMO: ქიმიკატის შეცვლა',
        substitution: 'DEMO: ნაკლებად ტოქსიკური ალტერნატივა',
        engineering: 'DEMO: ვენტილაცია, ქიმიური კარადა',
        administrative: 'DEMO: SDS, ტრენინგი',
        ppe: 'DEMO: რესპირატორი, ხელთათმანები',
      },
      recommendations: '⚠️ DEMO - საჭიროა API Key',
      responsiblePerson: 'ქიმიური უსაფრთხოების ოფიცერი',
      deadline: '1 კვირა',
      reviewPeriod: 'კვარტალური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: მექანიკური საფრთხე',
      description: 'DEMO რეჟიმი - API Key არ არის კონფიგურირებული.',
      category: 'mechanical',
      location: 'საწარმოო დარბაზი',
      affectedPersons: 'ოპერატორი, მექანიკოსი',
      damageType: 'მოჭრა, დაზიანება',
      existingControls: 'DEMO',
      probability: 3,
      severity: 4,
      controlMeasures: {
        elimination: 'DEMO: ავტომატიზაცია',
        substitution: 'DEMO: უსაფრთხო მოწყობილობა',
        engineering: 'DEMO: დამცავი ღობე, ინტერლოკი',
        administrative: 'DEMO: ინსტრუქცია, ტრენინგი',
        ppe: 'DEMO: ხელთათმანები, სათვალე',
      },
      recommendations: '⚠️ რეალური ანალიზისთვის დააკონფიგურირეთ API',
      responsiblePerson: 'წარმოების მენეჯერი',
      deadline: '2 კვირა',
      reviewPeriod: 'თვიური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: ხანძრის საფრთხე',
      description: 'DEMO რეჟიმი.',
      category: 'fire',
      location: 'შენობა',
      affectedPersons: 'ყველა პერსონალი',
      damageType: 'დამწვრობა, ასფიქსია',
      existingControls: 'DEMO',
      probability: 2,
      severity: 5,
      controlMeasures: {
        elimination: 'DEMO: აალებადი მასალის მოცილება',
        substitution: 'DEMO: არააალებადი მასალა',
        engineering: 'DEMO: სპრინკლერი, კვამლის დეტექტორი',
        administrative: 'DEMO: ევაკუაციის გეგმა, ტრენინგი',
        ppe: 'DEMO: ცეცხლმაქრი, რესპირატორი',
      },
      recommendations: '⚠️ DEMO - API Key საჭიროა',
      responsiblePerson: 'ხანძარსაწინააღმდეგო ოფიცერი',
      deadline: 'დაუყოვნებლივ',
      reviewPeriod: 'კვარტალური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: ერგონომიული საფრთხე',
      description: 'DEMO რეჟიმი.',
      category: 'ergonomic',
      location: 'ოფისი / საწყობი',
      affectedPersons: 'მუშაკი',
      damageType: 'ზურგის ტრავმა, კუნთების დაჭიმვა',
      existingControls: 'DEMO',
      probability: 4,
      severity: 3,
      controlMeasures: {
        elimination: 'DEMO: ტვირთის დაყოფა',
        substitution: 'DEMO: მექანიზაცია',
        engineering: 'DEMO: რეგულირებადი მაგიდა',
        administrative: 'DEMO: ერგონომიული ტრენინგი',
        ppe: 'DEMO: ზურგის სარტყელი',
      },
      recommendations: '⚠️ DEMO რეჟიმი',
      responsiblePerson: 'შ/უ სპეციალისტი',
      deadline: '2 კვირა',
      reviewPeriod: 'თვიური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: ბიოლოგიური საფრთხე',
      description: 'DEMO რეჟიმი.',
      category: 'biological',
      location: 'სამედიცინო დაწესებულება',
      affectedPersons: 'სამედიცინო პერსონალი',
      damageType: 'ინფექცია',
      existingControls: 'DEMO',
      probability: 3,
      severity: 4,
      controlMeasures: {
        elimination: 'DEMO: კონტაქტის თავიდან აცილება',
        substitution: 'DEMO: ერთჯერადი ინსტრუმენტები',
        engineering: 'DEMO: ლამინარული ნაკადი, იზოლატორი',
        administrative: 'DEMO: ვაქცინაცია, პროტოკოლები',
        ppe: 'DEMO: ნიღაბი, ხალათი, ხელთათმანები',
      },
      recommendations: '⚠️ DEMO რეჟიმი - API კონფიგურაცია საჭიროა',
      responsiblePerson: 'ინფექციის კონტროლის ოფიცერი',
      deadline: '1 კვირა',
      reviewPeriod: 'თვიური',
      confidence: 50,
    },
    {
      hazardName: '⚠️ DEMO: ფსიქოლოგიური საფრთხე',
      description: 'DEMO რეჟიმი.',
      category: 'psychological',
      location: 'სამუშაო ადგილი',
      affectedPersons: 'ყველა თანამშრომელი',
      damageType: 'სტრესი, გადაწვა',
      existingControls: 'DEMO',
      probability: 3,
      severity: 3,
      controlMeasures: {
        elimination: 'DEMO: სტრესორის მოცილება',
        substitution: 'DEMO: სამუშაო პირობების გაუმჯობესება',
        engineering: 'DEMO: ხმაურის იზოლაცია, განათება',
        administrative: 'DEMO: ფსიქოლოგიური მხარდაჭერა, შესვენებები',
        ppe: 'DEMO: ყურის დამცველი (ხმაურისთვის)',
      },
      recommendations: '⚠️ DEMO რეჟიმი',
      responsiblePerson: 'HR მენეჯერი',
      deadline: '1 თვე',
      reviewPeriod: 'კვარტალური',
      confidence: 50,
    },
  ];

  return scenarios[seed] || scenarios[0];
}

/**
 * Check if AI analysis service is available
 */
export async function checkAIServiceAvailability(): Promise<{
  backendAvailable: boolean;
  apiKeyConfigured: boolean;
}> {
  let backendAvailable = false;
  let apiKeyConfigured = !!API_CONFIG.openaiApiKey;

  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const data = await response.json();
      backendAvailable = true;
      apiKeyConfigured = apiKeyConfigured || data.hasApiKey;
    }
  } catch {
    backendAvailable = false;
  }

  return { backendAvailable, apiKeyConfigured };
}
