/**
 * WebSocket 客户端实现
 * 基于状态机和发布订阅模式，支持单链路多通路复用
 */

import { WSState, ChannelType, MessageType } from './types';
import type { WSMessage, SubscribeCallback, WSOptions, StateChangeCallback } from './types';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  // 连接状态
  private state: WSState = WSState.DISCONNECTED;
  // 重连定时器
  private reconnectTimer: number | null = null;
  // 心跳定时器
  private heartbeatTimer: number | null = null;
  // 心跳超时定时器
  private heartbeatTimeoutTimer: number | null = null;
  // 重连尝试次数
  private reconnectAttempts: number = 0;
  
  // 配置选项
  private options: {
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
    heartbeatTimeout: number;
    onStateChange?: StateChangeCallback;
  };
  
  // 发布订阅：每个通道对应多个订阅者
  private subscribers: Map<ChannelType, Set<SubscribeCallback>> = new Map();
  
  // 待发送的消息队列（连接断开时暂存）
  private messageQueue: WSMessage[] = [];

  constructor(options: WSOptions) {
    this.url = options.url;
    this.options = {
      reconnectInterval: options.reconnectInterval ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? Infinity,
      heartbeatInterval: options.heartbeatInterval ?? 30000,
      heartbeatTimeout: options.heartbeatTimeout ?? 10000,
      onStateChange: options.onStateChange
    };
    
    // 初始化所有通道的订阅者集合
    // 如果需要新增ws频道，只需要在ChannelType添加类型
    Object.values(ChannelType).forEach(channel => {
      this.subscribers.set(channel, new Set());
    });
  }

  /**
   * 连接 WebSocket
   */
  connect(): void {
    if (this.state === WSState.CONNECTED || this.state === WSState.CONNECTING) {
      console.warn('WebSocket 已连接或正在连接中');
      return;
    }

    this.setState(WSState.CONNECTING);
    
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket 连接失败:', error);
      this.setState(WSState.ERROR);
      this.scheduleReconnect();
    }
  }

  /**
   * 设置 WebSocket 事件处理器
   * 比如有事件：ws 连接(opopen)，心跳检测，重新订阅所有已经订阅的频道，发送队列中存在的消息
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket 连接已建立');
      this.setState(WSState.CONNECTED);
      this.reconnectAttempts = 0;
      
      // 启动心跳检测
      this.startHeartbeat();
      
      // 重新订阅所有已订阅的通道
      this.resubscribeAll();
      
      // 发送队列中的消息
      this.flushMessageQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      this.setState(WSState.ERROR);
    };

    this.ws.onclose = () => {
      console.log('WebSocket 连接已关闭');
      this.setState(WSState.DISCONNECTED);
      this.stopHeartbeat();
      
      // 如果未达到最大重连次数，则尝试重连
      if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else {
        console.error('已达到最大重连次数，停止重连');
      }
    };
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WSMessage): void {
    switch (message.type) {
      case MessageType.PONG:
        // 收到心跳响应，清除超时定时器
        this.clearHeartbeatTimeout();
        break;
        
      case MessageType.DATA:
        // 数据消息，根据通道分发给订阅者
        if (message.channel) {
          this.notifySubscribers(message.channel, message.data);
        }
        break;
        
      case MessageType.ERROR:
        console.error('服务器错误:', message.data);
        break;
        
      default:
        console.warn('未知消息类型:', message.type);
    }
  }

  /**
   * 订阅指定通道
   */
  subscribe(channel: ChannelType, callback: SubscribeCallback): () => void {
    const callbacks = this.subscribers.get(channel);
    if (!callbacks) {
      console.error(`未知通道: ${channel}`);
      return () => {};
    }

    callbacks.add(callback);
    
    // 如果已连接，向服务器发送订阅请求
    if (this.state === WSState.CONNECTED && this.ws) {
      this.send({
        type: MessageType.SUBSCRIBE,
        channel,
        timestamp: Date.now()
      });
    }

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(channel, callback);
    };
  }

  /**
   * 取消订阅指定通道
   */
  unsubscribe(channel: ChannelType, callback: SubscribeCallback): void {
    const callbacks = this.subscribers.get(channel);
    if (callbacks) {
      callbacks.delete(callback);
      
      // 如果已连接，向服务器发送取消订阅请求
      if (this.state === WSState.CONNECTED && this.ws) {
        this.send({
          type: MessageType.UNSUBSCRIBE,
          channel,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(channel: ChannelType, data: any): void {
    const callbacks = this.subscribers.get(channel);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('订阅回调执行失败:', error);
        }
      });
    }
  }

  /**
   * 重新订阅所有已订阅的通道
   */
  private resubscribeAll(): void {
    this.subscribers.forEach((callbacks, channel) => {
      if (callbacks.size > 0 && this.ws) {
        this.send({
          type: MessageType.SUBSCRIBE,
          channel,
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * 发送消息
   */
  send(message: WSMessage): void {
    if (this.state === WSState.CONNECTED && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('发送消息失败:', error);
        // 发送失败，加入队列等待重连后发送
        this.messageQueue.push(message);
      }
    } else {
      // 未连接，加入队列
      this.messageQueue.push(message);
    }
  }

  /**
   * 清空消息队列
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = window.setInterval(() => {
      if (this.state === WSState.CONNECTED && this.ws) {
        // 发送心跳请求
        this.send({
          type: MessageType.PING,
          timestamp: Date.now()
        });
        
        // 设置心跳超时
        this.heartbeatTimeoutTimer = window.setTimeout(() => {
          console.warn('心跳超时，关闭连接');
          if (this.ws) {
            this.ws.close();
          }
        }, this.options.heartbeatTimeout);
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearHeartbeatTimeout();
  }

  /**
   * 清除心跳超时定时器
   */
  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer !== null) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      return; // 已有重连计划
    }

    this.setState(WSState.RECONNECTING);
    this.reconnectAttempts++;

    console.log(`准备重连 (第 ${this.reconnectAttempts} 次)...`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.options.reconnectInterval);
  }

  /**
   * 设置状态
   */
  private setState(newState: WSState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      console.log(`WebSocket 状态变化: ${oldState} -> ${newState}`);
      
      if (this.options.onStateChange) {
        this.options.onStateChange(newState);
      }
    }
  }

  /**
   * 获取当前状态
   */
  getState(): WSState {
    return this.state;
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setState(WSState.DISCONNECTED);
    this.messageQueue = [];
    this.reconnectAttempts = 0;
  }

  /**
   * 销毁客户端
   */
  destroy(): void {
    this.disconnect();
    this.subscribers.clear();
  }
}

