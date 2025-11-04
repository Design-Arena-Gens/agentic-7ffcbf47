import { NextResponse } from 'next/server';
import { Trade } from '@/types/trade';

let mockTrades: Trade[] = [];
let lastGeneratedTime = 0;

function generateMockTrade(): Trade {
  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];
  const directions: ('buy' | 'sell')[] = ['buy', 'sell'];
  const timeframes = ['1H', '4H', '1D', '15M', '30M'];

  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  const entryPrice = 1.0 + Math.random() * 0.5;
  const lotSize = parseFloat((0.01 + Math.random() * 0.99).toFixed(2));
  const stopLoss = direction === 'buy' ? entryPrice - 0.01 : entryPrice + 0.01;
  const takeProfit = direction === 'buy' ? entryPrice + 0.02 : entryPrice - 0.02;

  return {
    id: `MOXY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    pair,
    direction,
    entryPrice: parseFloat(entryPrice.toFixed(5)),
    lotSize,
    timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
    stopLoss: parseFloat(stopLoss.toFixed(5)),
    takeProfit: parseFloat(takeProfit.toFixed(5)),
    status: 'pending',
    platform: 'MoxyAI',
  };
}

export async function GET() {
  try {
    const now = Date.now();

    if (now - lastGeneratedTime > 30000) {
      const newTrade = generateMockTrade();
      mockTrades.unshift(newTrade);
      lastGeneratedTime = now;

      if (mockTrades.length > 50) {
        mockTrades = mockTrades.slice(0, 50);
      }
    }

    const latestTrade = mockTrades[0] || null;

    return NextResponse.json({
      success: true,
      trade: latestTrade,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
