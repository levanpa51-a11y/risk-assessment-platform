import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve built frontend if dist exists
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BASE_PROMPT = `შენ ხარ შრომის უსაფრთხოების ექსპერტი. გაანალიზე ეს სურათი და მომეცი რისკის შეფასების სრული ინფორმაცია.

დააბრუნე მხოლოდ JSON ობიექტი (არანაირი დამატებითი ტექსტი) შემდეგი სტრუქტურით:

{
  "hazardName": "საფრთხის მოკლე დასახელება ქართულად",
  "description": "დეტალური აღწერა, ქართულად",
  "category": "physical/chemical/biological/ergonomic/psychological/electrical/fire/mechanical",
  "location": "სავარაუდო ადგილმდებარეობა",
  "affectedPersons": "ვინ შეიძლება დაშავდეს",
  "damageType": "რა ტიპის დაშავება",
  "existingControls": "კონტროლის ზომები (ან 'არ არის')",
  "probability": 3,
  "severity": 3,
  "controlMeasures": {
    "elimination": "საფრთხის აღმოფხვრა",
    "substitution": "ჩანაცვლება",
    "engineering": "საინჟინრო ზომები",
    "administrative": "ადმინისტრაციული ზომები",
    "ppe": "პირადი დამცავი საშუალებები"
  },
  "recommendations": "გასატარებელი ზომები, ქართულად",
  "responsiblePerson": "პასუხისმგებელი",
  "deadline": "ვადა",
  "reviewPeriod": "გადახედვის პერიოდი",
  "confidence": 80
}`;

const VIDEO_FRAME_PROMPT = `შენ ხარ შრომის უსაფრთხოების ექსპერტი. ეს კადრი გადაღებულია ვიდეო მონიტორინგის სისტემის მიერ.
გაანალიზე კადრი და გამოავლინე ნებისმიერი საფრთხე ან სახიფათო სიტუაცია.

დააბრუნე მხოლოდ JSON ობიექტი:

{
  "hazardName": "საფრთხის სახელწოდება ქართულად",
  "description": "აღწერა ქართულად",
  "category": "physical/chemical/biological/ergonomic/psychological/electrical/fire/mechanical",
  "location": "ზონა კადრიდან",
  "affectedPersons": "ვინ შეიძლება დაზარალდეს",
  "damageType": "ტრავმის ტიპი",
  "existingControls": "ჩანს თუ არა კონტროლი",
  "probability": 3,
  "severity": 3,
  "controlMeasures": {
    "elimination": "აღმოფხვრა",
    "substitution": "ჩანაცვლება",
    "engineering": "საინჟინრო ზომები",
    "administrative": "ადმინისტრაციული",
    "ppe": "პირადი დაცვა"
  },
  "recommendations": "სასწრაფო ქმედებები",
  "responsiblePerson": "პასუხისმგებელი",
  "deadline": "ვადა",
  "reviewPeriod": "სიხშირე",
  "confidence": 75
}`;

async function callOpenAI(imageData, customPrompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const prompt = customPrompt || BASE_PROMPT;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageData, detail: 'high' } },
        ],
      },
    ],
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse JSON from response');

  return JSON.parse(jsonMatch[0]);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.OPENAI_API_KEY });
});

// Photo-based image analysis
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { image, prompt } = req.body;
    if (!image) return res.status(400).json({ error: 'Image is required' });

    const result = await callOpenAI(image, prompt);
    res.json(result);
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: 'Analysis failed', message: error.message });
  }
});

// Video frame analysis endpoint (optimized for speed)
app.post('/api/analyze-video-frame', async (req, res) => {
  try {
    const { image, prompt } = req.body;
    if (!image) return res.status(400).json({ error: 'Frame image is required' });

    const result = await callOpenAI(image, prompt || VIDEO_FRAME_PROMPT);
    res.json(result);
  } catch (error) {
    console.error('Video frame analysis error:', error);
    res.status(500).json({ error: 'Frame analysis failed', message: error.message });
  }
});

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) res.status(404).json({ error: 'Frontend not built. Run: npm run build' });
  });
});

app.listen(PORT, () => {
  console.log(`Risk Assessment Server running on port ${PORT}`);
  console.log(`OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`Open in browser: http://localhost:${PORT}`);
  console.log(`On Android: http://<your-ip>:${PORT}`);
});
