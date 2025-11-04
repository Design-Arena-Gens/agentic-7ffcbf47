import { Trade, TradingPlatformConfig } from '@/types/trade';
import crypto from 'crypto';

export interface PlatformAdapter {
  execute(trade: Trade, config: TradingPlatformConfig): Promise<any>;
}

export class MetaTraderAdapter implements PlatformAdapter {
  async execute(trade: Trade, config: TradingPlatformConfig): Promise<any> {
    const payload = {
      symbol: trade.pair.replace('/', ''),
      type: trade.direction === 'buy' ? 0 : 1,
      volume: trade.lotSize,
      price: trade.entryPrice,
      sl: trade.stopLoss,
      tp: trade.takeProfit,
      comment: `Mirror-${trade.id}`,
    };

    const signature = this.generateSignature(payload, config.apiSecret);

    const response = await fetch(`${config.endpoint}/order/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        'X-Signature': signature,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MetaTrader API error: ${error}`);
    }

    return await response.json();
  }

  private generateSignature(payload: any, secret: string): string {
    const data = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }
}

export class TradingViewAdapter implements PlatformAdapter {
  async execute(trade: Trade, config: TradingPlatformConfig): Promise<any> {
    const payload = {
      ticker: trade.pair,
      action: trade.direction,
      quantity: trade.lotSize,
      price: trade.entryPrice,
      stop_loss: trade.stopLoss,
      take_profit: trade.takeProfit,
      timeframe: trade.timeframe,
    };

    const response = await fetch(`${config.endpoint}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TradingView API error: ${error}`);
    }

    return await response.json();
  }
}

export class GenericAdapter implements PlatformAdapter {
  async execute(trade: Trade, config: TradingPlatformConfig): Promise<any> {
    const payload = {
      pair: trade.pair,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      lotSize: trade.lotSize,
      timeframe: trade.timeframe,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      tradeId: trade.id,
    };

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        'X-API-Secret': config.apiSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Platform API error: ${error}`);
    }

    return await response.json();
  }
}

export function getPlatformAdapter(platformName: string): PlatformAdapter {
  switch (platformName.toLowerCase()) {
    case 'metatrader':
    case 'mt4':
    case 'mt5':
      return new MetaTraderAdapter();
    case 'tradingview':
      return new TradingViewAdapter();
    default:
      return new GenericAdapter();
  }
}
