# 部署到 Vercel 指南

本文档将指导您如何将个人生活管家项目部署到 Vercel。

## 准备工作

1. 确保您已经将项目代码推送到 GitHub 仓库
2. 确保您已经创建了 Supabase 项目并获取了必要的配置信息

## 在 Vercel 上部署项目

### 1. 登录 Vercel

访问 [Vercel 官网](https://vercel.com/) 并使用您的 GitHub 账户登录。

### 2. 导入项目

1. 点击 "New Project"
2. 选择您的 GitHub 仓库
3. 点击 "Import"

### 3. 配置项目

在项目配置页面：

1. **项目名称**：可以保持默认或自定义
2. **框架预设**：选择 "Other"（因为这是一个静态网站项目）
3. **根目录**：保持为空（使用根目录）

### 4. 设置环境变量

在 "Environment Variables" 部分，添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=您的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=您的Supabase anon key
```

您可以在 Supabase 项目的 "Settings" -> "API" 页面找到这些信息。

### 5. 部署

点击 "Deploy" 按钮开始部署。Vercel 将自动构建并部署您的项目。

## 配置 Supabase

### 1. 创建 Supabase 项目

1. 访问 [Supabase 官网](https://supabase.com/) 并创建一个新项目
2. 记下项目 URL 和 anon key

### 2. 设置数据库表

运行 `supabase_setup.sql` 脚本以创建必要的数据库表和策略：

1. 在 Supabase 项目中，进入 "SQL Editor"
2. 复制 `supabase_setup.sql` 文件的内容
3. 粘贴并运行脚本

### 3. 启用实时功能

1. 在 Supabase 项目中，进入 "Database" -> "Replication"
2. 选择 "tasks" 表并启用实时功能

## 域名配置（可选）

如果您想使用自定义域名：

1. 在 Vercel 项目设置中，进入 "Domains"
2. 添加您的自定义域名
3. 按照指示配置 DNS 记录

## 监控和日志

Vercel 提供了内置的监控和日志功能：

1. 在项目仪表板中查看部署状态
2. 点击部署查看详细日志
3. 使用 Analytics 查看访问统计

## 故障排除

### 常见问题

1. **页面无法加载**：检查环境变量是否正确配置
2. **认证失败**：确保 Supabase 项目配置正确
3. **数据库连接失败**：检查数据库表和策略是否正确设置

### 支持

如果遇到问题，请查看：

1. Vercel 文档：https://vercel.com/docs
2. Supabase 文档：https://supabase.com/docs
3. 项目 README.md 文件