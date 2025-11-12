# 项目结构说明

## 后端结构 (server/)

```
server/
├── index.js                    # 服务器入口文件
├── services/                   # 服务层
│   └── websocket.js           # WebSocket 服务初始化
└── websocket/                  # WebSocket 核心模块
    ├── index.js               # WebSocket 服务器主类
    ├── types.js               # 消息类型和通道类型定义
    ├── messageHandler.js      # 消息处理器
    ├── dataSimulator.js       # 数据模拟器（用于演示）
    ├── utils.js               # 工具函数
    └── README.md              # 模块说明文档
```

### 模块职责

- **index.js**: HTTP 服务器入口，初始化 Express 和 WebSocket 服务
- **services/websocket.js**: WebSocket 服务初始化，绑定到 HTTP 服务器
- **websocket/index.js**: WebSocket 服务器核心类，实现发布订阅模式
- **websocket/types.js**: 定义消息类型和通道类型常量
- **websocket/messageHandler.js**: 处理客户端发送的各种消息类型
- **websocket/dataSimulator.js**: 模拟数据生成和推送（用于演示）
- **websocket/utils.js**: 通用工具函数

## 前端结构 (src/)

```
src/
├── components/                 # 组件目录
│   └── websocket/             # WebSocket 客户端模块
│       ├── index.ts          # 模块导出入口
│       ├── types.ts          # TypeScript 类型定义
│       ├── client.ts         # WebSocket 客户端核心类
│       ├── useWebSocket.ts   # React Hook
│       └── README.md         # 使用文档
├── examples/                  # 示例代码
│   └── WebSocketExample.tsx  # WebSocket 使用示例组件
├── App.tsx                    # 应用主组件
└── main.tsx                   # 应用入口
```

### 模块职责

- **components/websocket/index.ts**: 导出所有公共 API
- **components/websocket/types.ts**: TypeScript 类型定义（状态、通道、消息类型等）
- **components/websocket/client.ts**: WebSocket 客户端核心实现（状态机、发布订阅、重连、心跳）
- **components/websocket/useWebSocket.ts**: React Hook，方便在组件中使用
- **examples/WebSocketExample.tsx**: 完整的使用示例，展示三个通道的使用方式

## 设计原则

1. **模块化**: 功能拆分清晰，每个模块职责单一
2. **可维护性**: 代码组织合理，易于理解和修改
3. **可扩展性**: 新增通道或功能时，只需修改对应模块
4. **类型安全**: 前端使用 TypeScript，提供完整的类型定义
5. **文档完善**: 关键模块都有 README 说明

## 使用流程

### 后端启动

```bash
cd server
npm install
npm run dev
```

### 前端启动

```bash
npm install
npm run dev
```

### 开发新功能

1. **新增通道类型**: 修改 `server/websocket/types.js` 和 `src/components/websocket/types.ts`
2. **新增消息处理**: 修改 `server/websocket/messageHandler.js`
3. **新增数据源**: 修改 `server/websocket/dataSimulator.js` 或创建新的数据源模块
4. **前端使用**: 参考 `src/examples/WebSocketExample.tsx`

