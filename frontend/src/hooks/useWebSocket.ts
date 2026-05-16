'use client';

import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: 'NEW_REPORT' | 'STATUS_UPDATE';
  data: string | { reportId: string; status: string };
}

// Singleton WebSocket manager to prevent multiple connections to the same URL
class WebSocketManager {
  private static instances = new Map<string, {
    ws: WebSocket | null;
    listeners: Set<(message: WebSocketMessage) => void>;
    connectionState: {
      isConnected: boolean;
      error: string | null;
      retryCount: number;
      isConnecting: boolean;
    };
    timeouts: {
      connectionTimeout: NodeJS.Timeout | null;
      retryTimeout: NodeJS.Timeout | null;
    };
  }>();

  static getInstance(url: string) {
    if (!this.instances.has(url)) {
      this.instances.set(url, {
        ws: null,
        listeners: new Set(),
        connectionState: {
          isConnected: false,
          error: null,
          retryCount: 0,
          isConnecting: false
        },
        timeouts: {
          connectionTimeout: null,
          retryTimeout: null
        }
      });
    }
    return this.instances.get(url)!;
  }

  static addListener(url: string, callback: (message: WebSocketMessage) => void) {
    const instance = this.getInstance(url);
    instance.listeners.add(callback);
    
    // Start connection if this is the first listener
    if (instance.listeners.size === 1) {
      this.connect(url);
    }
    
    // Add user interaction listener to retry connection
    const retryOnInteraction = () => {
      if (!instance.connectionState.isConnected && instance.connectionState.retryCount > 0) {
        console.log('User interaction detected, retrying WebSocket connection');
        instance.connectionState.retryCount = 0;
        this.connect(url);
      }
    };
    
    // Add event listeners for user interaction
    document.addEventListener('click', retryOnInteraction);
    document.addEventListener('focus', retryOnInteraction);
    
    return () => {
      instance.listeners.delete(callback);
      
      // Remove event listeners
      document.removeEventListener('click', retryOnInteraction);
      document.removeEventListener('focus', retryOnInteraction);
      
      // Close connection if this was the last listener
      if (instance.listeners.size === 0 && instance.ws) {
        instance.ws.close();
        instance.ws = null;
      }
    };
  }

  static getConnectionState(url: string) {
    const instance = this.getInstance(url);
    return instance.connectionState;
  }

  private static async connect(url: string) {
    const instance = this.getInstance(url);
    
    // Prevent multiple concurrent connections
    if (instance.connectionState.isConnecting || 
        (instance.ws && instance.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket connection already in progress, skipping');
      return;
    }
    
    instance.connectionState.isConnecting = true;
    
    try {
      // Clear any existing connection
      if (instance.ws) {
        if (instance.ws.readyState === WebSocket.OPEN || instance.ws.readyState === WebSocket.CONNECTING) {
          console.log('Closing existing WebSocket connection');
          instance.ws.close();
        }
        instance.ws = null;
      }

      console.log('=== WebSocket Connection Attempt ===');
      console.log('WebSocket URL:', url);
      console.log('Browser WebSocket support:', typeof WebSocket !== 'undefined');
      console.log('Retry count:', instance.connectionState.retryCount);
      
      // Small delay to ensure page is fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const websocket = new WebSocket(url);
      console.log('WebSocket object created, readyState:', websocket.readyState);
      instance.ws = websocket;

      // Set connection timeout
      instance.timeouts.connectionTimeout = setTimeout(() => {
        if (websocket.readyState === WebSocket.CONNECTING) {
          console.error('WebSocket connection timeout');
          websocket.close();
          instance.connectionState.isConnected = false;
          instance.connectionState.error = 'Connection timeout';
          instance.connectionState.isConnecting = false;
        }
      }, 5000);

      websocket.onopen = () => {
        if (instance.timeouts.connectionTimeout) {
          clearTimeout(instance.timeouts.connectionTimeout);
          instance.timeouts.connectionTimeout = null;
        }
        
        instance.connectionState.isConnecting = false;
        console.log('✅ WebSocket connected successfully');
        instance.connectionState.isConnected = true;
        instance.connectionState.error = null;
        instance.connectionState.retryCount = 0;
      };

      websocket.onmessage = (event: MessageEvent) => {
        try {
          const message = event.data;
          console.log('📨 WebSocket received raw message:', message);
          let parsedMessage: WebSocketMessage;

          if (message.startsWith('NEW_REPORT:')) {
            parsedMessage = {
              type: 'NEW_REPORT',
              data: message.split(':')[1]
            };
            console.log('📝 Parsed NEW_REPORT message:', parsedMessage);
          } else if (message.startsWith('STATUS_UPDATE:')) {
            const parts = message.split(':');
            parsedMessage = {
              type: 'STATUS_UPDATE',
              data: {
                reportId: parts[1],
                status: parts[2]
              }
            };
            console.log('📝 Parsed STATUS_UPDATE message:', parsedMessage);
          } else {
            // Echo message from server, ignore but log it
            console.log('📨 Echo message from server, ignoring:', message);
            return;
          }

          // Notify all listeners
          console.log(`📢 Broadcasting to ${instance.listeners.size} listeners`);
          instance.listeners.forEach(listener => {
            try {
              listener(parsedMessage);
            } catch (error) {
              console.error('Error in WebSocket listener:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = (event: CloseEvent) => {
        if (instance.timeouts.connectionTimeout) {
          clearTimeout(instance.timeouts.connectionTimeout);
          instance.timeouts.connectionTimeout = null;
        }
        
        instance.connectionState.isConnecting = false;
        console.log('🔌 WebSocket disconnected');
        console.log('Close code:', event.code);
        console.log('Close reason:', event.reason);
        console.log('Was clean:', event.wasClean);
        instance.connectionState.isConnected = false;
        instance.connectionState.error = 'WebSocket connection closed';
        instance.connectionState.retryCount++;
        
        // Attempt reconnection if there are still listeners and retry count is reasonable
        if (instance.listeners.size > 0 && instance.connectionState.retryCount <= 3) {
          const delay = Math.min(2000 * Math.pow(2, instance.connectionState.retryCount), 10000);
          console.log(`WebSocket reconnecting in ${delay}ms (attempt ${instance.connectionState.retryCount}/3)`);
          instance.timeouts.retryTimeout = setTimeout(() => this.connect(url), delay);
        } else {
          console.log('WebSocket reconnection paused - will retry on user interaction');
          instance.connectionState.error = 'Connection temporarily unavailable';
        }
      };

      websocket.onerror = (error: Event) => {
        if (instance.timeouts.connectionTimeout) {
          clearTimeout(instance.timeouts.connectionTimeout);
          instance.timeouts.connectionTimeout = null;
        }
        
        instance.connectionState.isConnecting = false;
        
        // Simplified error logging to reduce console noise
        console.warn('WebSocket connection error (this is normal during development)');
        
        // Set a generic error message without extensive logging
        instance.connectionState.error = 'WebSocket connection unavailable';
        instance.connectionState.isConnected = false;
        
        // Don't immediately retry on error - let the onclose handler handle reconnection
        // This prevents rapid connection attempts that can overwhelm the server
      };

    } catch (error: unknown) {
      console.error('Error creating WebSocket connection:', error);
      console.error('WebSocket URL that failed:', url);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'No message available');
      instance.connectionState.isConnected = false;
      instance.connectionState.error = 'Failed to create WebSocket connection';
      instance.connectionState.isConnecting = false;
    }
  }
}

export function useWebSocket(url: string, onMessage?: (message: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Add listener to the WebSocket manager
    const removeListener = WebSocketManager.addListener(url, (message) => {
      setLastMessage(message);
      onMessage?.(message);
    });

    // Monitor connection state changes
    const checkConnectionState = () => {
      const state = WebSocketManager.getConnectionState(url);
      setIsConnected(state.isConnected);
      setConnectionError(state.error);
    };

    // Check connection state immediately and then periodically
    checkConnectionState();
    const interval = setInterval(checkConnectionState, 1000);

    return () => {
      clearInterval(interval);
      removeListener();
    };
  }, [url, onMessage]);

  const sendMessage = (message: string) => {
    const instance = WebSocketManager.getInstance(url);
    if (instance.ws && instance.ws.readyState === WebSocket.OPEN) {
      instance.ws.send(message);
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  };

  return {
    isConnected,
    lastMessage,
    connectionError,
    sendMessage
  };
}
