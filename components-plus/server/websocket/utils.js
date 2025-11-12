/**
 * WebSocket 工具函数
 */

/**
 * 生成客户端ID
 */
export function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
