/**
 * WebSocket 消息类型和通道类型定义
 */

// 消息类型枚举
const MessageType = {
  PING: 'ping',
  PONG: 'pong',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  DATA: 'data',
  ERROR: 'error'
};

// 通道类型枚举
const ChannelType = {
  THREAT_DASHBOARD: 'threat_dashboard',  // 威胁感知大屏
  HONEYPOT_LOG: 'honeypot_log',          // 密网日志
  DECOY_GENERATION: 'decoy_generation'   // 诱饵生成内容
};

module.exports = {
  MessageType,
  ChannelType
};
