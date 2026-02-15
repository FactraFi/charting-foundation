// FactraFi Mock Data & Constants

export interface StockPillar {
  score: number;
  label: string;
}

export interface MockStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  score: number;
  signal: string;
  marketCap: string;
  peRatio: number;
  indPe: number;
  volume: string;
  yearChange: string;
  roe: string;
  roce: string;
  sector: string;
  industry: string;
  technical: string;
  analystRating: number;
  summary: string;
  pillars: {
    fundamentals: StockPillar;
    momentum: StockPillar;
    risk: StockPillar;
    sentiment: StockPillar;
  };
}

export const MOCK_STOCKS: MockStock[] = [
  {
    symbol: 'NVDA', name: 'NVIDIA Corp', price: 890.45, change: 2.34, score: 94, signal: 'Strong Buy',
    marketCap: '2.2T', peRatio: 72.5, indPe: 45.2, volume: '45M', yearChange: '+215%', roe: '55%', roce: '48%',
    sector: 'Technology', industry: 'Semiconductors', technical: 'Bullish', analystRating: 5,
    summary: 'Fundamentals remain pristine with record earnings growth. Momentum signals a breakout above resistance. Risk is moderate despite volatility, while Sentiment indicators show extreme institutional accumulation.',
    pillars: { fundamentals: { score: 94, label: 'Excellent' }, momentum: { score: 88, label: 'Surging' }, risk: { score: 62, label: 'Moderate' }, sentiment: { score: 91, label: 'Bullish' } }
  },
  {
    symbol: 'TSLA', name: 'Tesla Inc', price: 178.20, change: -1.12, score: 42, signal: 'Hold',
    marketCap: '560B', peRatio: 40.2, indPe: 22.1, volume: '98M', yearChange: '-28%', roe: '12%', roce: '10%',
    sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', technical: 'Bearish', analystRating: 3,
    summary: 'Facing short-term headwinds with margins compressing. Momentum is negative as price sits below key moving averages. Risk is elevated due to competition, though Sentiment remains cautiously optimistic among retail.',
    pillars: { fundamentals: { score: 45, label: 'Weak' }, momentum: { score: 38, label: 'Bearish' }, risk: { score: 85, label: 'High' }, sentiment: { score: 55, label: 'Neutral' } }
  },
  {
    symbol: 'AMD', name: 'Adv. Micro Devices', price: 170.50, change: 1.05, score: 88, signal: 'Buy',
    marketCap: '270B', peRatio: 320.1, indPe: 45.2, volume: '60M', yearChange: '+112%', roe: '8%', roce: '7%',
    sector: 'Technology', industry: 'Semiconductors', technical: 'Bullish', analystRating: 4,
    summary: 'Strong AI chip demand is driving growth. Momentum is building for a retest of highs. Risk is balanced, and Sentiment is improving as market share gains continue.',
    pillars: { fundamentals: { score: 82, label: 'Strong' }, momentum: { score: 91, label: 'Very Bullish' }, risk: { score: 58, label: 'Moderate' }, sentiment: { score: 85, label: 'Positive' } }
  },
  {
    symbol: 'PLTR', name: 'Palantir Tech', price: 24.50, change: 5.20, score: 91, signal: 'Strong Buy',
    marketCap: '54B', peRatio: 250.5, indPe: 65.4, volume: '80M', yearChange: '+180%', roe: '2%', roce: '3%',
    sector: 'Technology', industry: 'Software - Infra', technical: 'Strong Buy', analystRating: 4,
    summary: 'Commercial revenue acceleration is a key catalyst. Momentum is explosive following earnings beat. Risk is higher due to valuation, but Sentiment is overwhelmingly positive.',
    pillars: { fundamentals: { score: 78, label: 'Improving' }, momentum: { score: 96, label: 'Extreme' }, risk: { score: 75, label: 'High' }, sentiment: { score: 94, label: 'Euphoric' } }
  },
  {
    symbol: 'AAPL', name: 'Apple Inc', price: 172.00, change: -0.50, score: 65, signal: 'Hold',
    marketCap: '2.6T', peRatio: 26.4, indPe: 28.1, volume: '50M', yearChange: '+12%', roe: '160%', roce: '58%',
    sector: 'Technology', industry: 'Consumer Electronics', technical: 'Neutral', analystRating: 4,
    summary: 'Stable cash flows but lacking immediate growth catalysts. Momentum is sideways. Risk is very low given balance sheet strength. Sentiment is currently muted.',
    pillars: { fundamentals: { score: 95, label: 'Fortress' }, momentum: { score: 45, label: 'Neutral' }, risk: { score: 20, label: 'Low' }, sentiment: { score: 50, label: 'Mixed' } }
  },
  {
    symbol: 'COIN', name: 'Coinbase Global', price: 245.30, change: 8.40, score: 89, signal: 'Buy',
    marketCap: '60B', peRatio: 0, indPe: 0, volume: '15M', yearChange: '+300%', roe: '15%', roce: '12%',
    sector: 'Financial Svcs', industry: 'Capital Markets', technical: 'Bullish', analystRating: 3,
    summary: 'Direct beneficiary of crypto market volatility and ETF inflows. Momentum is extremely high. Risk is significant but currently outweighed by bullish sentiment.',
    pillars: { fundamentals: { score: 72, label: 'Volatile' }, momentum: { score: 98, label: 'Extreme' }, risk: { score: 85, label: 'High' }, sentiment: { score: 92, label: 'Euphoric' } }
  },
  {
    symbol: 'MSFT', name: 'Microsoft Corp', price: 420.15, change: 0.85, score: 82, signal: 'Buy',
    marketCap: '3.1T', peRatio: 35.8, indPe: 38.2, volume: '22M', yearChange: '+55%', roe: '38%', roce: '32%',
    sector: 'Technology', industry: 'Software - Infra', technical: 'Bullish', analystRating: 5,
    summary: 'Cloud and AI integration driving steady compound growth. Momentum is stable. Risk is minimal due to diversified revenue streams. Sentiment is solidly bullish.',
    pillars: { fundamentals: { score: 98, label: 'Elite' }, momentum: { score: 75, label: 'Steady' }, risk: { score: 15, label: 'Low' }, sentiment: { score: 80, label: 'Positive' } }
  },
  {
    symbol: 'GOOGL', name: 'Alphabet Inc', price: 175.40, change: 1.20, score: 79, signal: 'Hold',
    marketCap: '1.9T', peRatio: 24.5, indPe: 22.8, volume: '28M', yearChange: '+45%', roe: '28%', roce: '24%',
    sector: 'Communication Svcs', industry: 'Internet Content', technical: 'Neutral', analystRating: 4,
    summary: 'Ad revenue remains a cash cow, but AI search competition is a looming threat. Momentum is lagging peers. Risk is moderate. Sentiment is cautious.',
    pillars: { fundamentals: { score: 92, label: 'Strong' }, momentum: { score: 60, label: 'Lagging' }, risk: { score: 45, label: 'Moderate' }, sentiment: { score: 65, label: 'Cautious' } }
  },
  {
    symbol: 'AMZN', name: 'Amazon.com', price: 185.10, change: 1.50, score: 85, signal: 'Buy',
    marketCap: '1.8T', peRatio: 60.2, indPe: 45.1, volume: '35M', yearChange: '+78%', roe: '20%', roce: '18%',
    sector: 'Consumer Cyclical', industry: 'Internet Retail', technical: 'Bullish', analystRating: 5,
    summary: 'AWS stabilization and retail margin expansion are key drivers. Momentum is recovering well. Risk is standard for beta. Sentiment is increasingly constructive.',
    pillars: { fundamentals: { score: 85, label: 'Improving' }, momentum: { score: 82, label: 'Bullish' }, risk: { score: 40, label: 'Standard' }, sentiment: { score: 88, label: 'Strong' } }
  },
  {
    symbol: 'META', name: 'Meta Platforms', price: 510.20, change: -0.40, score: 70, signal: 'Hold',
    marketCap: '1.2T', peRatio: 33.1, indPe: 25.4, volume: '18M', yearChange: '+140%', roe: '35%', roce: '28%',
    sector: 'Communication Svcs', industry: 'Internet Content', technical: 'Neutral', analystRating: 4,
    summary: 'Massive capex spend on AI is worrying some investors, despite solid ad growth. Momentum has stalled at highs. Risk is increasing with spend. Sentiment is mixed.',
    pillars: { fundamentals: { score: 88, label: 'Solid' }, momentum: { score: 55, label: 'Stalled' }, risk: { score: 65, label: 'Elevated' }, sentiment: { score: 60, label: 'Mixed' } }
  },
];

export const CHART_DATA_VARIANTS: Record<string, { time: string; value: number }[]> = {
  '1D': [
    { time: '9:30', value: 100 }, { time: '10:30', value: 105 }, { time: '11:30', value: 102 },
    { time: '12:30', value: 108 }, { time: '1:30', value: 115 }, { time: '2:30', value: 112 },
    { time: '3:30', value: 120 }
  ],
  '1W': [
    { time: 'Mon', value: 95 }, { time: 'Tue', value: 98 }, { time: 'Wed', value: 105 },
    { time: 'Thu', value: 102 }, { time: 'Fri', value: 110 }, { time: 'Sat', value: 115 },
    { time: 'Sun', value: 118 }
  ],
  '1M': [
    { time: 'W1', value: 90 }, { time: 'W2', value: 98 }, { time: 'W3', value: 95 },
    { time: 'W4', value: 110 }, { time: 'W5', value: 125 }
  ],
  '3M': [
    { time: 'Jan', value: 80 }, { time: 'Feb', value: 95 }, { time: 'Mar', value: 120 }
  ],
  '1Y': [
    { time: 'Q1', value: 70 }, { time: 'Q2', value: 85 }, { time: 'Q3', value: 95 }, { time: 'Q4', value: 120 }
  ],
  'ALL': [
    { time: '2023', value: 50 }, { time: '2024', value: 80 }, { time: '2025', value: 120 }
  ]
};

export const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Price Alert: NVDA', message: 'NVIDIA crossed $900.00', time: '2m ago', type: 'success' as const },
  { id: 2, title: 'New Signal', message: 'Strong Buy signal detected for PLTR', time: '15m ago', type: 'info' as const },
  { id: 3, title: 'Risk Warning', message: 'Portfolio volatility increased by 2%', time: '1h ago', type: 'warning' as const },
];

export const MARKER_DATA: Record<string, { snapshot: string; items: { label: string; value: string; status: string; color: string }[] }> = {
  technical: {
    snapshot: 'Technical setup remains strongly constructive. Short-term overbought conditions exist but volume confirms trend strength.',
    items: [
      { label: 'RSI (14)', value: '64.2', status: 'BULLISH', color: 'text-primary' },
      { label: 'MACD (12,26)', value: '+1.42', status: 'BULL CROSS', color: 'text-primary' },
      { label: 'SMA (50)', value: '$842.15', status: 'ABOVE', color: 'text-info' },
      { label: 'EMA (200)', value: '$756.40', status: 'SUPPORT', color: 'text-purple-400' },
      { label: 'Bollinger Bands', value: 'UPPER', status: 'TESTING', color: 'text-yellow-500' },
      { label: 'Volume Profile', value: 'HIGH', status: 'ACCUMULATION', color: 'text-primary' }
    ]
  },
  fundamental: {
    snapshot: 'Fundamentals show resilience with high return on equity and manageable debt. Profitability margins continue to expand annually.',
    items: [
      { label: 'P/E Ratio', value: '32.4', status: 'PREMIUM', color: 'text-yellow-500' },
      { label: 'Debt/Equity', value: '0.45', status: 'HEALTHY', color: 'text-primary' },
      { label: 'ROE', value: '28.5%', status: 'ELITE', color: 'text-primary' },
      { label: 'Rev. Growth', value: '18.2%', status: 'STEADY', color: 'text-info' },
      { label: 'Net Margin', value: '22.1%', status: 'STRONG', color: 'text-primary' },
      { label: 'FCF Yield', value: '4.2%', status: 'ATTRACTIVE', color: 'text-info' }
    ]
  },
  sentiment: {
    snapshot: 'Market participants exhibit "Greed" levels with heavy call option activity. Institutional accumulation remains at 12-month highs.',
    items: [
      { label: 'Fear & Greed', value: '72/100', status: 'GREED', color: 'text-yellow-500' },
      { label: 'Call/Put Ratio', value: '1.45', status: 'BULLISH', color: 'text-primary' },
      { label: 'Inst. Flow', value: '+$4.2B', status: 'BUYING', color: 'text-primary' },
      { label: 'Social Buzz', value: 'HIGH', status: 'HOT', color: 'text-orange-500' },
      { label: 'Short Interest', value: '2.1%', status: 'LOW', color: 'text-primary' },
      { label: 'News Alpha', value: '+14.2', status: 'POSITIVE', color: 'text-primary' }
    ]
  }
};
