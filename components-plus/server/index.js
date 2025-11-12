const express = require('express');
const http = require('http');
const initWebSocketService = require('./services/websocket');

const app = express();
const server = http.createServer(app);

// 初始化 WebSocket 服务
initWebSocketService(server);

server.listen(3000, () => {
  console.log('WebSocket 服务器已启动，监听端口 3000');
  console.log('支持的通道类型:');
  console.log('  - threat_dashboard: 威胁感知大屏');
  console.log('  - honeypot_log: 密网日志');
  console.log('  - decoy_generation: 诱饵生成内容');
});
