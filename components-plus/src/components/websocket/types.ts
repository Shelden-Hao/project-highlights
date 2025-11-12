/**
 * WebSocket 消息类型定义
 */

// WebSocket 连接状态
export const WSState = {
  DISCONNECTED: 'DISCONNECTED',    // 未连接
  CONNECTING: 'CONNECTING',        // 连接中
  CONNECTED: 'CONNECTED',          // 已连接
  RECONNECTING: 'RECONNECTING',    // 重连中
  ERROR: 'ERROR'                   // 错误状态
} as const;

export type WSState = typeof WSState[keyof typeof WSState];

// 消息通道类型（用于单链路多通路复用）
export const ChannelType = {
  THREAT_DASHBOARD: 'threat_dashboard',  // 威胁感知大屏
  HONEYPOT_LOG: 'honeypot_log',          // 密网日志
  DECOY_GENERATION: 'decoy_generation'   // 诱饵生成内容
} as const;

export type ChannelType = typeof ChannelType[keyof typeof ChannelType];

// 消息类型
export const MessageType = {
  // 系统消息
  PING: 'ping',                    // 心跳请求
  PONG: 'pong',                    // 心跳响应
  SUBSCRIBE: 'subscribe',          // 订阅通道
  UNSUBSCRIBE: 'unsubscribe',      // 取消订阅
  ERROR: 'error',                  // 错误消息
  
  // 业务消息
  DATA: 'data'                     // 数据消息
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

// WebSocket 消息格式
export interface WSMessage {
  type: MessageType;
  channel?: ChannelType;            // 通道类型（用于多通路复用）
  data?: any;                       // 消息数据
  timestamp?: number;               // 时间戳
  id?: string;                      // 消息ID（可选）
}

// 订阅回调函数类型
export type SubscribeCallback = (data: any) => void;

// 连接状态变化回调
export type StateChangeCallback = (state: WSState) => void;

// WebSocket 配置选项
export interface WSOptions {
  url: string;                      // WebSocket 服务器地址
  reconnectInterval?: number;       // 重连间隔（毫秒），默认 3000
  maxReconnectAttempts?: number;    // 最大重连次数，默认 Infinity
  heartbeatInterval?: number;       // 心跳间隔（毫秒），默认 30000
  heartbeatTimeout?: number;        // 心跳超时（毫秒），默认 10000
  onStateChange?: StateChangeCallback; // 状态变化回调
}

