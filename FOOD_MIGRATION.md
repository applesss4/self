# 菜品数据迁移指南

## 概述

本指南说明如何将现有的本地存储（localStorage）中的菜品和订单数据迁移到Supabase数据库中。

## 数据库表结构

我们创建了两个新表来存储菜品相关数据：

1. `foods` 表 - 存储菜品信息
2. `orders` 表 - 存储订单信息

## 表结构详情

### foods 表
```sql
CREATE TABLE IF NOT EXISTS public.foods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    image TEXT,
    supermarkets JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### orders 表
```sql
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 迁移步骤

### 1. 创建数据库表

首先需要在Supabase数据库中创建表结构。执行以下SQL脚本：

```sql
-- 执行 food_migration.sql 脚本
```

### 2. 执行数据迁移

数据迁移会在用户访问买菜页面时自动执行。迁移脚本会：

1. 检查用户是否已登录
2. 从localStorage读取现有数据
3. 将数据插入到Supabase数据库中
4. 显示迁移结果

### 3. 验证迁移结果

迁移完成后，可以在Supabase控制台中查看数据是否成功迁移。

## 代码结构

- `food_migration.sql` - 数据库表结构定义
- `js/foodMigration.js` - 数据迁移逻辑
- `js/supabaseFoodStorage.js` - Supabase数据存储类
- `js/runMigration.js` - 执行迁移的脚本
- `js/food.js` - 更新后的菜品管理模块

## 注意事项

1. 迁移过程需要用户登录
2. 迁移只会执行一次，后续访问不会再重复迁移
3. 迁移过程中会保留localStorage中的数据作为备份
4. 如果迁移失败，可以重新执行页面访问来重试

## 故障排除

如果迁移过程中遇到问题：

1. 检查网络连接是否正常
2. 确认Supabase配置是否正确
3. 检查用户是否已登录
4. 查看浏览器控制台错误信息