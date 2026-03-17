import Storage from './storage';
import HabitAggregator from './aggregator';

export class HabitScheduler {
  private storage: Storage;
  private aggregator: HabitAggregator;
  private lastWeeklyRun: Date | null = null;
  private lastMonthlyRun: Date | null = null;
  private messageCount: number = 0;

  constructor(storage: Storage, aggregator: HabitAggregator) {
    this.storage = storage;
    this.aggregator = aggregator;
  }

  /**
   * 记录消息计数
   */
  incrementMessageCount(): void {
    this.messageCount++;
    
    // 每50次对话检查一次周归纳
    if (this.messageCount % 50 === 0) {
      this.checkWeeklyTrigger();
    }
    
    // 每200次对话检查一次月精炼
    if (this.messageCount % 200 === 0) {
      this.checkMonthlyTrigger();
    }
  }

  /**
   * 检查周归纳触发条件
   */
  private checkWeeklyTrigger(): void {
    const config = this.storage.getConfig();
    const daysSinceLastRun = this.lastWeeklyRun 
      ? (Date.now() - this.lastWeeklyRun.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;
    
    if (!this.lastWeeklyRun || daysSinceLastRun >= 7) {
      this.triggerWeekly();
    }
  }

  /**
   * 检查月精炼触发条件
   */
  private checkMonthlyTrigger(): void {
    const daysSinceLastRun = this.lastMonthlyRun 
      ? (Date.now() - this.lastMonthlyRun.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;
    
    if (!this.lastMonthlyRun || daysSinceLastRun >= 30) {
      this.triggerMonthly();
    }
  }

  /**
   * 触发周归纳（供宿主定时任务调用）
   */
  async triggerWeekly(): Promise<void> {
    console.log('[HabitManager] 执行周归纳...');
    
    try {
      const habits = this.aggregator.aggregateWeekly();
      this.lastWeeklyRun = new Date();
      console.log(`[HabitManager] 周归纳完成，生成 ${habits.length} 条习惯`);
    } catch (e) {
      console.error('[HabitManager] 周归纳失败:', e);
    }
  }

  /**
   * 触发月精炼（供宿主定时任务调用）
   */
  async triggerMonthly(): Promise<void> {
    console.log('[HabitManager] 执行月精炼...');
    
    try {
      const summary = this.aggregator.refineMonthly();
      this.lastMonthlyRun = new Date();
      console.log(`[HabitManager] 月精炼完成`);
    } catch (e) {
      console.error('[HabitManager] 月精炼失败:', e);
    }
  }

  /**
   * 便捷方法：直接执行（供测试/调试用）
   */
  async trigger(type: 'weekly' | 'monthly'): Promise<void> {
    if (type === 'weekly') {
      await this.triggerWeekly();
    } else {
      await this.triggerMonthly();
    }
  }

  /**
   * 获取上次周归纳时间
   */
  getLastWeeklyRun(): Date | null {
    return this.lastWeeklyRun;
  }

  /**
   * 获取上次月精炼时间
   */
  getLastMonthlyRun(): Date | null {
    return this.lastMonthlyRun;
  }

  /**
   * 获取消息计数
   */
  getMessageCount(): number {
    return this.messageCount;
  }

  /**
   * 设置消息计数（用于恢复状态）
   */
  setMessageCount(count: number): void {
    this.messageCount = count;
  }
}

export default HabitScheduler;
