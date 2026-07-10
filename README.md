# Deskline · 桌面生产线

一款适合在办公或学习期间保持打开的轻量网页挂机游戏。

## 核心规则

- 同一时间只运行一项生产行动。
- 仅网页保持打开时产生资源，没有离线收益。
- 存档保存在浏览器 LocalStorage，无需账号或服务器。
- 支持后台标签页计时、设施升级、任务、成就进度和存档导入导出。

## 本地运行

```bash
pnpm install
pnpm dev
```

## 构建

完整 Cloudflare Worker 构建：

```bash
pnpm build
```

GitHub Pages 静态构建：

```bash
pnpm exec vite build --config vite.static.config.ts
```

推送到 `main` 后，仓库内的 GitHub Actions 会自动构建并部署 GitHub Pages。
