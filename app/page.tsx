'use client';

import { useState, useEffect } from 'react';
import { Trade, TradeLog, TradingPlatformConfig } from '@/types/trade';
import { MoxyMonitor } from '@/lib/moxyMonitor';
import { TradeReplicator } from '@/lib/tradeReplicator';
import { Activity, PlayCircle, StopCircle, Settings, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function Home() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [platforms, setPlatforms] = useState<TradingPlatformConfig[]>([
    {
      name: 'MetaTrader',
      apiKey: 'demo-key-123',
      apiSecret: 'demo-secret-456',
      endpoint: 'https://mt5-api.example.com',
      accountId: 'ACC-123456',
    },
  ]);
  const [showSettings, setShowSettings] = useState(false);
  const [monitor, setMonitor] = useState<MoxyMonitor | null>(null);

  const handleTradeDetected = async (trade: Trade) => {
    console.log('Trade detected, replicating...', trade);

    const replicator = new TradeReplicator(platforms, 3, 2000);
    const result = await replicator.replicateTrade(trade);

    const updatedTrade = {
      ...trade,
      status: result.success ? ('executed' as const) : ('failed' as const),
    };

    await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trade: updatedTrade,
        tradeLogs: result.logs,
      }),
    });

    setTrades((prev) => [updatedTrade, ...prev]);
    setLogs((prev) => [...result.logs, ...prev]);
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      monitor?.stop();
      setIsMonitoring(false);
    } else {
      const newMonitor = new MoxyMonitor(handleTradeDetected);
      newMonitor.start(5000);
      setMonitor(newMonitor);
      setIsMonitoring(true);
    }
  };

  const loadTrades = async () => {
    try {
      const response = await fetch('/api/trades');
      const data = await response.json();
      if (data.success) {
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Failed to load trades:', error);
    }
  };

  useEffect(() => {
    loadTrades();

    return () => {
      monitor?.stop();
    };
  }, []);

  const addPlatform = () => {
    setPlatforms([
      ...platforms,
      {
        name: '',
        apiKey: '',
        apiSecret: '',
        endpoint: '',
      },
    ]);
  };

  const updatePlatform = (index: number, field: keyof TradingPlatformConfig, value: string) => {
    const updated = [...platforms];
    updated[index] = { ...updated[index], [field]: value };
    setPlatforms(updated);
  };

  const removePlatform = (index: number) => {
    setPlatforms(platforms.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-10 h-10 text-blue-400" />
              <div>
                <h1 className="text-4xl font-bold">MoxyAI Trade Mirror</h1>
                <p className="text-gray-400 mt-1">Automated trade replication system</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                <Settings className="w-5 h-5" />
                Settings
              </button>

              <button
                onClick={toggleMonitoring}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                  isMonitoring
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isMonitoring ? (
                  <>
                    <StopCircle className="w-5 h-5" />
                    Stop Monitoring
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    Start Monitoring
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <Activity className={`w-5 h-5 ${isMonitoring ? 'text-green-400 animate-pulse' : 'text-gray-500'}`} />
            <span className="text-sm">
              Status: <strong>{isMonitoring ? 'Monitoring Active' : 'Inactive'}</strong>
            </span>
            <span className="text-gray-500 mx-2">|</span>
            <span className="text-sm">
              Platforms: <strong>{platforms.length}</strong>
            </span>
            <span className="text-gray-500 mx-2">|</span>
            <span className="text-sm">
              Trades: <strong>{trades.length}</strong>
            </span>
          </div>
        </header>

        {showSettings && (
          <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Platform Configuration
            </h2>

            <div className="space-y-4">
              {platforms.map((platform, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Platform Name</label>
                      <input
                        type="text"
                        value={platform.name}
                        onChange={(e) => updatePlatform(index, 'name', e.target.value)}
                        placeholder="MetaTrader, TradingView, etc."
                        className="w-full px-3 py-2 bg-gray-600 rounded border border-gray-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">API Endpoint</label>
                      <input
                        type="text"
                        value={platform.endpoint}
                        onChange={(e) => updatePlatform(index, 'endpoint', e.target.value)}
                        placeholder="https://api.platform.com"
                        className="w-full px-3 py-2 bg-gray-600 rounded border border-gray-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">API Key</label>
                      <input
                        type="text"
                        value={platform.apiKey}
                        onChange={(e) => updatePlatform(index, 'apiKey', e.target.value)}
                        placeholder="Your API key"
                        className="w-full px-3 py-2 bg-gray-600 rounded border border-gray-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">API Secret</label>
                      <input
                        type="password"
                        value={platform.apiSecret}
                        onChange={(e) => updatePlatform(index, 'apiSecret', e.target.value)}
                        placeholder="Your API secret"
                        className="w-full px-3 py-2 bg-gray-600 rounded border border-gray-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removePlatform(index)}
                    className="mt-3 text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove Platform
                  </button>
                </div>
              ))}

              <button
                onClick={addPlatform}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
              >
                + Add Platform
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Recent Trades</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {trades.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  {isMonitoring ? 'Waiting for trades...' : 'Start monitoring to see trades'}
                </p>
              ) : (
                trades.map((trade) => (
                  <div key={trade.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{trade.pair}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            trade.direction === 'buy'
                              ? 'bg-green-600'
                              : 'bg-red-600'
                          }`}
                        >
                          {trade.direction.toUpperCase()}
                        </span>
                      </div>

                      {trade.status === 'executed' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : trade.status === 'failed' ? (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <Activity className="w-5 h-5 text-yellow-400 animate-pulse" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Entry:</span> {trade.entryPrice}
                      </div>
                      <div>
                        <span className="text-gray-400">Lot:</span> {trade.lotSize}
                      </div>
                      <div>
                        <span className="text-gray-400">SL:</span> {trade.stopLoss}
                      </div>
                      <div>
                        <span className="text-gray-400">TP:</span> {trade.takeProfit}
                      </div>
                      <div>
                        <span className="text-gray-400">TF:</span> {trade.timeframe}
                      </div>
                      <div>
                        <span className="text-gray-400">Time:</span>{' '}
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Activity Log</h2>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No activity yet</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg text-sm ${
                      log.status === 'success'
                        ? 'bg-green-900/30 border-l-4 border-green-500'
                        : log.status === 'error'
                        ? 'bg-red-900/30 border-l-4 border-red-500'
                        : 'bg-yellow-900/30 border-l-4 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{log.action}</div>
                        <div className="text-gray-300 mt-1">{log.message}</div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <footer className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>
            MoxyAI Trade Mirror v1.0 | Secure, Real-time, Automated
          </p>
          <p className="mt-2">
            Monitor: MoxyAI.com → Replicate: Your Trading Platform
          </p>
        </footer>
      </div>
    </div>
  );
}
