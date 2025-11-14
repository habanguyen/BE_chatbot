#!/usr/bin/env node

/**
 * 🤖 CHATBOT TEST SCRIPT
 * Chạy: node test-chatbot.js
 * 
 * Dùng để test các intent khác nhau của chatbot
 * Trước khi chạy, đảm bảo backend đang chạy trên http://localhost:3000
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:3000/api/chatbot';

// Test cases
const TEST_CASES = [
  {
    name: "✅ Greeting (Chào hỏi)",
    message: "xin chào",
    expected: "greeting"
  },
  {
    name: "✅ Find Product - Nike dưới 2 triệu",
    message: "tìm giày Nike dưới 2 triệu",
    expected: "find_product"
  },
  {
    name: "✅ Find Product - Giày Adidas dạo phố",
    message: "giày Adidas để dạo phố",
    expected: "find_product"
  },
  {
    name: "✅ Find Product - Hãng Puma mắc",
    message: "puma trên 3 triệu",
    expected: "find_product"
  },
  {
    name: "✅ Find Product - Giày trắng",
    message: "tôi cần giày màu trắng",
    expected: "find_product"
  },
  {
    name: "✅ Recommendation (Gợi ý sản phẩm)",
    message: "gợi ý giày cho tôi",
    expected: "ask_recommendation"
  },
  {
    name: "✅ Recommendation - Tư vấn",
    message: "tư vấn size cho tôi",
    expected: "recommend_size"
  },
  {
    name: "✅ Size Advice - Cao 170cm nặng 68kg",
    message: "tôi cao 170cm nặng 68kg",
    expected: "recommend_size"
  },
  {
    name: "✅ Size Advice - 1m75 80kg",
    message: "tôi 1m75 nặng 80",
    expected: "recommend_size"
  },
  {
    name: "✅ Discount (Khuyến mãi)",
    message: "có giảm giá không?",
    expected: "check_discount"
  },
  {
    name: "✅ Discount - Sale",
    message: "bạn có promo nào không",
    expected: "check_discount"
  },
  {
    name: "✅ Product Detail - ID",
    message: "cho mình xem sản phẩm id 3",
    expected: "get_product_detail"
  },
  {
    name: "✅ Unknown Intent",
    message: "thời tiết hôm nay như thế nào?",
    expected: "unknown"
  }
];

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(color, text) {
  console.log(`${color}${text}${colors.reset}`);
}

function testAPI(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ message });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chatbot',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  log(colors.bold + colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.bold + colors.blue, '║         🤖 CHATBOT TRAINING TEST SUITE v1.0              ║');
  log(colors.bold + colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  log(colors.yellow, `📍 Backend URL: ${BACKEND_URL}`);
  log(colors.yellow, `📊 Total test cases: ${TEST_CASES.length}\n`);

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    try {
      log(colors.blue, `\n${testCase.name}`);
      log(colors.yellow, `   📝 Input: "${testCase.message}"`);

      const response = await testAPI(testCase.message);
      
      log(colors.yellow, `   🤖 Intent: ${response.intent || 'N/A'}`);
      log(colors.yellow, `   💬 Reply: "${response.reply.substring(0, 80)}${response.reply.length > 80 ? '...' : ''}"`);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        log(colors.yellow, `   📦 Products: ${response.data.length} item(s)`);
      }

      if (response.intent === testCase.expected) {
        log(colors.green, `   ✓ PASS (Expected intent: ${testCase.expected})`);
        passed++;
      } else {
        log(colors.red, `   ✗ FAIL (Expected: ${testCase.expected}, Got: ${response.intent})`);
        failed++;
      }
    } catch (err) {
      log(colors.red, `   ✗ ERROR: ${err.message}`);
      failed++;
    }
  }

  // Summary
  log(colors.bold + colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.bold + colors.blue, '║                    TEST SUMMARY                          ║');
  log(colors.bold + colors.blue, '╚════════════════════════════════════════════════════════════╝');
  
  log(colors.bold + colors.green, `\n✅ PASSED: ${passed}/${TEST_CASES.length}`);
  log(colors.bold + colors.red, `❌ FAILED: ${failed}/${TEST_CASES.length}`);
  
  const successRate = ((passed / TEST_CASES.length) * 100).toFixed(2);
  log(colors.bold + colors.yellow, `📊 Success Rate: ${successRate}%\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((err) => {
  log(colors.red, `\n⚠️ Critical Error: ${err.message}`);
  log(colors.red, `   Make sure backend is running at http://localhost:3000`);
  process.exit(1);
});
