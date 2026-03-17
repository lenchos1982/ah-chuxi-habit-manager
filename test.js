// 简单测试脚本
const { HabitManager } = require('./dist/index');

console.log('=== Habit Manager 测试 ===\n');

// 初始化
const manager = new HabitManager({
  storagePath: './test-habits'
});

manager.init();
console.log('1. 初始化完成\n');

// 测试消息处理
console.log('2. 测试消息处理:');
const tests = [
  '我喜欢直接说重点',
  '不要绕弯子',
  '给我选择题',
  '简洁点',
  '先肯定再提建议',
  '加急处理',
  '用emoji'
];

for (const msg of tests) {
  const results = manager.processMessage(msg);
  if (results.length > 0) {
    console.log(`  "${msg}" -> ${results.map(r => `${r.category}(${r.expression})`).join(', ')}`);
  }
}

// 获取习惯
console.log('\n3. 当前记录数:', manager.getRecords().length);

// 加载摘要
const summary = manager.loadHabits();
console.log('\n4. 习惯摘要:\n', summary || '(暂无)');

// 清理测试数据
console.log('\n5. 清理测试数据...');
manager.cleanup();

console.log('\n=== 测试完成 ===');
