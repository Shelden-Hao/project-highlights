/**
 * WebSocket 消息处理器
 */

const { MessageType, ChannelType } = require('./types');

class MessageHandler {
  constructor(server) {
    this.server = server;
  }

  /**
   * 处理消息
   */
  handle(socket, message) {
    switch (message.type) {
      case MessageType.PING:
        // 心跳请求，一旦收到PING消息，立刻回复心跳响应PONG
        this.server.send(socket, {
          type: MessageType.PONG,
          timestamp: Date.now()
        });
        break;

      case MessageType.SUBSCRIBE:
        // 订阅通道
        this.server.subscribe(socket, message.channel);
        break;

      case MessageType.UNSUBSCRIBE:
        // 取消订阅通道
        this.server.unsubscribe(socket, message.channel);
        break;

      default:
        console.warn('未知消息类型:', message.type);
    }
  }
}

module.exports = MessageHandler;

