# Protein Check

A no-nonsense meal photo analyzer that tells you one thing: **is there enough protein?**

Unlike calorie counters that obsess over precision, Protein Check gives you a quick reality check on your meals. Drop a photo, get your protein estimate, verdict, and one actionable suggestion.

## The idea

Most nutrition apps overwhelm you with data. Protein Check takes the opposite approach:

- **Protein-first**: The main number that matters
- **Broad calorie range**: Good enough estimate, not false precision
- **One verdict**: Is this meal good for muscle maintenance or not?
- **One suggestion**: Just one actionable thing, no tip overload

## How it works

1. Drop a meal photo on the card
2. Wait for analysis (uses GPT-4o-mini vision)
3. Get your protein check: grams, calories, verdict, and one recommendation

## Local development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Environment setup

Copy `.env.local.example` to `.env.local` and add your Azure OpenAI credentials:

```
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
```

Without credentials, the app uses mock data for demo purposes.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/protein-check)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Server Actions
- Azure OpenAI (GPT-4o-mini with vision)

## Design principles

- Flat design: no shadows, no gradients
- Light theme with neutral palette
- Calm, factual copy
- Minimal UI, maximum information

---

Built for Shipmas 2025.
