import Storage from './storage';
import KeywordDetector from './detector';
import HabitRecorder from './recorder';
import HabitAggregator from './aggregator';
import HabitLoader from './loader';
import HabitScheduler from './scheduler';
import { DetectionResult, Config, HabitManagerOptions, Habit } from './types';

/**
 * HabitManager - 通用习惯管理器插件
 * 
 * 使用示例：
 * 
 * ```typescript
 * import { HabitManager } from 'ah-chuxi-habit-manager';
 * 
 * // 初始化
 * const habitManager = new HabitManager({
 *   storagePath: './habits'
 * });
 * 
 * // 处理用户消息
 * habitManager.processMessage('我喜欢直接说重点');
 * 
 * // 加载习惯到系统提示词
 * const systemPrompt = habitManager.injectToSystemPrompt(originalPrompt);
 * 
 * // 定时任务调用（由宿主负责调度）
 * // habitManager.triggerWeekly();
 * // habitManager.triggerMonthly();
 * ```
 */
export class HabitManager {
  private storage: Storage;
  private detector: KeywordDetector;
  private recorder: HabitRecorder;
  private aggregator: HabitAggregator;
  private loader: HabitLoader;
  private scheduler: HabitScheduler;
  private config: Config;
  private initialized: boolean = false;

  constructor(options: HabitManagerOptions = {}) {
    // 初始化配置
    this.config = {
      storage: {
        path: options.storagePath || './habits'
      },
      detector: {
        minConfidence: options.config?.detector?.minConfidence ?? 0.7,
        enableFuzzyMatch: options.config?.detector?.enableFuzzyMatch ?? true
      },
      aggregation: {
        weeklyThreshold: options.config?.aggregation?.weeklyThreshold ?? 3,
        monthlyMinFrequency: options.config?.aggregation?.monthlyMinFrequency ?? 2
      },
      loader: {
        enabled: options.config?.loader?.enabled ?? true,
        injectKey: options.config?.loader?.injectKey ?? '## 用户习惯摘要'
      }
    };

    // 初始化各模块
    this.storage = new Storage(this.config.storage.path);
    this.detector = new KeywordDetector(this.config.detector.enableFuzzyMatch);
    this.recorder = new HabitRecorder(this.storage);
    this.aggregator = new HabitAggregator(this.storage);
    this.loader = new HabitLoader(this.storage, this.config);
    this.scheduler = new HabitScheduler(this.storage, this.aggregator);
  }

  /**
   * 初始化插件
   */
  init(): void {
    if (this.initialized) return;
    
    this.storage.init();
    this.initialized = true;
    console.log('[HabitManager] 初始化完成');
  }

  /**
   * 处理用户消息 - 检测并记录关键词
   * 
   * @param text 用户消息
   * @returns 检测结果数组
   */
  processMessage(text: string): DetectionResult[] {
    if (!this.initialized) {
      this.init();
    }

    // 检测关键词
    const detections = this.detector.detect(text);
    
    // 记录检测结果
    if (detections.length > 0) {
      this.recorder.addBatch(detections);
      console.log(`[HabitManager] 检测到 ${detections.length} 个习惯关键词`);
    }
    
    // 更新消息计数
    this.scheduler.incrementMessageCount();
    
    return detections;
  }

  /**
   * 加载习惯摘要
   * 
   * @returns 格式化的习惯摘要
   */
  loadHabits(): string {
    if (!this.initialized) {
      this.init();
    }
    
    return this.loader.load();
  }

  /**
   * 注入习惯到系统提示词
   * 
   * @param systemPrompt 原始系统提示词
   * @returns 注入后的系统提示词
   */
  injectToSystemPrompt(systemPrompt: string): string {
    if (!this.initialized) {
      this.init();
    }
    
    return this.loader.injectToSystemPrompt(systemPrompt);
  }

  /**
   * 触发周归纳（供宿主定时任务调用）
   */
  async triggerWeekly(): Promise<void> {
    if (!this.initialized) {
      this.init();
    }
    
    await this.scheduler.triggerWeekly();
  }

  /**
   * 触发月精炼（供宿主定时任务调用）
   */
  async triggerMonthly(): Promise<void> {
    if (!this.initialized) {
      this.init();
    }
    
    await this.scheduler.triggerMonthly();
  }

  /**
   * 手动触发归纳/精炼
   * 
   * @param type 'weekly' | 'monthly'
   */
  async trigger(type: 'weekly' | 'monthly'): Promise<void> {
    await this.scheduler.trigger(type);
  }

  /**
   * 获取当前习惯列表
   */
  getHabits(): Habit[] {
    return this.aggregator.getHabits();
  }

  /**
   * 获取所有原始记录
   */
  getRecords() {
    return this.recorder.getAll();
  }

  /**
   * 获取摘要内容
   */
  getSummary(): string {
    return this.loader.getSummary();
  }

  /**
   * 检查是否有习惯摘要
   */
  hasSummary(): boolean {
    return this.loader.hasSummary();
  }

  /**
   * 清理所有数据（卸载时调用）
   */
  cleanup(): void {
    this.storage.cleanup();
    console.log('[HabitManager] 数据已清理');
  }

  /**
   * 获取配置
   */
  getConfig(): Config {
    return this.config;
  }

  /**
   * 获取存储路径
   */
  getStoragePath(): string {
    return this.storage.getStoragePath();
  }
}

// 导出
export default HabitManager;
export { KeywordDetector } from './detector';
export { HabitRecorder } from './recorder';
export { HabitAggregator } from './aggregator';
export { HabitLoader } from './loader';
export { HabitScheduler } from './scheduler';
export { Storage } from './storage';
export * from './types';
