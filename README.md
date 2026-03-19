# ⚠️ 项目状态：未实现

> **核心功能因 OpenClaw 架构限制无法落地，当前代码仅供参考。**
> 详见：[Issue #1 - 【未实现】习惯自动检测机制](https://github.com/lenchos1982/ah-chuxi-habit-manager/issues/1)

---

# Habit Manager - 通用习惯管理器插件

> 记录和传承用户习惯，实现换模型后无缝衔接

## 特性

- 🎯 **6大类关键词检测**：沟通、决策、输出、反馈、时间、交互
- 🔍 **精确+模糊匹配**：支持多种表达变体
- 📊 **自动归纳**：周习惯归纳 + 月度精炼
- 🔄 **自动加载**：新会话自动注入习惯摘要到System Prompt
- 🌍 **通用设计**：可被任何Agent框架集成
- ⚡ **轻量级**：只在必要时调用LLM

## 安装

```bash
npm install ah-chuxi-habit-manager
```

## 快速开始

```typescript
import { HabitManager } from 'ah-chuxi-habit-manager';

// 初始化
const habitManager = new HabitManager({
  storagePath: './habits'
});

// 处理用户消息（自动检测关键词）
habitManager.processMessage('我喜欢直接说重点');

// 加载习惯到系统提示词
const newPrompt = habitManager.injectToSystemPrompt(originalPrompt);

// 定时任务调用（由宿主负责调度）
// await habitManager.triggerWeekly();
// await habitManager.triggerMonthly();
```

## API

### `new HabitManager(options)`

创建实例

| 参数 | 类型 | 说明 |
|------|------|------|
| `storagePath` | `string` | 数据存储路径，默认 `./habits` |
| `config` | `Config` | 配置项 |

### `processMessage(text: string): DetectionResult[]`

处理用户消息，检测关键词

```typescript
const results = habitManager.processMessage('我喜欢直接说重点');
console.log(results);
// [{ category: '沟通', expression: '正向', content: '直接说重点', confidence: 1 }]
```

### `injectToSystemPrompt(systemPrompt: string): string`

将习惯摘要注入到系统提示词

```typescript
const prompt = habitManager.injectToSystemPrompt('你是一个AI助手');
```

### `triggerWeekly(): Promise<void>`

触发周归纳（需宿主定时任务调用）

### `triggerMonthly(): Promise<void>`

触发月精炼（需宿主定时任务调用）

### `cleanup(): void`

清理所有数据（卸载时调用）

## OpenClaw 集成示例

```javascript
// 在 extension 配置中添加
{
  "id": "habit-manager",
  "enabled": true,
  "config": {
    "path": "./habits"
  }
}
```

配置定时任务：

```javascript
// crontab 配置
cron.schedule('0 2 * * 0', () => habitManager.triggerWeekly());
cron.schedule('0 3 1 * *', () => habitManager.triggerMonthly());
```

## 数据结构

### raw-records.json

```json
{
  "records": [
    {
      "id": "uuid-v4",
      "timestamp": "2026-03-17T10:00:00Z",
      "category": "沟通",
      "expression": "正向",
      "content": "我喜欢直接说重点",
      "confidence": 1.0
    }
  ]
}
```

### habits.json

```json
{
  "habits": [
    {
      "id": "uuid-v4",
      "category": "沟通",
      "title": "喜欢直接沟通",
      "description": "用户明确表示喜欢直接说重点",
      "examples": ["我喜欢直接说重点"],
      "frequency": 5,
      "confidence": 0.85
    }
  ],
  "updatedAt": "2026-03-17T00:00:00Z"
}
```

### summary.md

```markdown
# 用户习惯摘要

### 沟通偏好
- 喜欢直接沟通，不喜欢绕弯子

### 输出偏好
- 喜欢简洁的输出

---
*此摘要由Habit Manager自动生成*
```

## 关键词分类

| 类别 | 正向示例 | 负向示例 |
|------|---------|---------|
| 沟通 | 直接说重点、开门见山 | 不要绕弯子、别拐弯抹角 |
| 决策 | 给我选择题、你决定 | 不要让我做决定、你看着办 |
| 输出 | 简洁点、说重点 | 不要长篇大论、太长了 |
| 反馈 | 先肯定再提建议 | 不要只批评、先说优点 |
| 时间 | 优先处理、加急 | 不急、慢慢来 |
| 交互 | 用emoji、加点表情 | 别发表情包、别用emoji |

## 许可证

MIT
