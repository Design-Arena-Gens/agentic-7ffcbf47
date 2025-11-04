export interface Trade {
  id: string;
  timestamp: Date;
  pair: string;
  direction: 'buy' | 'sell';
  entryPrice: number;
  lotSize: number;
  timeframe: string;
  stopLoss: number;
  takeProfit: number;
  status: 'pending' | 'executed' | 'failed' | 'closed';
  platform?: string;
  error?: string;
}

export interface TradeLog {
  id: string;
  tradeId: string;
  timestamp: Date;
  action: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export interface TradingPlatformConfig {
  name: string;
  apiKey: string;
  apiSecret: string;
  endpoint: string;
  accountId?: string;
}

export interface MirrorConfig {
  enabled: boolean;
  platforms: TradingPlatformConfig[];
  retryAttempts: number;
  retryDelay: number;
  notifications: boolean;
}
