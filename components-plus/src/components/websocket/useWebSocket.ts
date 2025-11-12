/**
 * React Hook for WebSocket 客户端
 * 方便在 React 组件中使用
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient } from './client';
import { WSState, ChannelType } from './types';
import type { SubscribeCallback, WSOptions } from './types';

export interface UseWebSocketOptions extends Omit<WSOptions, 'onStateChange'> {
  autoConnect?: boolean; // 是否自动连接，默认 true
}

export interface UseWebSocketReturn {
  client: WebSocketClient | null;
  state: WSState;
  connect: () => void;
  disconnect: () => void;
  subscribe: (channel: ChannelType, callback: SubscribeCallback) => () => void;
  isConnected: boolean;
}

/**
 * WebSocket Hook
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  // 连接状态
  const [state, setState] = useState<WSState>(WSState.DISCONNECTED);
  // WebSocket 客户端实例
  const clientRef = useRef<WebSocketClient | null>(null);

  // 创建客户端实例
  useEffect(() => {
    const client = new WebSocketClient({
      ...options,
      onStateChange: (newState) => {
        setState(newState);
      }
    });

    clientRef.current = client;

    // 自动连接
    if (options.autoConnect === true) {
      client.connect();
    }

    // 清理函数
    return () => {
      client.destroy();
      clientRef.current = null;
    };
  }, [options.url]); // 只在 URL 变化时重新创建

  // 连接
  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  // 断开连接
  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  // 订阅通道
  const subscribe = useCallback((channel: ChannelType, callback: SubscribeCallback) => {
    if (!clientRef.current) {
      console.warn('WebSocket 客户端未初始化');
      return () => {};
    }
    return clientRef.current.subscribe(channel, callback);
  }, []);

  return {
    client: clientRef.current,
    state,
    connect,
    disconnect,
    subscribe,
    isConnected: state === WSState.CONNECTED
  };
}

