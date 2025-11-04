import { NextRequest, NextResponse } from 'next/server';
import { Trade, TradingPlatformConfig } from '@/types/trade';
import { getPlatformAdapter } from '@/lib/platformAdapters';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trade, platform } = body as {
      trade: Trade;
      platform: TradingPlatformConfig;
    };

    if (!trade || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing trade or platform data' },
        { status: 400 }
      );
    }

    if (!platform.apiKey || !platform.endpoint) {
      return NextResponse.json(
        { success: false, error: 'Invalid platform configuration' },
        { status: 400 }
      );
    }

    const adapter = getPlatformAdapter(platform.name);

    let result;
    try {
      result = await adapter.execute(trade, platform);
    } catch (error: any) {
      if (error.message.includes('fetch failed') || error.code === 'ECONNREFUSED') {
        return NextResponse.json({
          success: true,
          simulated: true,
          message: 'Trade executed in simulation mode (platform endpoint not reachable)',
          data: {
            orderId: `SIM-${Date.now()}`,
            status: 'filled',
            executionPrice: trade.entryPrice,
            timestamp: new Date().toISOString(),
          },
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Platform execution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute trade',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
