import { v4 as uuidv4 } from 'uuid';
import { RawRecord, DetectionResult, Category, ExpressionType } from './types';
import Storage from './storage';

export class HabitRecorder {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  /**
   * 添加记录
   */
  add(detection: DetectionResult): RawRecord {
    const record: RawRecord = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      category: detection.category,
      expression: detection.expression as ExpressionType,
      content: detection.content,
      confidence: detection.confidence
    };
    
    this.storage.addRawRecord(record);
    return record;
  }

  /**
   * 批量添加记录
   */
  addBatch(detections: DetectionResult[]): RawRecord[] {
    return detections.map(d => this.add(d));
  }

  /**
   * 读取所有记录
   */
  getAll(): RawRecord[] {
    return this.storage.getRawRecords();
  }

  /**
   * 按时间范围查询
   */
  queryByDateRange(start: Date, end: Date): RawRecord[] {
    return this.storage.queryByDateRange(start, end);
  }

  /**
   * 按类别查询
   */
  queryByCategory(category: Category): RawRecord[] {
    return this.storage.queryByCategory(category);
  }

  /**
   * 获取最近N天的记录
   */
  getRecentRecords(days: number = 30): RawRecord[] {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return this.queryByDateRange(start, end);
  }

  /**
   * 统计各类别记录数
   */
  getCategoryStats(): Record<Category, number> {
    const records = this.getAll();
    const stats: Record<Category, number> = {
      沟通: 0,
      决策: 0,
      输出: 0,
      反馈: 0,
      时间: 0,
      交互: 0
    };
    
    for (const record of records) {
      stats[record.category]++;
    }
    
    return stats;
  }
}

export default HabitRecorder;
