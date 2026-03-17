import { v4 as uuidv4 } from 'uuid';
import { RawRecord, Habit, Category, HabitRecord } from './types';
import Storage from './storage';

export class HabitAggregator {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  /**
   * 周归纳 - 聚合同类记录生成习惯
   */
  aggregateWeekly(): Habit[] {
    // 获取过去30天的记录
    const records = this.getRecordsLastDays(30);
    
    // 按类别和内容分组
    const grouped = this.groupByCategoryAndContent(records);
    
    // 生成习惯
    const habits = this.generateHabits(grouped, 3); // 至少出现3次
    
    // 保存
    const habitRecord: HabitRecord = {
      habits,
      updatedAt: new Date().toISOString()
    };
    this.storage.saveHabits(habitRecord);
    
    return habits;
  }

  /**
   * 月精炼 - 生成摘要markdown
   */
  refineMonthly(): string {
    // 获取当前习惯
    const habitRecord = this.storage.getHabits();
    let habits = habitRecord.habits;
    
    // 过滤低频习惯
    habits = habits.filter(h => h.frequency >= 2);
    
    // 生成markdown
    const summary = this.generateMarkdown(habits);
    
    // 保存
    this.storage.saveSummary(summary);
    
    return summary;
  }

  /**
   * 获取过去N天的记录
   */
  private getRecordsLastDays(days: number): RawRecord[] {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return this.storage.queryByDateRange(start, end);
  }

  /**
   * 按类别和内容分组
   */
  private groupByCategoryAndContent(records: RawRecord[]): Map<string, RawRecord[]> {
    const grouped = new Map<string, RawRecord[]>();
    
    for (const record of records) {
      const key = `${record.category}:${record.content}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(record);
    }
    
    return grouped;
  }

  /**
   * 生成习惯列表
   */
  private generateHabits(grouped: Map<string, RawRecord[]>, minFrequency: number): Habit[] {
    const habits: Habit[] = [];
    
    for (const [key, records] of grouped) {
      if (records.length < minFrequency) continue;
      
      const [categoryStr, content] = key.split(':');
      const category = categoryStr as Category;
      
      // 生成标题和描述
      const { title, description } = this.generateTitleAndDescription(category, records);
      
      const firstRecord = records[0];
      const lastRecord = records[records.length - 1];
      
      habits.push({
        id: uuidv4(),
        category,
        title,
        description,
        examples: records.slice(0, 5).map(r => r.content),
        frequency: records.length,
        confidence: Math.min(records.length / 10, 1.0),
        firstSeen: firstRecord.timestamp,
        lastSeen: lastRecord.timestamp
      });
    }
    
    return habits;
  }

  /**
   * 生成标题和描述
   */
  private generateTitleAndDescription(category: Category, records: RawRecord[]): { title: string; description: string } {
    const expression = records[0].expression;
    const content = records[0].content;
    
    const titles: Record<Category, Record<'正向' | '负向', string>> = {
      沟通: {
        正向: '喜欢直接沟通',
        负向: '不喜欢绕弯子'
      },
      决策: {
        正向: '喜欢有选择的决策',
        负向: '不喜欢做决定'
      },
      输出: {
        正向: '喜欢简洁输出',
        负向: '不喜欢长篇大论'
      },
      反馈: {
        正向: '喜欢正向反馈',
        负向: '不喜欢被批评'
      },
      时间: {
        正向: '重视时间效率',
        负向: '时间上不急'
      },
      交互: {
        正向: '喜欢轻松互动',
        负向: '喜欢严肃交流'
      }
    };
    
    const descriptions: Record<Category, Record<'正向' | '负向', string>> = {
      沟通: {
        正向: `用户明确表示喜欢直接说重点，${content}`,
        负向: `用户表示不喜欢绕弯子，${content}`
      },
      决策: {
        正向: `用户希望有选择权，${content}`,
        负向: `用户不想做决定，${content}`
      },
      输出: {
        正向: `用户喜欢简洁的表达，${content}`,
        负向: `用户不喜欢冗长的内容，${content}`
      },
      反馈: {
        正向: `用户喜欢先听正面的反馈，${content}`,
        负向: `用户不喜欢被批评，${content}`
      },
      时间: {
        正向: `用户希望优先处理，${content}`,
        负向: `用户表示不急，${content}`
      },
      交互: {
        正向: `用户喜欢轻松的互动方式，${content}`,
        负向: `用户不喜欢表情包，${content}`
      }
    };
    
    return {
      title: titles[category][expression],
      description: descriptions[category][expression]
    };
  }

  /**
   * 生成Markdown摘要
   */
  private generateMarkdown(habits: Habit[]): string {
    const categories: Category[] = ['沟通', '决策', '输出', '反馈', '时间', '交互'];
    let md = '# 用户习惯摘要\n\n';
    
    for (const category of categories) {
      const categoryHabits = habits.filter(h => h.category === category);
      if (categoryHabits.length === 0) continue;
      
      const categoryNames: Record<Category, string> = {
        沟通: '沟通偏好',
        决策: '决策偏好',
        输出: '输出偏好',
        反馈: '反馈偏好',
        时间: '时间偏好',
        交互: '交互偏好'
      };
      
      md += `### ${categoryNames[category]}\n`;
      
      for (const habit of categoryHabits.slice(0, 3)) { // 每类最多3条
        md += `- ${habit.title}\n`;
      }
      
      md += '\n';
    }
    
    md += `---\n*此摘要由Habit Manager自动生成*\n`;
    
    return md;
  }

  /**
   * 获取当前习惯
   */
  getHabits(): Habit[] {
    return this.storage.getHabits().habits;
  }
}

export default HabitAggregator;
