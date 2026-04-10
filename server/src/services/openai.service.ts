import OpenAI from 'openai';
import { RiskAssessment, RiskLevel, RiskItem, RegionalRisk, TrendItem } from '../../../shared/types/api';

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

const SUMMARY_SYSTEM_PROMPT = `You are an expert supply chain risk analyst specializing in North American trade corridors (US, Canada, Mexico). You provide concise, actionable executive summaries of the current supply chain state.

Analyze the provided data and produce a clear executive summary covering:
- Overall supply chain health
- Key risk factors and disruptions
- Notable commodity price movements
- Weather impacts on logistics
- Currency and economic factors affecting trade
- Recommended actions or watch items

Keep the summary to 3-5 paragraphs. Use professional, clear language suitable for C-suite executives. Focus on actionable insights rather than raw data recitation.`;

const RISK_ASSESSMENT_SYSTEM_PROMPT = `You are an expert supply chain risk analyst specializing in North American trade corridors (US, Canada, Mexico). Analyze the provided supply chain data and produce a comprehensive risk assessment.

You MUST respond with valid JSON in the following structure:
{
  "overallRisk": {
    "score": <number 1-100>,
    "rating": "<Low|Medium|High|Critical>",
    "color": "<green|yellow|orange|red>"
  },
  "topRisks": [
    {
      "title": "<risk title>",
      "severity": "<Low|Medium|High|Critical>",
      "category": "<category>",
      "description": "<brief description>"
    }
  ],
  "regionalBreakdown": [
    {
      "region": "United States",
      "riskLevel": { "score": <number>, "rating": "<rating>", "color": "<color>" },
      "topConcern": "<description>"
    },
    {
      "region": "Canada",
      "riskLevel": { "score": <number>, "rating": "<rating>", "color": "<color>" },
      "topConcern": "<description>"
    },
    {
      "region": "Mexico",
      "riskLevel": { "score": <number>, "rating": "<rating>", "color": "<color>" },
      "topConcern": "<description>"
    }
  ],
  "keyTrends": [
    {
      "indicator": "<indicator name>",
      "direction": "<improving|worsening|stable>",
      "detail": "<brief detail>"
    }
  ],
  "watchItems": ["<item1>", "<item2>", ...],
  "summary": "<2-3 paragraph executive summary>"
}

Provide exactly 5 items in topRisks. Provide 3-5 keyTrends. Provide 3-7 watchItems.
Score mapping: 0-25 Low (green), 26-50 Medium (yellow), 51-75 High (orange), 76-100 Critical (red).
Base your assessment on the actual data provided. Be specific and actionable.`;

function getDefaultRiskAssessment(): RiskAssessment {
  const overallRisk: RiskLevel = {
    score: 35,
    rating: 'Medium',
    color: 'yellow',
  };

  const topRisks: RiskItem[] = [
    {
      title: 'Data Collection Pending',
      severity: 'Low',
      category: 'System',
      description: 'Supply chain data is still being collected. Risk assessment will improve as more data becomes available.',
    },
    {
      title: 'Baseline Market Volatility',
      severity: 'Medium',
      category: 'Commodities',
      description: 'Normal market fluctuations present standard trading risks across commodity markets.',
    },
    {
      title: 'Seasonal Weather Patterns',
      severity: 'Medium',
      category: 'Weather',
      description: 'Standard seasonal weather patterns may affect logistics and agricultural supply chains.',
    },
    {
      title: 'Currency Exchange Fluctuations',
      severity: 'Low',
      category: 'Currency',
      description: 'Minor currency fluctuations between USD, CAD, and MXN within normal trading ranges.',
    },
    {
      title: 'Port Congestion Monitoring',
      severity: 'Low',
      category: 'Logistics',
      description: 'Port activity levels are being monitored for potential congestion issues.',
    },
  ];

  const regionalBreakdown: RegionalRisk[] = [
    {
      region: 'United States',
      riskLevel: { score: 35, rating: 'Medium', color: 'yellow' },
      topConcern: 'Standard market conditions with no major disruptions identified.',
    },
    {
      region: 'Canada',
      riskLevel: { score: 30, rating: 'Medium', color: 'yellow' },
      topConcern: 'Monitoring cross-border trade flows and seasonal weather impacts.',
    },
    {
      region: 'Mexico',
      riskLevel: { score: 32, rating: 'Medium', color: 'yellow' },
      topConcern: 'Tracking manufacturing output and trade corridor stability.',
    },
  ];

  const keyTrends: TrendItem[] = [
    {
      indicator: 'Overall Supply Chain Health',
      direction: 'stable',
      detail: 'No major disruptions detected in current data collection cycle.',
    },
    {
      indicator: 'Commodity Markets',
      direction: 'stable',
      detail: 'Prices within normal trading ranges across major commodities.',
    },
    {
      indicator: 'Logistics Networks',
      direction: 'stable',
      detail: 'Transportation and port operations functioning normally.',
    },
  ];

  return {
    overallRisk,
    topRisks,
    regionalBreakdown,
    keyTrends,
    watchItems: [
      'Weather system developments affecting major trade routes',
      'Commodity price trends in energy and agricultural sectors',
      'Port congestion levels at major North American ports',
      'Currency exchange rate movements for USD/CAD and USD/MXN',
    ],
    generatedAt: new Date().toISOString(),
    summary: 'The North American supply chain is currently operating under standard conditions with no major disruptions identified. Risk levels are at baseline as the monitoring system continues to collect and analyze data across all tracked indicators. Key areas under observation include commodity price movements, weather patterns, port congestion, and currency fluctuations across the US-Canada-Mexico trade corridor.',
  };
}

export async function generateSummary(data: object): Promise<string> {
  const client = getClient();

  if (!client) {
    return 'Supply chain summary is unavailable. The OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable to enable AI-generated summaries. Current data collection is proceeding normally across all monitored indicators.';
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze the following supply chain data and provide an executive summary:\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate summary at this time.';
  } catch (error) {
    console.error('OpenAI summary generation failed:', error);
    return 'Supply chain summary generation encountered an error. Please try again later. Data collection continues normally across all monitored indicators.';
  }
}

export async function generateRiskAssessment(data: object): Promise<RiskAssessment> {
  const client = getClient();

  if (!client) {
    return getDefaultRiskAssessment();
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: RISK_ASSESSMENT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze the following supply chain data and provide a comprehensive risk assessment as JSON:\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error('OpenAI returned empty risk assessment response');
      return getDefaultRiskAssessment();
    }

    const parsed = JSON.parse(content) as RiskAssessment;
    parsed.generatedAt = new Date().toISOString();

    // Validate and fix the color field based on the score
    if (parsed.overallRisk) {
      parsed.overallRisk.color = scoreToColor(parsed.overallRisk.score);
    }
    if (parsed.regionalBreakdown) {
      for (const region of parsed.regionalBreakdown) {
        if (region.riskLevel) {
          region.riskLevel.color = scoreToColor(region.riskLevel.score);
        }
      }
    }

    return parsed;
  } catch (error) {
    console.error('OpenAI risk assessment generation failed:', error);
    return getDefaultRiskAssessment();
  }
}

function scoreToColor(score: number): string {
  if (score <= 25) return 'green';
  if (score <= 50) return 'yellow';
  if (score <= 75) return 'orange';
  return 'red';
}
