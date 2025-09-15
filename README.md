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
│   ├── tasks.html      # 任务管理页面
│   ├── schedule.html   # 工作排班表页面
│   ├── food.html       # 买菜页面
│   └── stats.html      # 数据统计页面
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
│   ├── schedule.js     # 排班表页面主逻辑
│   ├── food.js         # 买菜页面主逻辑
│   ├── supabaseFoodStorage.js # 买菜数据存储
│   ├── stats.js        # 数据统计页面逻辑
│   └── storage.js      # 本地存储服务
├── supabase_setup.sql  # Supabase 数据库设置脚本
└── vercel.json         # Vercel 配置文件
```

## 认证优化

为了提高页面加载速度和用户体验，项目实现了认证状态优化：

1. 用户只能在首页进行登录操作
2. 登录成功后，系统会将登录状态保存在 sessionStorage 中
3. 其他页面通过检查 sessionStorage 中的登录状态来决定是否显示内容
4. 未在首页登录的用户访问其他页面时会自动重定向到首页
5. 登出时会清除 sessionStorage 中的登录状态

这种优化避免了在每个页面都进行 Supabase 认证检查，提高了页面加载速度。

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