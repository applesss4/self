# 个人生活管家

一个基于 Supabase 的个人生活管理应用，帮助用户管理日常任务和生活计划。

## 功能特性

- 用户认证（注册/登录/登出）
- 任务管理（创建、编辑、删除、完成任务）
- 日历视图
- 任务分类（生活/工作）
- 响应式设计，支持移动端

## 技术栈

- 前端：原生 JavaScript + HTML + CSS
- 后端：Supabase（认证、数据库、实时功能）
- 部署：Vercel

## 项目结构

```
.
├── index.html          # 首页
├── pages/
│   └── tasks.html      # 任务管理页面
├── css/
│   ├── main.css        # 主样式
│   ├── components.css  # 组件样式
│   └── calendar.css    # 日历样式
├── js/
│   ├── supabase.js     # Supabase 客户端配置
│   ├── supabaseAuth.js # Supabase 认证服务
│   ├── supabaseStorage.js # Supabase 数据存储服务
│   ├── simpleAuth.js   # 前端认证界面
│   ├── taskManager.js  # 任务管理逻辑
│   ├── tasks.js        # 任务页面主逻辑
│   └── storage.js      # 本地存储服务
├── supabase_setup.sql  # Supabase 数据库设置脚本
└── vercel.json         # Vercel 配置文件
```

## 部署到 Vercel

详细部署指南请查看 [DEPLOYMENT.md](DEPLOYMENT.md) 文件。

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 上导入项目
3. 在 Vercel 项目设置中配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase 项目 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 Supabase anon key
4. 部署完成

## Supabase 配置

项目使用 Supabase 作为后端服务，包括：

1. 认证服务
2. 数据库存储
3. 实时功能

数据库表结构请参考 `supabase_setup.sql` 文件。

## 环境变量

项目使用环境变量来配置 Supabase 连接信息。在 `.env.example` 文件中可以看到需要配置的变量。

在 Vercel 中部署时，请确保设置以下环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 开发

直接在浏览器中打开 `index.html` 即可运行项目。

## 注意事项

- 项目使用原生 JavaScript，无需构建步骤
- 所有数据存储在 Supabase 中，支持实时同步
- 支持离线模式（使用 localStorage）