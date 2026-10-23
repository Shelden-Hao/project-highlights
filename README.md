# project-highlights

项目亮点与完整实现的归档仓库：每个子目录是一个独立项目，自带源码、结构文档与说明。

## 收录项目

| 目录 | 说明 |
| :--- | :--- |
| [`components-plus/`](./components-plus) | 基于 React 19 + TypeScript + Vite 7 的组件库项目，pnpm 管理，含独立 `server/` 与 `PROJECT_STRUCTURE.md` 结构说明 |

## 约定

- 一个项目一个目录，目录内自带 `README.md`，根 README 只做索引。
- 结构说明统一放 `PROJECT_STRUCTURE.md`，便于面试或评审时快速看懂分层。

## 快速开始（以 components-plus 为例）

```bash
cd components-plus
pnpm install
pnpm dev      # 本地开发
pnpm build    # 类型检查 + 构建
pnpm lint     # ESLint
```
