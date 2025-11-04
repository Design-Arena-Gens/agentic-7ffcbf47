import { Trade, TradeLog, TradingPlatformConfig } from '@/types/trade';

export class TradeReplicator {
  private config: TradingPlatformConfig[];
  private retryAttempts: number;
  private retryDelay: number;

  constructor(
    config: TradingPlatformConfig[],
    retryAttempts: number = 3,
    retryDelay: number = 2000
  ) {
    this.config = config;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
  }

  async replicateTrade(trade: Trade): Promise<{ success: boolean; logs: TradeLog[] }> {
    const logs: TradeLog[] = [];

    logs.push({
      id: `${Date.now()}-init`,
      tradeId: trade.id,
      timestamp: new Date(),
      action: 'REPLICATE_STARTED',
      status: 'success',
      message: `Starting replication of trade ${trade.id} (${trade.pair} ${trade.direction})`,
    });

    let allSuccess = true;

    for (const platform of this.config) {
      const result = await this.executeTrade(trade, platform);
      logs.push(...result.logs);

      if (!result.success) {
        allSuccess = false;
      }
    }

    logs.push({
      id: `${Date.now()}-complete`,
      tradeId: trade.id,
      timestamp: new Date(),
      action: 'REPLICATE_COMPLETED',
      status: allSuccess ? 'success' : 'error',
      message: allSuccess
        ? 'Trade replicated successfully to all platforms'
        : 'Trade replication completed with errors',
    });

    return { success: allSuccess, logs };
  }

  private async executeTrade(
    trade: Trade,
    platform: TradingPlatformConfig
  ): Promise<{ success: boolean; logs: TradeLog[] }> {
    const logs: TradeLog[] = [];
    let attempt = 0;
    let success = false;

    while (attempt < this.retryAttempts && !success) {
      attempt++;

      try {
        logs.push({
          id: `${Date.now()}-${platform.name}-attempt-${attempt}`,
          tradeId: trade.id,
          timestamp: new Date(),
          action: 'EXECUTE_TRADE',
          status: 'warning',
          message: `Attempting to execute trade on ${platform.name} (attempt ${attempt}/${this.retryAttempts})`,
        });

        const result = await this.sendToPlatform(trade, platform);

        if (result.success) {
          success = true;
          logs.push({
            id: `${Date.now()}-${platform.name}-success`,
            tradeId: trade.id,
            timestamp: new Date(),
            action: 'TRADE_EXECUTED',
            status: 'success',
            message: `Trade executed successfully on ${platform.name}`,
            details: result.data,
          });
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (error: any) {
        logs.push({
          id: `${Date.now()}-${platform.name}-error-${attempt}`,
          tradeId: trade.id,
          timestamp: new Date(),
          action: 'EXECUTE_FAILED',
          status: 'error',
          message: `Failed to execute trade on ${platform.name}: ${error.message}`,
          details: { attempt, error: error.message },
        });

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay);
        }
      }
    }

    if (!success) {
      logs.push({
        id: `${Date.now()}-${platform.name}-final-fail`,
        tradeId: trade.id,
        timestamp: new Date(),
        action: 'TRADE_FAILED',
        status: 'error',
        message: `Failed to execute trade on ${platform.name} after ${this.retryAttempts} attempts`,
      });
    }

    return { success, logs };
  }

  private async sendToPlatform(
    trade: Trade,
    platform: TradingPlatformConfig
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch('/api/platform/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trade,
          platform,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Request failed' };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
