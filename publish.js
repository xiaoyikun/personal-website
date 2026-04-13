#!/usr/bin/env node
/**
 * 一键发布脚本
 * 用法：在项目根目录执行 node publish.js
 *
 * 流程：
 * 1. 读取后台导出的 data.json
 * 2. 生成 site-data.js
 * 3. 自动 git add + commit + push
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_FILE = path.join(__dirname, 'data.json');
const OUTPUT_FILE = path.join(__dirname, 'site-data.js');

// 1. 检查 data.json 是否存在
if (!fs.existsSync(DATA_FILE)) {
  console.error('❌ 未找到 data.json 文件');
  console.error('   请先在后台管理页面点击"🚀 发布数据"导出 data.json');
  process.exit(1);
}

// 2. 读取并解析数据
let data;
try {
  data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
} catch (e) {
  console.error('❌ data.json 格式错误:', e.message);
  process.exit(1);
}

// 3. 生成 site-data.js
const timestamp = new Date().toLocaleString('zh-CN');
const jsContent = `/* 由后台管理自动生成，请勿手动编辑 */\n`
  + `/* 生成时间: ${timestamp} */\n`
  + `window.ARTFOLIO_DATA = ${JSON.stringify(data, null, 2)};\n`;

fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf-8');
console.log('✅ site-data.js 已生成');

// 4. 删除临时的 data.json（不需要提交到仓库）
fs.unlinkSync(DATA_FILE);
console.log('🗑️  data.json 已清理');

// 5. Git 提交并推送
try {
  execSync('git add site-data.js', { stdio: 'inherit', cwd: __dirname });
  execSync(`git commit -m "更新网站数据 - ${timestamp}"`, { stdio: 'inherit', cwd: __dirname });
  execSync('git push', { stdio: 'inherit', cwd: __dirname });
  console.log('\n🎉 发布成功！GitHub Pages 将在 1-2 分钟内自动更新。');
} catch (e) {
  console.error('\n⚠️  Git 操作失败，请手动执行：');
  console.error('   git add site-data.js');
  console.error('   git commit -m "更新数据"');
  console.error('   git push');
}
