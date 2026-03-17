import * as fs from 'fs';
import * as path from 'path';
import { RawRecord, StorageData, HabitRecord, Config } from './types';

// 默认配置
const DEFAULT_CONFIG: Config = {
  storage: {
    path: './habits'
  },
  detector: {
    minConfidence: 0.7,
    enableFuzzyMatch: true
  },
  aggregation: {
    weeklyThreshold: 3,
    monthlyMinFrequency: 2
  },
  loader: {
    enabled: true,
    injectKey: '## 用户习惯摘要'
  }
};

export class Storage {
  private storagePath: string;
  private config: Config;
  private rawRecordsPath: string;
  private habitsPath: string;
  private summaryPath: string;
  private configPath: string;

  constructor(storagePath: string = './habits', userConfig?: Partial<Config>) {
    this.storagePath = storagePath;
    this.config = { ...DEFAULT_CONFIG, ...userConfig };
    
    this.rawRecordsPath = path.join(this.storagePath, 'raw-records.json');
    this.habitsPath = path.join(this.storagePath, 'habits.json');
    this.summaryPath = path.join(this.storagePath, 'summary.md');
    this.configPath = path.join(this.storagePath, 'config.json');
    
    this.ensureStorage();
  }

  /**
   * 确保存储目录存在
   */
  private ensureStorage(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * 初始化存储文件
   */
  init(): void {
    // 初始化原始记录
    if (!fs.existsSync(this.rawRecordsPath)) {
      this.saveRawRecords({ records: [] });
    }
    
    // 初始化习惯
    if (!fs.existsSync(this.habitsPath)) {
      this.saveHabits({ habits: [], updatedAt: new Date().toISOString() });
    }
    
    // 初始化摘要
    if (!fs.existsSync(this.summaryPath)) {
      this.saveSummary('# 用户习惯摘要\n\n暂无习惯记录');
    }
    
    // 保存配置
    this.saveConfig(this.config);
  }

  // ========== 原始记录操作 ==========

  /**
   * 读取原始记录
   */
  getRawRecords(): RawRecord[] {
    try {
      const data = fs.readFileSync(this.rawRecordsPath, 'utf-8');
      const parsed: StorageData = JSON.parse(data);
      return parsed.records || [];
    } catch {
      return [];
    }
  }

  /**
   * 保存原始记录
   */
  saveRawRecords(data: StorageData): void {
    fs.writeFileSync(this.rawRecordsPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 添加原始记录
   */
  addRawRecord(record: RawRecord): void {
    const records = this.getRawRecords();
    records.push(record);
    this.saveRawRecords({ records });
  }

  /**
   * 按时间范围查询记录
   */
  queryByDateRange(start: Date, end: Date): RawRecord[] {
    const records = this.getRawRecords();
    return records.filter(r => {
      const timestamp = new Date(r.timestamp);
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * 按类别查询记录
   */
  queryByCategory(category: string): RawRecord[] {
    const records = this.getRawRecords();
    return records.filter(r => r.category === category);
  }

  // ========== 习惯操作 ==========

  /**
   * 读取习惯
   */
  getHabits(): HabitRecord {
    try {
      const data = fs.readFileSync(this.habitsPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return { habits: [], updatedAt: new Date().toISOString() };
    }
  }

  /**
   * 保存习惯
   */
  saveHabits(data: HabitRecord): void {
    fs.writeFileSync(this.habitsPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // ========== 摘要操作 ==========

  /**
   * 读取摘要
   */
  getSummary(): string {
    try {
      return fs.readFileSync(this.summaryPath, 'utf-8');
    } catch {
      return '';
    }
  }

  /**
   * 保存摘要
   */
  saveSummary(content: string): void {
    fs.writeFileSync(this.summaryPath, content, 'utf-8');
  }

  // ========== 配置操作 ==========

  /**
   * 读取配置
   */
  getConfig(): Config {
    try {
      const data = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return this.config;
    }
  }

  /**
   * 保存配置
   */
  saveConfig(config: Config): void {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  // ========== 清理操作 ==========

  /**
   * 清理所有数据（卸载时调用）
   */
  cleanup(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        fs.rmSync(this.storagePath, { recursive: true, force: true });
      }
    } catch (e) {
      console.error('清理数据失败:', e);
    }
  }

  /**
   * 获取存储路径
   */
  getStoragePath(): string {
    return this.storagePath;
  }
}

export default Storage;
