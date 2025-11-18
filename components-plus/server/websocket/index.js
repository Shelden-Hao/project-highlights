/**
 * WebSocket 服务器管理器
 * 实现发布订阅模式，支持单链路多通路复用
 */

const WebSocket = require('ws');
const { MessageType, ChannelType } = require('./types');
const { generateClientId } = require('./utils');
const MessageHandler = require('./messageHandler');
const DataSimulator = require('./dataSimulator');

class WebSocketServer {
  constructor() {
    // 存储每个通道的订阅者（客户端连接）
    // Map<通道名, Set<客户端连接>> - 每个通道有哪些订阅者
    // 例如：{ 'threat_dashboard': Set([socket1, socket2]) }
    this.channels = new Map();
    
    // 存储每个客户端订阅的通道
    // Map<客户端连接, Set<通道名>> - 每个客户端订阅了哪些通道
    // 客户端订阅者和通道是一个多对多的关系（双向映射）
    // 例如：{ socket1: Set(['threat_dashboard', 'honeypot_log']) }
    this.clientChannels = new Map();
    
    // 心跳检测定时器
    this.heartbeatInterval = 30000; // 30秒
    this.heartbeatTimer = null;
    
    // 消息处理器
    this.messageHandler = new MessageHandler(this);
    
    // 数据模拟器
    this.dataSimulator = new DataSimulator(this);
    
    // 启动心跳检测
    this.startHeartbeat();
    
    // 启动模拟数据推送
    this.dataSimulator.start();
  }

  /**
   * 处理新连接
   */
  handleConnection(socket) {
    const clientId = generateClientId();
    console.log(`新客户端连接: ${clientId}`);

    // 初始化客户端的通道订阅集合
    this.clientChannels.set(socket, new Set());

    // 设置消息处理器
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.messageHandler.handle(socket, message);
      } catch (error) {
        console.error('解析消息失败:', error);
        this.sendError(socket, '消息格式错误');
      }
    });

    // 设置关闭处理器
    socket.on('close', () => {
      console.log(`客户端断开连接: ${clientId}`);
      this.handleDisconnect(socket);
    });

    // 设置错误处理器
    socket.on('error', (error) => {
      console.error(`客户端错误: ${error.message}`);
      this.handleDisconnect(socket);
    });
  }

  /**
   * 订阅通道
   */
  subscribe(socket, channel) {
    if (!Object.values(ChannelType).includes(channel)) {
      this.sendError(socket, `未知通道: ${channel}`);
      return;
    }

    // 将客户端添加到通道的订阅者列表
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel).add(socket);

    // 记录客户端订阅的通道
    const clientChannels = this.clientChannels.get(socket);
    if (clientChannels) {
      clientChannels.add(channel);
    }

    /**
     *  订阅前后的数据变化：
     *  // 订阅前
        channels: {}
        clientChannels: { socket1: Set([]) }

        // 订阅后
        channels: { 
          'threat_dashboard': Set([socket1]) 
        }
        clientChannels: { 
          socket1: Set(['threat_dashboard']) 
        }
     */

    console.log(`客户端订阅通道: ${channel}`);
  }

  /**
   * 取消订阅通道
   */
  unsubscribe(socket, channel) {
    const channelSubscribers = this.channels.get(channel);
    if (channelSubscribers) {
      channelSubscribers.delete(socket);
      if (channelSubscribers.size === 0) {
        this.channels.delete(channel);
      }
    }

    const clientChannels = this.clientChannels.get(socket);
    if (clientChannels) {
      clientChannels.delete(channel);
    }

    console.log(`客户端取消订阅通道: ${channel}`);
  }

  /**
   * 处理客户端断开
   *  // 断开前
      channels: {
        'threat_dashboard': Set([socket1, socket2]),
        'honeypot_log': Set([socket1])
      }
      clientChannels: {
        socket1: Set(['threat_dashboard', 'honeypot_log']),
        socket2: Set(['threat_dashboard'])
      }

      // 断开后
      channels: {
        'threat_dashboard': Set([socket2])
        // 'honeypot_log' 被删除（没有订阅者了）
      }
      clientChannels: {
        socket2: Set(['threat_dashboard'])
        // socket1 被删除
      }
   */
  handleDisconnect(socket) {
    // 从所有通道中移除该客户端
    const clientChannels = this.clientChannels.get(socket);
    if (clientChannels) {
      // 从每个通道订阅者列表中移除该客户端
      clientChannels.forEach(channel => {
        const channelSubscribers = this.channels.get(channel);
        if (channelSubscribers) {
          channelSubscribers.delete(socket);
          // 如果通道没有订阅者了，删除该通道
          if (channelSubscribers.size === 0) {
            this.channels.delete(channel);
          }
        }
      });
    }

    // 清理客户端记录
    this.clientChannels.delete(socket);
  }

  /**
   * 向指定通道的所有订阅者广播消息
   * DataSimulator 生成数据
          ↓
      调用 broadcast('threat_dashboard', data)
          ↓
      查找 channels.get('threat_dashboard')
          ↓
      获得订阅者集合：[socket1, socket2, socket3]
          ↓
      遍历每个 socket
          ↓
      检查连接状态是否为 OPEN
          ↓
      发送 JSON 消息
          ↓
      如果发送失败，标记为失效连接
          ↓
      清理失效连接
   */
  broadcast(channel, data) {
    const subscribers = this.channels.get(channel);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const message = {
      type: MessageType.DATA,
      channel,
      data,
      timestamp: Date.now()
    };

    const messageStr = JSON.stringify(message);
    const deadSockets = [];

    subscribers.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(messageStr);
        } catch (error) {
          console.error('发送消息失败:', error);
          deadSockets.push(socket);
        }
      } else {
        deadSockets.push(socket);
      }
    });

    // 清理无效连接
    deadSockets.forEach(socket => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * 向指定客户端发送消息
   */
  send(socket, message) {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('发送消息失败:', error);
      }
    }
  }

  /**
   * 发送错误消息
   */
  sendError(socket, errorMessage) {
    this.send(socket, {
      type: MessageType.ERROR,
      data: errorMessage,
      timestamp: Date.now()
    });
  }

  /**
   * 启动心跳检测
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      // 检查所有连接的健康状态
      this.clientChannels.forEach((channels, socket) => {
        if (socket.readyState !== WebSocket.OPEN) {
          this.handleDisconnect(socket);
        }
      });
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 销毁服务器
   */
  destroy() {
    this.stopHeartbeat();
    this.dataSimulator.stop();
    this.channels.clear();
    this.clientChannels.clear();
  }
}

module.exports = WebSocketServer;
