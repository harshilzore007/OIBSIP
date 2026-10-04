import { useEffect, useState, useRef } from 'react';
import type { Order, InventoryItem } from '../types';

type RealtimeCallback = (data: any) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<RealtimeCallback>> = new Map();
  private reconnectTimer: any = null;
  private isConnected = false;
  private pingInterval: any = null;

  constructor() {
    this.connect();
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connection_change', { connected: true });
        
        // Start keep-alive ping
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type) {
            this.emit(data.type, data);
          }
          if (data.event) {
            this.emit(data.event, data);
          }
          this.emit('*', data);
        } catch (err) {
          console.error('Realtime parse error:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        clearInterval(this.pingInterval);
        this.emit('connection_change', { connected: false });
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch (err) {
      console.warn('Realtime connection error:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  public on(event: string, callback: RealtimeCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in realtime handler for ${event}:`, e);
        }
      }
    }
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  public simulateOrderStep(orderId: string, adminToken?: string) {
    this.send({ type: 'order:simulate_step', orderId, token: adminToken });
  }

  public quickRestock(itemId: string, amount: number = 25, adminToken?: string) {
    this.send({ type: 'inventory:quick_restock', itemId, amount, token: adminToken });
  }

  public sendCourierMessage(orderId: string, message: string, senderName: string = 'Customer') {
    this.send({
      type: 'courier:send_message',
      orderId,
      message,
      sender: 'customer',
      senderName,
    });
  }

  public requestPulse() {
    this.send({ type: 'pizzeria:request_pulse' });
  }

  public getStatus() {
    return this.isConnected;
  }
}

export const realtime = new RealtimeClient();

export function useRealtimeStatus() {
  const [connected, setConnected] = useState<boolean>(realtime.getStatus());

  useEffect(() => {
    const unsubscribe = realtime.on('connection_change', (evt: { connected: boolean }) => {
      setConnected(evt.connected);
    });
    return unsubscribe;
  }, []);

  return connected;
}

export function usePizzeriaPulse() {
  const [pulse, setPulse] = useState<import('../types').PizzeriaPulse>({
    activeOrdersCount: 2,
    bakingCount: 5,
    onDeliveryCount: 1,
    deliveredTodayCount: 34,
    hearthTempFahrenheit: 810,
    averagePrepTimeMins: 20,
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    // Listen for pulse events
    const unsub = realtime.on('pizzeria:pulse', (data) => {
      if (data) {
        setPulse((prev) => ({ ...prev, ...data }));
      }
    });

    // Request initial pulse
    realtime.requestPulse();

    // Pulse periodically every 12 seconds
    const interval = setInterval(() => {
      realtime.requestPulse();
    }, 12000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  return pulse;
}

