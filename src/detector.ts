import { Category, ExpressionType, DetectionResult } from './types';

// 6大类关键词定义
const KEYWORDS: Record<Category, { positive: string[]; negative: string[] }> = {
  沟通: {
    positive: [
      '直接说重点', '开门见山', '直奔主题', '有话直说', '简单明了',
      '说重点', '直接说', '告诉我重点', '我要重点', '就告诉我重点'
    ],
    negative: [
      '不要绕弯子', '别拐弯抹角', '别铺垫', '别废话', '别绕圈子',
      '别绕弯子', '别绕圈子', '拐弯抹角', '绕弯子', '不要拐弯抹角'
    ]
  },
  决策: {
    positive: [
      '给我选择题', '给我选项', '帮我做决定', '你决定', '你拿主意',
      '让我选', '让我选择', '你决定吧', '你做主', '帮我选'
    ],
    negative: [
      '不要让我做决定', '别问我要干嘛', '你看着办', '你自己判断',
      '我不决定', '你决定吧', '你看着办吧', '别让我选', '不要让我选'
    ]
  },
  输出: {
    positive: [
      '简洁点', '简短些', '说重点', '一句话', '简明扼要', '长话短说',
      '简洁', '简略', '简短', '再简短', '说重点', '要简洁'
    ],
    negative: [
      '不要长篇大论', '太长了', '别写那么多', '简短一点', '言简意赅',
      '别太长', '写太多了', '不要写太多', '长篇大论', '太啰嗦'
    ]
  },
  反馈: {
    positive: [
      '先肯定再提建议', '先夸再批', '正向优先', '多鼓励', '肯定为主',
      '先说优点', '先肯定', '正面反馈', '鼓励为主'
    ],
    negative: [
      '不要只批评', '别光说缺点', '先说优点', '别总挑毛病',
      '别光批评', '只批评', '光说缺点', '别挑毛病', '不要只提缺点'
    ]
  },
  时间: {
    positive: [
      '优先处理', '加急', '尽快', '第一个处理', '马上办',
      '优先', '赶紧', '快点', '紧急', '很重要'
    ],
    negative: [
      '不急', '慢慢来', '有空再说', '稍后', '什么时候都行',
      '慢慢', '不着急', '有空', '稍后处理', '不着急'
    ]
  },
  交互: {
    positive: [
      '用emoji', '加点表情', '活泼点', '轻松些', '幽默点',
      '加表情', '用表情', '轻松一点', '活泼一点', '幽默一些'
    ],
    negative: [
      '别发表情包', '别用emoji', '严肃点', '别开玩笑', '正经点',
      '不要表情', '别表情', '不要emoji', '别用表情', '正经一些'
    ]
  }
};

// 构建正则表达式
function buildRegex(patterns: string[]): RegExp {
  const escaped = patterns.map(p => 
    p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  return new RegExp(`(${escaped.join('|')})`, 'i');
}

// 模糊匹配模式
const FUZZY_PATTERNS: Array<{
  category: Category;
  expression: ExpressionType;
  patterns: RegExp[];
}> = [];

for (const [category, keywords] of Object.entries(KEYWORDS)) {
  const cat = category as Category;
  FUZZY_PATTERNS.push({
    category: cat,
    expression: '正向',
    patterns: keywords.positive.map(p => buildRegex([p, `${p}.*`, `.*${p}.*`]))
  });
  FUZZY_PATTERNS.push({
    category: cat,
    expression: '负向',
    patterns: keywords.negative.map(p => buildRegex([p, `${p}.*`, `.*${p}.*`]))
  });
}

export class KeywordDetector {
  private keywords = KEYWORDS;
  private enableFuzzyMatch: boolean;

  constructor(enableFuzzyMatch: boolean = true) {
    this.enableFuzzyMatch = enableFuzzyMatch;
  }

  /**
   * 检测文本中的关键词
   */
  detect(text: string): DetectionResult[] {
    const results: DetectionResult[] = [];
    const textLower = text.toLowerCase();

    // 精确匹配
    for (const [category, keywords] of Object.entries(this.keywords)) {
      const cat = category as Category;
      
      // 正向匹配
      for (const keyword of keywords.positive) {
        if (text.includes(keyword)) {
          results.push({
            category: cat,
            expression: '正向',
            content: keyword,
            confidence: 1.0
          });
        }
      }
      
      // 负向匹配
      for (const keyword of keywords.negative) {
        if (text.includes(keyword)) {
          results.push({
            category: cat,
            expression: '负向',
            content: keyword,
            confidence: 1.0
          });
        }
      }
    }

    // 模糊匹配（如果启用）
    if (this.enableFuzzyMatch) {
      for (const fp of FUZZY_PATTERNS) {
        for (const pattern of fp.patterns) {
          if (pattern.test(text)) {
            // 避免重复添加
            const exists = results.some(r => 
              r.category === fp.category && r.expression === fp.expression
            );
            if (!exists) {
              results.push({
                category: fp.category,
                expression: fp.expression,
                content: text,
                confidence: 0.8
              });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * 获取所有关键词定义
   */
  getKeywords() {
    return this.keywords;
  }
}

export default KeywordDetector;
