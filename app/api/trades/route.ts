import { NextRequest, NextResponse } from 'next/server';
import { Trade, TradeLog } from '@/types/trade';

const trades: Map<string, Trade> = new Map();
const logs: Map<string, TradeLog[]> = new Map();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tradeId = searchParams.get('id');

    if (tradeId) {
      const trade = trades.get(tradeId);
      const tradeLogs = logs.get(tradeId) || [];

      if (!trade) {
        return NextResponse.json(
          { success: false, error: 'Trade not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        trade,
        logs: tradeLogs,
      });
    }

    const allTrades = Array.from(trades.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      trades: allTrades,
      count: allTrades.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trade, tradeLogs } = body as {
      trade: Trade;
      tradeLogs?: TradeLog[];
    };

    if (!trade || !trade.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid trade data' },
        { status: 400 }
      );
    }

    trades.set(trade.id, trade);

    if (tradeLogs && tradeLogs.length > 0) {
      const existingLogs = logs.get(trade.id) || [];
      logs.set(trade.id, [...existingLogs, ...tradeLogs]);
    }

    return NextResponse.json({
      success: true,
      trade,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    trades.clear();
    logs.clear();

    return NextResponse.json({
      success: true,
      message: 'All trades cleared',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
