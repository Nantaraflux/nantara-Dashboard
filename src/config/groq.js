const GROQ_KEY = process.env.REACT_APP_GROQ_API_KEY

export const getInsights = async (data) => {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a B2B sales analyst for an operations dashboard. Respond in JSON format with { "insights": ["..."], "actions": ["..."] }. Be specific with numbers and percentages.',
        },
        {
          role: 'user',
          content: `Analyze this business data and provide 3 specific insights and 2 recommended actions:\n${JSON.stringify(data)}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.3,
    }),
  })

  if (!res.ok) throw new Error(`Groq API failed: ${res.status}`)
  const result = await res.json()
  const content = result.choices[0].message.content

  try {
    return JSON.parse(content)
  } catch {
    return { insights: [content], actions: [] }
  }
}
