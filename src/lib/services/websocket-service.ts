/**
 * WebSocket Service for Real-Time Data
 * Sistema completo para streaming de dados financeiros em tempo real
 */

import { apmMonitoring } from './apm-monitoring';
import { Logger } from './logging';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id: string;
}

interface Subscription {
  id: string;
  type: 'market_data' | 'portfolio_updates' | 'notifications' | 'chat';
  symbols?: string[];
  userId?: string;
  callback: (data: any) => void;
  lastUpdate?: number;
}

interface ConnectionStats {
  connected: boolean;
  connectionTime: number;
  messagesReceived: number;
  messagesSent: number;
  errors: number;
  latency: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Subscription>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionStats: ConnectionStats = {
    connected: false,
    connectionTime: 0,
    messagesReceived: 0,
    messagesSent: 0,
    errors: 0,
    latency: 0
  };
  private logger = Logger.getInstance();
  private pingInterval = 30000; // 30 seconds
  private lastPingTime = 0;

  constructor() {
    this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  private async connect(): Promise<void> {
    try {
      const wsUrl = this.getWebSocketUrl();
      
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
      
      this.logger.info('WebSocket connection initiated', { url: wsUrl });
      
    } catch (error) {
      this.logger.error('WebSocket connection failed', { error });
      this.handleConnectionError();
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      this.logger.info('WebSocket connected');
      
      this.connectionStats.connected = true;
      this.connectionStats.connectionTime = Date.now();
      this.reconnectAttempts = 0;
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Resubscribe to all active subscriptions
      this.resubscribeAll();
      
      apmMonitoring.recordMetric('websocket_connection_success', 1);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = (event) => {
      this.logger.warn('WebSocket connection closed', { 
        code: event.code, 
        reason: event.reason 
      });
      
      this.connectionStats.connected = false;
      this.stopHeartbeat();
      
      if (!event.wasClean) {
        this.handleConnectionError();
      }
      
      apmMonitoring.recordMetric('websocket_connection_closed', 1);
    };

    this.ws.onerror = (error) => {
      this.logger.error('WebSocket error', { error });
      this.connectionStats.errors++;
      
      apmMonitoring.recordError(
        new Error('WebSocket error'),
        { error },
        'medium'
      );
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      this.connectionStats.messagesReceived++;
      
      // Calculate latency for ping responses
      if (message.type === 'pong') {
        this.connectionStats.latency = Date.now() - this.lastPingTime;
        apmMonitoring.recordMetric('websocket_latency', this.connectionStats.latency);
        return;
      }

      // Route message to appropriate subscribers
      this.routeMessage(message);
      
      apmMonitoring.recordMetric('websocket_messages_received', 1, {
        message_type: message.type
      });
      
    } catch (error) {
      this.logger.error('Failed to parse WebSocket message', { data, error });
      this.connectionStats.errors++;
    }
  }

  /**
   * Route message to subscribers
   */
  private routeMessage(message: WebSocketMessage): void {
    const relevantSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => this.isMessageRelevant(sub, message));

    relevantSubscriptions.forEach(subscription => {
      try {
        subscription.callback(message.payload);
        subscription.lastUpdate = Date.now();
      } catch (error) {
        this.logger.error('Subscription callback error', { 
          subscriptionId: subscription.id, 
          error 
        });
      }
    });
  }

  /**
   * Check if message is relevant to subscription
   */
  private isMessageRelevant(subscription: Subscription, message: WebSocketMessage): boolean {
    switch (subscription.type) {
      case 'market_data':
        return message.type === 'market_update' && 
               (!subscription.symbols || 
                subscription.symbols.includes(message.payload.symbol));
      
      case 'portfolio_updates':
        return message.type === 'portfolio_update' && 
               message.payload.userId === subscription.userId;
      
      case 'notifications':
        return message.type === 'notification' && 
               message.payload.userId === subscription.userId;
      
      case 'chat':
        return message.type === 'chat_message';
      
      default:
        return false;
    }
  }

  /**
   * Subscribe to market data
   */
  subscribeToMarketData(
    symbols: string[],
    callback: (data: any) => void
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: Subscription = {
      id: subscriptionId,
      type: 'market_data',
      symbols,
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message to server
    this.sendMessage({
      type: 'subscribe',
      payload: {
        subscription_type: 'market_data',
        symbols
      }
    });

    this.logger.info('Subscribed to market data', { symbols, subscriptionId });
    
    return subscriptionId;
  }

  /**
   * Subscribe to portfolio updates
   */
  subscribeToPortfolioUpdates(
    userId: string,
    callback: (data: any) => void
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: Subscription = {
      id: subscriptionId,
      type: 'portfolio_updates',
      userId,
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    this.sendMessage({
      type: 'subscribe',
      payload: {
        subscription_type: 'portfolio_updates',
        user_id: userId
      }
    });

    this.logger.info('Subscribed to portfolio updates', { userId, subscriptionId });
    
    return subscriptionId;
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(
    userId: string,
    callback: (data: any) => void
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: Subscription = {
      id: subscriptionId,
      type: 'notifications',
      userId,
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    this.sendMessage({
      type: 'subscribe',
      payload: {
        subscription_type: 'notifications',
        user_id: userId
      }
    });

    this.logger.info('Subscribed to notifications', { userId, subscriptionId });
    
    return subscriptionId;
  }

  /**
   * Subscribe to chat messages
   */
  subscribeToChatMessages(callback: (data: any) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: Subscription = {
      id: subscriptionId,
      type: 'chat',
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    this.sendMessage({
      type: 'subscribe',
      payload: {
        subscription_type: 'chat'
      }
    });

    this.logger.info('Subscribed to chat messages', { subscriptionId });
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      
      this.sendMessage({
        type: 'unsubscribe',
        payload: {
          subscription_id: subscriptionId
        }
      });

      this.logger.info('Unsubscribed', { subscriptionId, type: subscription.type });
    }
  }

  /**
   * Send message to WebSocket server
   */
  private sendMessage(data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('Cannot send message - WebSocket not connected', { data });
      return;
    }

    try {
      const message: WebSocketMessage = {
        ...data,
        timestamp: Date.now(),
        id: this.generateMessageId()
      };

      this.ws.send(JSON.stringify(message));
      this.connectionStats.messagesSent++;
      
      apmMonitoring.recordMetric('websocket_messages_sent', 1, {
        message_type: data.type
      });
      
    } catch (error) {
      this.logger.error('Failed to send WebSocket message', { data, error });
      this.connectionStats.errors++;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        this.sendMessage({ type: 'ping' });
      }
    }, this.pingInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle connection errors and implement reconnection logic
   */
  private handleConnectionError(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached');
      
      apmMonitoring.recordError(
        new Error('WebSocket max reconnection attempts reached'),
        { attempts: this.reconnectAttempts },
        'critical'
      );
      
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    this.logger.info(`Attempting to reconnect WebSocket in ${delay}ms`, {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    });

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Resubscribe to all active subscriptions after reconnection
   */
  private resubscribeAll(): void {
    this.subscriptions.forEach(subscription => {
      let payload: any = {
        subscription_type: subscription.type
      };

      switch (subscription.type) {
        case 'market_data':
          payload.symbols = subscription.symbols;
          break;
        case 'portfolio_updates':
        case 'notifications':
          payload.user_id = subscription.userId;
          break;
      }

      this.sendMessage({
        type: 'subscribe',
        payload
      });
    });

    this.logger.info(`Resubscribed to ${this.subscriptions.size} subscriptions`);
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WEBSOCKET_HOST || window.location.host;
    return `${protocol}//${host}/ws`;
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): ConnectionStats {
    return { ...this.connectionStats };
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Manually disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.subscriptions.clear();
    this.connectionStats.connected = false;
    
    this.logger.info('WebSocket manually disconnected');
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

/**
 * Market Data Streaming Service
 * Specialized service for real-time market data
 */
class MarketDataStreamingService {
  private wsService: WebSocketService;
  private subscriptionCallbacks = new Map<string, (data: any) => void>();
  private marketDataCache = new Map<string, any>();
  private logger = Logger.getInstance();

  constructor() {
    this.wsService = new WebSocketService();
  }

  /**
   * Subscribe to real-time price updates for specific symbols
   */
  subscribeToPriceUpdates(
    symbols: string[],
    callback: (data: { symbol: string; price: number; change: number; timestamp: number }) => void
  ): string {
    const subscriptionId = this.wsService.subscribeToMarketData(
      symbols,
      (data) => {
        // Process and normalize market data
        const normalizedData = this.normalizeMarketData(data);
        
        // Update cache
        normalizedData.forEach(item => {
          this.marketDataCache.set(item.symbol, item);
        });
        
        // Call user callback for each symbol
        normalizedData.forEach(callback);
        
        apmMonitoring.recordMetric('market_data_updates_processed', normalizedData.length);
      }
    );

    this.subscriptionCallbacks.set(subscriptionId, callback);
    
    return subscriptionId;
  }

  /**
   * Get last known price for a symbol
   */
  getLastPrice(symbol: string): any | null {
    return this.marketDataCache.get(symbol) || null;
  }

  /**
   * Get all cached market data
   */
  getAllMarketData(): Map<string, any> {
    return new Map(this.marketDataCache);
  }

  /**
   * Subscribe to market indices (S&P 500, NASDAQ, etc.)
   */
  subscribeToIndices(
    callback: (data: { index: string; value: number; change: number }) => void
  ): string {
    return this.subscribeToPriceUpdates(
      ['SPY', 'QQQ', 'DIA', 'IWM'], // Major ETFs representing indices
      (data) => {
        callback({
          index: this.getIndexName(data.symbol),
          value: data.price,
          change: data.change
        });
      }
    );
  }

  /**
   * Subscribe to crypto prices
   */
  subscribeToCrypto(
    symbols: string[],
    callback: (data: { symbol: string; price: number; change: number }) => void
  ): string {
    return this.subscribeToPriceUpdates(
      symbols.map(s => `${s}-USD`), // Append USD pair
      callback
    );
  }

  /**
   * Unsubscribe from market data
   */
  unsubscribe(subscriptionId: string): void {
    this.wsService.unsubscribe(subscriptionId);
    this.subscriptionCallbacks.delete(subscriptionId);
  }

  /**
   * Normalize incoming market data
   */
  private normalizeMarketData(rawData: any): Array<{
    symbol: string;
    price: number;
    change: number;
    timestamp: number;
  }> {
    // Handle different market data formats
    if (Array.isArray(rawData)) {
      return rawData.map(item => this.normalizeDataItem(item));
    } else {
      return [this.normalizeDataItem(rawData)];
    }
  }

  private normalizeDataItem(item: any): {
    symbol: string;
    price: number;
    change: number;
    timestamp: number;
  } {
    return {
      symbol: item.symbol || item.s,
      price: parseFloat(item.price || item.p),
      change: parseFloat(item.change || item.c || 0),
      timestamp: item.timestamp || item.t || Date.now()
    };
  }

  private getIndexName(symbol: string): string {
    const indexMap: Record<string, string> = {
      'SPY': 'S&P 500',
      'QQQ': 'NASDAQ',
      'DIA': 'Dow Jones',
      'IWM': 'Russell 2000'
    };
    
    return indexMap[symbol] || symbol;
  }

  /**
   * Get connection health
   */
  getConnectionHealth(): {
    connected: boolean;
    latency: number;
    subscriptions: number;
    dataPoints: number;
  } {
    const stats = this.wsService.getConnectionStats();
    
    return {
      connected: stats.connected,
      latency: stats.latency,
      subscriptions: this.wsService.getActiveSubscriptionsCount(),
      dataPoints: this.marketDataCache.size
    };
  }
}

// Global instances
export const webSocketService = new WebSocketService();
export const marketDataService = new MarketDataStreamingService();

export { WebSocketService, MarketDataStreamingService };
export type { WebSocketMessage, Subscription, ConnectionStats }; 