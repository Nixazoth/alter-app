# 🚀 GUIDE COMPLET — Lancer Alter sur Windows

## Ce que t'as besoin (tout gratuit)
- Node.js (pour faire tourner l'app)
- VS Code (pour ouvrir les fichiers)
- Un compte GitHub (pour déployer)
- Un compte Vercel (pour mettre en ligne)
- Un compte OpenRouter (pour l'IA gratuite)

---

## ÉTAPE 1 — Installer Node.js

1. Va sur **nodejs.org**
2. Clique sur "LTS" (le bouton vert)
3. Lance le .exe téléchargé → clique "Next" partout → Installer
4. Redémarre ton ordi

**Vérification** : Ouvre le menu démarrer → tape "cmd" → ouvre "Invite de commandes"
Tape : `node --version`
Tu dois voir quelque chose comme `v20.x.x` ✅

---

## ÉTAPE 2 — Installer VS Code (éditeur de code)

1. Va sur **code.visualstudio.com**
2. Télécharge et installe

---

## ÉTAPE 3 — Récupérer ta clé OpenRouter (IA GRATUITE)

1. Va sur **openrouter.ai**
2. Clique "Sign Up" → crée un compte gratuit
3. Une fois connecté, clique sur ton avatar en haut à droite → "API Keys"
4. Clique "Create Key" → donne-lui un nom → copie la clé (commence par `sk-or-v1-...`)
5. **Garde cette clé précieusement** (tu en as besoin dans l'étape suivante)

> 💡 OpenRouter donne accès à des modèles IA GRATUITS (Llama 3, Mistral, etc.)
> Le modèle utilisé dans l'app : `meta-llama/llama-3.3-8b-instruct:free` — 100% gratuit

---

## ÉTAPE 4 — Configurer l'app

1. Ouvre le dossier `alter-app` dans VS Code (Fichier → Ouvrir le dossier)
2. Ouvre le fichier `.env`
3. Remplace `METS-TA-CLE-ICI` par ta vraie clé OpenRouter
   Exemple : `OPENROUTER_API_KEY=sk-or-v1-abc123def456...`
4. Sauvegarde (Ctrl+S)

---

## ÉTAPE 5 — Lancer l'app en local (pour tester)

1. Dans VS Code, ouvre le terminal : **Terminal → Nouveau terminal**
2. Tape ces commandes une par une :

```
npm install
```
(Attends que ça se termine — ça télécharge les modules)

```
node server.js
```

Tu dois voir : `🚀 Alter App running on http://localhost:3000`

3. Ouvre ton navigateur → va sur **http://localhost:3000**
4. L'app tourne ! 🎉

---

## ÉTAPE 6 — Mettre en ligne pour tes potes (Vercel)

### A) Créer un compte GitHub
1. Va sur **github.com** → "Sign up" → crée un compte gratuit

### B) Installer Git
1. Va sur **git-scm.com** → télécharge Git pour Windows → installe

### C) Mettre le code sur GitHub
Dans le terminal VS Code (arrête le serveur avec Ctrl+C d'abord) :

```
git init
git add .
git commit -m "first commit"
```

Va sur github.com → clique le "+" → "New repository"
Nom : `alter-app` → clique "Create repository"

Copie les commandes qu'il te donne (genre `git remote add origin...`) et colle-les dans le terminal.

### D) Déployer sur Vercel
1. Va sur **vercel.com** → "Sign Up with GitHub"
2. Clique "Add New Project" → importe ton repo `alter-app`
3. Avant de déployer, clique **"Environment Variables"** et ajoute :
   - `OPENROUTER_API_KEY` = ta clé OpenRouter
   - `APP_URL` = (laisse vide pour l'instant, Vercel le remplit)
4. Clique **"Deploy"**
5. Dans ~2 minutes, tu as un lien genre `alter-app-xxx.vercel.app`

> C'est CE lien que tu files à tes potes ! 🔥

---

## ÉTAPE 7 — Tester avec tes potes (Beta)

1. Toi tu vas sur `ton-lien.vercel.app/create` → tu crées ton Alter
2. Tu copies le lien de ton Alter (genre `ton-lien.vercel.app/chat/tonnom-abc123`)
3. Tu l'envoies à tes potes via WhatsApp, Discord, etc.
4. Tes potes ouvrent le lien sur leur tel (ça marche direct dans le navigateur mobile !)
5. Toi tu vas sur `ton-lien.vercel.app/dashboard/tonid` avec ton mot de passe pour lire les convos

---

## RÉSUMÉ — Les 4 pages de l'app

| Page | URL | Pour qui |
|------|-----|---------|
| Accueil | `/` | Tout le monde |
| Créer un Alter | `/create` | Toi |
| Chat | `/chat/ton-id` | Tes potes |
| Dashboard/Logs | `/dashboard/ton-id` | Toi seul (mot de passe) |

---

## Si t'as un problème

- **"npm n'est pas reconnu"** → Node.js n'est pas installé, refais l'étape 1
- **"Error: OpenRouter..."** → Ta clé API est mal copiée dans le .env
- **L'IA répond pas** → Vérifie que tu as du crédit ou un modèle gratuit sur OpenRouter
- **Vercel déploie pas** → Vérifie que la variable `OPENROUTER_API_KEY` est bien ajoutée dans Vercel

---

## Pour aller plus loin (plus tard)

- Ajouter une vraie BDD (Supabase) pour ne pas perdre les données si Vercel redémarre
- Ajouter un système d'email pour les morning recaps
- Ajouter un paywall avec Stripe pour monétiser

---

*Made with 0 budget. alter. 2025* 🔥
