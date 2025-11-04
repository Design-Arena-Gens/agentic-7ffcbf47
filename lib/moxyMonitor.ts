import { Trade } from '@/types/trade';

export class MoxyMonitor {
  private isMonitoring: boolean = false;
  private intervalId?: NodeJS.Timeout;
  private lastTradeId: string = '';
  private onTradeDetected?: (trade: Trade) => void;

  constructor(onTradeDetected?: (trade: Trade) => void) {
    this.onTradeDetected = onTradeDetected;
  }

  start(interval: number = 5000) {
    if (this.isMonitoring) {
      console.log('Monitor already running');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting MoxyAI monitor...');

    this.intervalId = setInterval(() => {
      this.checkForNewTrades();
    }, interval);

    this.checkForNewTrades();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isMonitoring = false;
    console.log('MoxyAI monitor stopped');
  }

  private async checkForNewTrades() {
    try {
      const trade = await this.fetchLatestTrade();

      if (trade && trade.id !== this.lastTradeId) {
        this.lastTradeId = trade.id;
        console.log('New trade detected:', trade);

        if (this.onTradeDetected) {
          this.onTradeDetected(trade);
        }
      }
    } catch (error) {
      console.error('Error checking for trades:', error);
    }
  }

  private async fetchLatestTrade(): Promise<Trade | null> {
    try {
      const response = await fetch('/api/moxy/latest');

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.trade;
    } catch (error) {
      console.error('Error fetching latest trade:', error);
      return null;
    }
  }

  isRunning(): boolean {
    return this.isMonitoring;
  }
}
