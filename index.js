import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  "probability": 1-5 რიცხვი (1=იშვიათი, 5=თითქმის გარდაუვალი),
  "severity": 1-5 რიცხვი (1=უმნიშვნელო, 5=კატასტროფული/სიკვდილი),
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
  "confidence": 70-95 რიცხვი (რამდენად ხარ დარწმუნებული ანალიზში)
}`;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.OPENAI_API_KEY });
});

// Image analysis endpoint
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
    }

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: ANALYSIS_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const result = JSON.parse(jsonMatch[0]);
    res.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Analysis Server running on port ${PORT}`);
  console.log(`API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});
