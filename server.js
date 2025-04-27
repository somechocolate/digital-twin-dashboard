// server.js
import express     from 'express';
import cors        from 'cors';
import multer      from 'multer';
import fs          from 'fs';
import bodyParser  from 'body-parser';
import { config }  from 'dotenv';
import { OpenAI }  from 'openai';

config();                                   // .env laden
const app   = express();
const port  = 5000;

app.use(cors());
app.use(bodyParser.json());

/* ----------  OpenAI Init  ---------------------------------------------- */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ----------  Konstanten  ------------------------------------------------ */
const SYSTEM_PROMPTS = {
  Dev : 'Antworte prägnant mit Code-Beispielen, Best-Practices und kurzen Erklärungen.',
  Test: 'Fokussiere dich auf Test-Cases, Edge-Cases und QA-Checklisten.',
  UX  : 'Sprich in Nutzerstories, Wireframe-Ideen und Accessibility-Hinweisen.',
  Biz : 'Liefere strategische Antworten zu Monetarisierung, Markt und Wachstum.'
};

/* ======================================================================= */
/* 1 | Datei-Upload & Dokument-Analyse                                     */
/* ======================================================================= */
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Keine Datei empfangen' });

  try {
    const content = fs.readFileSync(file.path, 'utf8');

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Fasse das Dokument in 3–4 Sätzen zusammen.' },
        { role: 'user',   content: content }
      ]
    });

    res.json({ summary: chat.choices[0].message.content.trim() });
  } catch (err) {
    console.error('[Upload-Analyse]', err.message);
    res.status(500).json({ error: 'Analyse fehlgeschlagen' });
  }
});

/* ======================================================================= */
/* 2 | GPT-Chat  (system-prompt nach Modus)                                */
/* ======================================================================= */
app.post('/api/gpt', async (req, res) => {
  const { prompt = '', mode: manualMode } = req.body;

  let detectedMode = manualMode;
  try {
    /* 2-a  Mode-Erkennung (falls nicht vorgegeben) */
    if (!detectedMode) {
      const cls = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
          { role: 'system',
            content: 'Ordne den Prompt einem Label zu: Dev, Test, UX, Biz. ' +
                     'Antworte **nur** mit dem Label.' },
          { role: 'user', content: prompt }
        ]
      });
      const guess = cls.choices[0].message.content.trim();
      detectedMode = ['Dev','Test','UX','Biz'].includes(guess) ? guess : 'Dev';
    }

    /* 2-b  Eigentliche Antwort */
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[detectedMode] },
        { role: 'user',   content: prompt }
      ]
    });

    res.json({
      summary : chat.choices[0].message.content.trim(),
      modeUsed: detectedMode          // fürs Frontend optional
    });
  } catch (err) {
    console.error('[GPT-API]', err.message);
    res.status(500).json({ error: 'GPT-Error' });
  }
});

/* ======================================================================= */
/* 3 | Delta-Analyse                                                       */
/* ======================================================================= */
app.post('/api/delta', async (req, res) => {
  const { idea = '', knownTags = [] } = req.body;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system',
          content:
`Du erhältst eine Liste gültiger Tags: ${knownTags.join(', ')} .
Identifiziere, welche Tags von der Idee betroffen sind.
Antworte **nur** als JSON:

{"tags":["tag1","tag2"],"comment":""}` },
        { role: 'user', content: idea }
      ]
    });

    /* robustes JSON-Parsing */
    const raw = chat.choices[0].message.content.trim();
    const json = JSON.parse(raw.match(/{[\s\S]*}/)[0]);
    res.json(json);
  } catch (err) {
    console.error('[Delta-API]', err.message);
    res.json({ tags: [], comment: '' });    // Fallback: keine Deltas
  }
});

/* ======================================================================= */
/* 4 | Risiko-Endpoint                                                     */
/* ======================================================================= */
app.post('/api/risk', async (req, res) => {
  const { title, description = '' } = req.body;
  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content:
`Bewerte das Implementierungsrisiko (Low, Medium, High) und gib **nur JSON** zurück:
{"risk":"Low|Medium|High","reason":""}

Feature: ${title}
Details: ${description}`
      }]
    });

    const raw  = chat.choices[0].message.content.trim();
    const json = JSON.parse(raw.match(/{[\s\S]*}/)[0]);
    res.json(json);
  } catch (err) {
    console.error('[Risk-API]', err.message);
    res.status(500).json({ risk: 'Unknown', reason: 'GPT-Error' });
  }
});

/* ======================================================================= */
app.listen(port, () =>
  console.log(`✅  Server läuft unter http://localhost:${port}`)
);
