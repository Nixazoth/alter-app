require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Simple file-based "database" (no external DB needed) ───────────────────
const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ alters: {}, conversations: {} }));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ─── OPENROUTER CALL ─────────────────────────────────────────────────────────
async function callOpenRouter(systemPrompt, messages) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 300,
      temperature: 0.9,
    })
  });

  const data = await response.json();
  if (data.choices && data.choices[0]) {
    return data.choices[0].message.content.trim();
  }
  throw new Error('Groq error: ' + JSON.stringify(data));
}
// ─── Build the system prompt from the Alter's personality ────────────────────
function buildSystemPrompt(alter) {
  return `Tu es l'Alter IA de ${alter.name}. Tu es un clone numérique de cette personne réelle.

RÈGLE CRITIQUE : Réponds DIRECTEMENT comme dans un SMS. JAMAIS de "Je dois...", "Je pense que...", "L'utilisateur demande...", "Premièrement", "Okay,". Va droit au but. Montre JAMAIS ta réflexion interne.

PROFIL DE ${alter.name.toUpperCase()} :
- Style de communication : ${alter.style}
- Humour : ${alter.humor}
- Centres d'intérêt : ${alter.interests}
- Opinion typique sur la vie : ${alter.vibes}
- Expressions favorites / façon de parler : ${alter.expressions}
- Ce qu'il/elle ne ferait JAMAIS dire : ${alter.never}

RÈGLES ABSOLUES :
1. Tu parles EXACTEMENT comme ${alter.name}. Même langage, même énergie, même humour.
2. Tu peux utiliser du verlan, de l'argot, des abréviations — tout ce qui correspond au profil.
3. Quand quelqu'un te demande si t'es une IA, tu peux admettre être l'Alter de ${alter.name} mais rester dans le personnage.
4. Garde les réponses courtes et naturelles — max 2-3 phrases. C'est un SMS, pas un essai.
5. Tu as accès à la "mémoire" de la convo actuelle seulement.
6. Si on te demande des trucs super perso/privés que ${alter.name} n'aurait pas dit, esquive avec humour.

Tu représentes ${alter.name}. Fais-le/la bien.

FORMAT OBLIGATOIRE : Ta réponse doit être UNIQUEMENT le message final, entre 1 et 3 phrases max. Rien d'autre. Pas d'explication, pas de raisonnement, pas de "voici ma réponse". JUSTE le message comme si t'envoyais un SMS.`;
}
// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Créer un Alter
app.post('/api/create-alter', (req, res) => {
  const { name, style, humor, interests, vibes, expressions, never, password } = req.body;

  if (!name || !style || !password) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + uuidv4().slice(0, 6);
  const db = readDB();

  db.alters[id] = {
    id,
    name,
    style,
    humor: humor || 'Humour naturel',
    interests: interests || 'Divers',
    vibes: vibes || 'Positif et chill',
    expressions: expressions || 'Naturel',
    never: never || 'Rien de particulier',
    password,
    createdAt: new Date().toISOString()
  };

  db.conversations[id] = [];
  writeDB(db);

  res.json({ success: true, alterId: id, link: `/chat/${id}` });
});

// Récupérer infos d'un Alter (public, sans le password)
app.get('/api/alter/:id', (req, res) => {
  const db = readDB();
  const alter = db.alters[req.params.id];
  if (!alter) return res.status(404).json({ error: 'Alter introuvable' });

  const { password, ...publicAlter } = alter;
  res.json(publicAlter);
});

// Envoyer un message à l'Alter
app.post('/api/chat/:id', async (req, res) => {
  const { message, senderName, history } = req.body;
  const db = readDB();
  const alter = db.alters[req.params.id];

  if (!alter) return res.status(404).json({ error: 'Alter introuvable' });
  if (!message) return res.status(400).json({ error: 'Message vide' });

  const systemPrompt = buildSystemPrompt(alter);

  // Formater l'historique pour OpenRouter
  const messages = (history || []).map(m => ({
    role: m.isAlter ? 'assistant' : 'user',
    content: m.isAlter ? m.text : `${m.sender || 'Quelqu\'un'}: ${m.text}`
  }));

  messages.push({
    role: 'user',
    content: `${senderName || 'Quelqu\'un'}: ${message}`
  });

  try {
    const reply = await callOpenRouter(systemPrompt, messages);

    // Sauvegarder dans les logs
    const log = {
      id: uuidv4(),
      sender: senderName || 'Anonyme',
      message,
      reply,
      timestamp: new Date().toISOString()
    };

    if (!db.conversations[req.params.id]) db.conversations[req.params.id] = [];
    db.conversations[req.params.id].push(log);
    writeDB(db);

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur IA: ' + err.message });
  }
});

// Dashboard — logs (protégé par password)
app.post('/api/logs/:id', (req, res) => {
  const { password } = req.body;
  const db = readDB();
  const alter = db.alters[req.params.id];

  if (!alter) return res.status(404).json({ error: 'Alter introuvable' });
  if (alter.password !== password) return res.status(401).json({ error: 'Mauvais mot de passe' });

  const logs = db.conversations[req.params.id] || [];
  res.json({ alter, logs });
});

// Lister tous les Alters (pour la page d'accueil)
app.get('/api/alters', (req, res) => {
  const db = readDB();
  const list = Object.values(db.alters).map(({ password, ...a }) => a);
  res.json(list);
});

// ─── Serve frontend pages ─────────────────────────────────────────────────────
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'about.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'privacy.html'));
});

app.get('/chat/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'chat.html'));
});

app.get('/dashboard/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'create.html'));
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Alter App running on http://localhost:${PORT}`));
}
// ─── CRON JOB — RECAP EMAIL CHAQUE MATIN 8H ──────────────────────────────────
const RECAP_HOUR = 8;
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === RECAP_HOUR && now.getMinutes() === 0) {
    const db = readDB();
    for (const alterId in db.alters) {
      const alter = db.alters[alterId];
      if (!alter.email) continue;
      const today = new Date().toDateString();
      const todayLogs = (db.conversations[alterId] || []).filter(l =>
        new Date(l.timestamp).toDateString() === today
      );
      if (todayLogs.length > 0) {
        try {
          await sendRecapEmail(alter.email, alter.name, todayLogs);
          console.log('📧 Recap envoyé à', alter.email);
        } catch(e) {
          console.error('Email error:', e.message);
        }
      }
    }
  }
}, 60000);
module.exports = app;