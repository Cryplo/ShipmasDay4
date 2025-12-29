'use server'

export interface MealAnalysis {
  protein: number
  calorieMin: number
  calorieMax: number
  verdict: 'adequate' | 'low-muscle' | 'low-satiety'
  verdictText: string
  recommendation: string
  foodDescription: string
}

const SYSTEM_PROMPT = `You are a protein-focused nutrition estimator. When shown a meal photo or description, you estimate:
1. Protein content (in grams, be realistic)
2. Calorie range (broad estimate, not precise)
3. Protein verdict for an adult looking to maintain/build muscle
4. One actionable protein-focused recommendation

Verdicts:
- "adequate": 25g+ protein for a main meal, 15g+ for a snack
- "low-muscle": Under the thresholds above, problematic for muscle maintenance
- "low-satiety": Very low protein (<10g), likely to leave someone hungry

Rules:
- Only give ONE recommendation
- Keep it practical and judgment-free
- No medical advice
- Be specific about the food you see

Respond ONLY with valid JSON in this exact format:
{
  "protein": <number>,
  "calorieMin": <number>,
  "calorieMax": <number>,
  "verdict": "adequate" | "low-muscle" | "low-satiety",
  "verdictText": "<human readable verdict>",
  "recommendation": "<one specific suggestion>",
  "foodDescription": "<brief description of the meal>"
}`

export async function analyzeMeal(imageBase64: string): Promise<MealAnalysis> {
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini'

  if (!apiKey || !endpoint) {
    // Return mock data for demo purposes when API keys aren't configured
    return getMockAnalysis()
  }

  try {
    const response = await fetch(
      `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64.startsWith('data:')
                      ? imageBase64
                      : `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
                {
                  type: 'text',
                  text: 'Analyze this meal for protein content.',
                },
              ],
            },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      }
    )

    if (!response.ok) {
      console.error('API error:', response.status, await response.text())
      return getMockAnalysis()
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return getMockAnalysis()
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return getMockAnalysis()
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      protein: parsed.protein,
      calorieMin: parsed.calorieMin,
      calorieMax: parsed.calorieMax,
      verdict: parsed.verdict,
      verdictText: parsed.verdictText,
      recommendation: parsed.recommendation,
      foodDescription: parsed.foodDescription,
    }
  } catch (error) {
    console.error('Error analyzing meal:', error)
    return getMockAnalysis()
  }
}

function getMockAnalysis(): MealAnalysis {
  // Provide realistic mock data for demo
  const mockMeals = [
    {
      protein: 35,
      calorieMin: 450,
      calorieMax: 550,
      verdict: 'adequate' as const,
      verdictText: 'Solid protein for a main meal',
      recommendation: 'This meal hits your protein target. Pair with vegetables for fiber.',
      foodDescription: 'Grilled chicken breast with rice',
    },
    {
      protein: 12,
      calorieMin: 380,
      calorieMax: 480,
      verdict: 'low-muscle' as const,
      verdictText: 'Could use more protein',
      recommendation: 'Add a boiled egg or Greek yogurt on the side to boost protein.',
      foodDescription: 'Pasta with marinara sauce',
    },
    {
      protein: 28,
      calorieMin: 520,
      calorieMax: 650,
      verdict: 'adequate' as const,
      verdictText: 'Good protein content',
      recommendation: 'Well-balanced meal. Consider this template for future meals.',
      foodDescription: 'Salmon fillet with vegetables',
    },
  ]

  return mockMeals[Math.floor(Math.random() * mockMeals.length)]
}
