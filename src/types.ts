// 类型定义

export type Category = '沟通' | '决策' | '输出' | '反馈' | '时间' | '交互';
export type ExpressionType = '正向' | '负向';

export interface RawRecord {
  id: string;
  timestamp: string;
  category: Category;
  expression: ExpressionType;
  content: string;
  context?: string;
  confidence: number;
}

export interface DetectionResult {
  category: Category;
  expression: ExpressionType;
  content: string;
  confidence: number;
}

export interface Habit {
  id: string;
  category: Category;
  title: string;
  description: string;
  examples: string[];
  frequency: number;
  confidence: number;
  firstSeen: string;
  lastSeen: string;
}

export interface HabitRecord {
  habits: Habit[];
  updatedAt: string;
}

export interface StorageData {
  records: RawRecord[];
}

export interface Config {
  storage: {
    path: string;
  };
  detector: {
    minConfidence: number;
    enableFuzzyMatch: boolean;
  };
  aggregation: {
    weeklyThreshold: number;
    monthlyMinFrequency: number;
  };
  loader: {
    enabled: boolean;
    injectKey: string;
  };
}

export interface HabitManagerOptions {
  storagePath?: string;
  config?: Partial<Config>;
}
