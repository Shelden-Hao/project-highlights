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

订阅流程：

```
客户端调用 subscribe()
    ↓
1. 将回调函数添加到本地订阅者集合
2. 发送订阅消息给服务器：
   {
     type: 'subscribe',
     channel: 'threat_dashboard',
     timestamp: 1234567890
   }
    ↓
服务器收到订阅请求
    ↓
MessageHandler 处理 SUBSCRIBE 消息
    ↓
将客户端连接添加到对应通道的订阅者列表

```

取消订阅流程：

```
客户端调用 unsubscribe()
    ↓
1. 从本地订阅者集合移除回调
2. 发送取消订阅消息：
   {
     type: 'unsubscribe',
     channel: 'threat_dashboard',
     timestamp: 1234567890
   }
    ↓
服务器收到取消订阅请求
    ↓
从通道的订阅者列表中移除该客户端

```

推送数据和接收数据：

```
服务端推送数据
    ↓
DataSimulator 定时生成模拟数据
    ↓
调用 WebSocketServer.broadcast(channel, data)
    ↓
查找该通道的所有订阅者
    ↓
向每个订阅者发送消息：
{
  type: 'data',
  channel: 'threat_dashboard',
  data: { /* 实际数据 */ },
  timestamp: 1234567890
}
    ↓
客户端接收数据
    ↓
ws.onmessage 触发
    ↓
解析 JSON 消息
    ↓
handleMessage() 根据消息类型处理
    ↓
如果是 DATA 类型：
    ↓
notifySubscribers(channel, data)
    ↓
调用该通道所有订阅者的回调函数
    ↓
React 组件更新状态，UI 刷新

```

心跳机制：

```
客户端
    ↓
每 30 秒发送 PING 消息
    ↓
设置 10 秒超时定时器
    ↓
如果 10 秒内没收到 PONG → 关闭连接，触发重连（重连会有一定的次数限制）
    ↓
服务端
    ↓
收到 PING 消息
    ↓
立即回复 PONG 消息

```

断线重连：

```
连接断开（ws.onclose 触发）
    ↓
检查重连次数是否超过限制
    ↓
如果未超过：
    ↓
等待 3 秒（reconnectInterval）
    ↓
重新调用 connect()
    ↓
连接成功后：
    1. 重新订阅之前订阅的所有通道
    2. 发送断线期间积压的消息

```

