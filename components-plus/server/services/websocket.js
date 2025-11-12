/**
 * WebSocket 服务
 * 初始化 WebSocket 服务器并绑定到 HTTP 服务器
 */

const WebSocket = require('ws');
const WebSocketServer = require('../websocket/index');

/**
 * 初始化 WebSocket 服务
 * @param {http.Server} server - HTTP 服务器实例
 */
function initWebSocketService(server) {
  // 创建 WebSocket 服务器
  const wss = new WebSocket.Server({ server });
  
  // 创建 WebSocket 服务器管理器实例
  const wsServer = new WebSocketServer();

  // 处理新连接
  wss.on('connection', (socket) => {
    wsServer.handleConnection(socket);
  });

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('正在关闭服务器...');
    wsServer.destroy();
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  });

  return wsServer;
}

module.exports = initWebSocketService;
