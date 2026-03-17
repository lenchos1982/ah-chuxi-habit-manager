import Storage from './storage';
import { Config } from './types';

export class HabitLoader {
  private storage: Storage;
  private config: Config;

  constructor(storage: Storage, config: Config) {
    this.storage = storage;
    this.config = config;
  }

  /**
   * 加载摘要到上下文
   */
  load(): string {
    if (!this.config.loader.enabled) {
      return '';
    }
    
    const summary = this.storage.getSummary();
    if (!summary || summary.includes('暂无习惯记录')) {
      return '';
    }
    
    return this.format(summary);
  }

  /**
   * 格式化摘要
   */
  format(summary: string): string {
    const injectKey = this.config.loader.injectKey;
    
    // 提取摘要内容（去除标题和footer）
    let content = summary
      .replace(/^#.*\n/, '')
      .replace(/\n*---\n*\*此摘要由.*\*$/, '')
      .trim();
    
    return `${injectKey}\n\n${content}`;
  }

  /**
   * 注入到系统提示词
   */
  injectToSystemPrompt(systemPrompt: string): string {
    const habitContent = this.load();
    if (!habitContent) {
      return systemPrompt;
    }
    
    // 在系统提示词末尾添加习惯摘要
    return `${systemPrompt}\n\n${habitContent}`;
  }

  /**
   * 检查是否有习惯摘要
   */
  hasSummary(): boolean {
    const summary = this.storage.getSummary();
    return !!summary && !summary.includes('暂无习惯记录');
  }

  /**
   * 获取摘要内容
   */
  getSummary(): string {
    return this.storage.getSummary();
  }
}

export default HabitLoader;
