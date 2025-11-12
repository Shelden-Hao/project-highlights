# WebSocket 实时数据流系统

基于 WebSocket 状态机和发布订阅模式，实现实时数据流的单链路多通路复用，支持断线重连和心跳检测机制。

## 功能特性

- ✅ **状态机管理**：完整的连接状态管理（未连接、连接中、已连接、重连中、错误）
- ✅ **发布订阅模式**：单链路多通路复用，支持多个通道同时订阅
- ✅ **断线重连**：自动重连机制，可配置重连间隔和最大重连次数
- ✅ **心跳检测**：自动心跳检测，确保连接健康
- ✅ **消息队列**：连接断开时自动缓存消息，重连后自动发送

## 支持的通道类型(测试数据)

- `threat_dashboard`: 威胁感知大屏数据
- `honeypot_log`: 密网日志
- `decoy_generation`: 诱饵生成内容

## 使用方法

### 基础使用

```typescript
import { WebSocketClient, ChannelType } from './components/websocket';

// 创建客户端实例
const client = new WebSocketClient({
  url: 'ws://localhost:3000',
  reconnectInterval: 3000,
  maxReconnectAttempts: Infinity,
  heartbeatInterval: 30000,
  heartbeatTimeout: 10000,
  onStateChange: (state) => {
    console.log('连接状态变化:', state);
  }
});

// 连接
client.connect();

// 订阅威胁感知大屏通道
const unsubscribe = client.subscribe(ChannelType.THREAT_DASHBOARD, (data) => {
  console.log('收到威胁感知数据:', data);
});

// 取消订阅
unsubscribe();

// 断开连接
client.disconnect();
```

### React Hook 使用

```typescript
import { useWebSocket } from './components/websocket/useWebSocket';
import { ChannelType } from './components/websocket';

function MyComponent() {
  const { state, isConnected, subscribe } = useWebSocket({
    url: 'ws://localhost:3000',
    autoConnect: true
  });

  useEffect(() => {
    if (!isConnected) return;

    // 订阅威胁感知大屏
    const unsubscribe = subscribe(ChannelType.THREAT_DASHBOARD, (data) => {
      console.log('收到数据:', data);
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  return <div>状态: {state}</div>;
}
```

## API 文档

### WebSocketClient

#### 构造函数

```typescript
new WebSocketClient(options: WSOptions)
```

#### 方法

- `connect()`: 连接 WebSocket 服务器
- `disconnect()`: 断开连接
- `subscribe(channel: ChannelType, callback: SubscribeCallback)`: 订阅指定通道，返回取消订阅函数
- `unsubscribe(channel: ChannelType, callback: SubscribeCallback)`: 取消订阅
- `send(message: WSMessage)`: 发送消息
- `getState()`: 获取当前连接状态
- `destroy()`: 销毁客户端，清理所有资源

### useWebSocket Hook

```typescript
const {
  client,        // WebSocketClient 实例
  state,         // 当前连接状态
  connect,       // 连接函数
  disconnect,    // 断开连接函数
  subscribe,     // 订阅函数
  isConnected    // 是否已连接
} = useWebSocket(options);
```

## 后端服务器

后端服务器已实现发布订阅模式，支持多通道消息推送。

### 启动服务器

```bash
cd server
npm install
npm run dev
```

服务器将在 `ws://localhost:3000` 启动。

### 服务器功能

- 自动心跳检测
- 多通道消息广播
- 客户端订阅管理
- 模拟数据推送（用于演示）

## 消息格式

### 客户端发送

```typescript
{
  type: 'subscribe' | 'unsubscribe' | 'ping',
  channel?: 'threat_dashboard' | 'honeypot_log' | 'decoy_generation',
  timestamp?: number
}
```

### 服务器发送

```typescript
{
  type: 'data' | 'pong' | 'error',
  channel?: 'threat_dashboard' | 'honeypot_log' | 'decoy_generation',
  data?: any,
  timestamp?: number
}
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| url | string | - | WebSocket 服务器地址（必需） |
| reconnectInterval | number | 3000 | 重连间隔（毫秒） |
| maxReconnectAttempts | number | Infinity | 最大重连次数 |
| heartbeatInterval | number | 30000 | 心跳间隔（毫秒） |
| heartbeatTimeout | number | 10000 | 心跳超时（毫秒） |
| onStateChange | function | - | 状态变化回调 |

## 示例

完整示例请参考 `src/examples/WebSocketExample.tsx` 文件。

