# WebSocket 服务器模块

WebSocket 服务器核心实现，采用模块化设计。

## 目录结构

```
websocket/
├── index.js           # WebSocket 服务器主类
├── types.js           # 消息类型和通道类型定义
├── messageHandler.js  # 消息处理器
├── dataSimulator.js   # 数据模拟器（用于演示）
└── utils.js           # 工具函数
```

## 模块说明

### index.js
WebSocket 服务器核心类，负责：
- 连接管理
- 发布订阅模式实现
- 消息广播
- 心跳检测

### types.js
定义消息类型和通道类型：
- `MessageType`: 消息类型（PING, PONG, SUBSCRIBE, UNSUBSCRIBE, DATA, ERROR）
- `ChannelType`: 通道类型（THREAT_DASHBOARD, HONEYPOT_LOG, DECOY_GENERATION）

### messageHandler.js
处理客户端发送的消息：
- 心跳请求处理
- 订阅/取消订阅处理

### dataSimulator.js
模拟数据生成和推送（用于演示）：
- 威胁感知大屏数据
- 密网日志数据
- 诱饵生成数据

### utils.js
工具函数：
- `generateClientId()`: 生成客户端ID

## 使用方式

通过 `services/websocket.js` 初始化服务：

```javascript
const initWebSocketService = require('./services/websocket');
initWebSocketService(server);
```

