/**
 * ga-visit.js — A Trợ GA Frontend Visit Script
 * Sử dụng Playwright để mở browser headless, đăng nhập qua form UI thật,
 * và duyệt trang để Google Analytics ghi nhận pageview + engaged sessions.
 *
 * Chạy bởi GitHub Actions (schedule riêng, ít thường xuyên hơn heartbeat).
 *
 * Biến môi trường:
 *   APP_URL        - URL frontend (default: https://atroo.vercel.app)
 *   API_BASE_URL   - URL backend API (để login trước lấy token nếu cần)
 *   MAX_USERS      - Giới hạn số user xử lý (default: tất cả)
 *   TEST_MODE      - Nếu 'true', chỉ chạy 1 user để test
 *   CONCURRENCY    - Số browser context chạy song song (default: 3)
 */

const USERS = require('./users');

const APP_URL = (process.env.APP_URL || 'https://atroo.vercel.app').replace(/\/$/, '');
const TEST_MODE = process.env.TEST_MODE === 'true';
const MAX_USERS = TEST_MODE ? 1 : parseInt(process.env.MAX_USERS || '3');
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '3');
const STAY_DURATION_SEC = parseInt(process.env.STAY_DURATION_SEC || '180');

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ── Một lượt visit cho 1 user ─────────────────────────────────────────────────
async function visitUser(browser, user, index, total) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    // Mỗi user = context riêng = GA client ID riêng (giống user thật)
    userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/12${randomInt(0, 9)}.0.0.0 Safari/537.36`,
  });

  const page = await context.newPage();
  const label = `[${index + 1}/${total}] ${user.name.padEnd(35)} (${user.phone})`;

  try {
    // 1. Navigate đến trang login
    console.log(`  🌐 ${label} — Đang mở trang login...`);
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });

    // 2. Chờ form login xuất hiện
    await page.waitForSelector('#login-taxcode', { timeout: 10000 });
    await sleep(randomInt(500, 1500)); // Delay tự nhiên

    // 3. Điền MST (taxCode)
    await page.fill('#login-taxcode', user.phone);
    await sleep(randomInt(300, 800));

    // 4. Điền password (= phone)
    await page.fill('#login-password', user.phone);
    await sleep(randomInt(300, 600));

    // 5. Click nút đăng nhập
    console.log(`  🔑 ${label} — Đang đăng nhập...`);
    await page.click('#login-submit');

    // 6. Chờ redirect khỏi trang login (tối đa 15s)
    try {
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
      console.log(`  ✅ ${label} — Đăng nhập thành công! URL: ${page.url()}`);
    } catch {
      // Kiểm tra có lỗi hiển thị trên trang không
      const errorEl = await page.$('.figma-error-msg');
      const errorText = errorEl ? await errorEl.textContent() : 'Không rõ lỗi';
      console.log(`  ❌ ${label} — Đăng nhập thất bại: ${errorText.trim()}`);
      await context.close();
      return { success: false, user, error: errorText.trim() };
    }

    // ── GA Engagement: giữ trang mở + tương tác ngẫu nhiên liên tục ────────────────────────
    console.log(`  ⏳ ${label} — Bắt đầu tương tác để duy trì session trong ${STAY_DURATION_SEC} giây...`);
    const startTime = Date.now();
    const endTime = startTime + STAY_DURATION_SEC * 1000;
    let pageviewCount = 1; // Đã mở trang dashboard là 1 pageview

    // Đợi trang dashboard load ban đầu
    await sleep(randomInt(3000, 5000));

    const internalPaths = ['/', '/tax', '/pos', '/chat', '/settings'];

    while (Date.now() < endTime) {
      const remainingMs = endTime - Date.now();
      if (remainingMs <= 0) break;

      // Chọn hành động ngẫu nhiên:
      // 0: Scroll nhẹ (chiếm 50%)
      // 1: Chuyển trang internal (chiếm 30%)
      // 2: Chỉ chờ đọc tin (chiếm 20%)
      const rand = Math.random();
      let action = 2; // Default: read
      if (rand < 0.5) {
        action = 0; // Scroll
      } else if (rand < 0.8) {
        action = 1; // Navigate
      }

      // Thời gian chờ cho hành động này: từ 20 đến 45 giây để GA ghi nhận engagement tự nhiên
      const actionDelay = Math.min(randomInt(20000, 45000), remainingMs);

      if (action === 0) {
        // Scroll nhẹ
        await page.evaluate(() => {
          window.scrollBy(0, (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 300) + 100));
        }).catch(() => {});
        console.log(`     └─ 📜 [${user.name}] Cuộn trang ngẫu nhiên`);
      } else if (action === 1) {
        // Chuyển trang ngẫu nhiên
        const randomPath = internalPaths[randomInt(0, internalPaths.length - 1)];
        try {
          console.log(`     └─ 📄 [${user.name}] Đang chuyển sang trang ${randomPath}...`);
          await page.goto(`${APP_URL}${randomPath}`, { waitUntil: 'networkidle', timeout: 15000 });
          pageviewCount++;
        } catch (navErr) {
          // Bỏ qua lỗi navigate và thử lại ở lượt tiếp theo
        }
      } else {
        console.log(`     └─ 💤 [${user.name}] Đang xem nội dung trang...`);
      }

      if (actionDelay > 0) {
        await sleep(actionDelay);
      }
    }

    console.log(`  🏁 ${label} — Hoàn thành tương tác! (Tổng cộng ${pageviewCount} pageviews)`);
    await context.close();
    return { success: true, user, pages: pageviewCount };

  } catch (err) {
    console.log(`  💥 ${label} — Lỗi: ${err.message}`);
    await context.close();
    return { success: false, user, error: err.message };
  }
}

// ── Chạy song song với giới hạn concurrency ──────────────────────────────────
async function runWithConcurrency(browser, users, concurrency) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < users.length) {
      const i = index++;
      const result = await visitUser(browser, users[i], i, users.length);
      results.push(result);
      // Delay ngẫu nhiên giữa các user để tránh pattern
      await sleep(randomInt(1000, 3000));
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(concurrency, users.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const vnTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🌐  A Trợ GA Frontend Visit — ${vnTime} (VN)`);
  console.log(`🔗  App: ${APP_URL}`);
  console.log(`👥  Users: ${Math.min(MAX_USERS, USERS.length)} / ${USERS.length}`);
  console.log(`⚡  Concurrency: ${CONCURRENCY}`);
  console.log(`${'='.repeat(60)}\n`);

  // Dynamic import playwright (chỉ cần khi chạy)
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    console.error('❌ Playwright chưa được cài đặt!');
    console.error('   Chạy: npx playwright install chromium --with-deps');
    process.exit(1);
  }

  // Chọn users ngẫu nhiên
  const selectedUsers = shuffleArray(USERS).slice(0, MAX_USERS);
  console.log(`🎲 Đã chọn ngẫu nhiên ${selectedUsers.length} users\n`);

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const results = await runWithConcurrency(browser, selectedUsers, CONCURRENCY);

    // ── Tổng kết ────────────────────────────────────────────────────────────
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    const totalPages = results
      .filter((r) => r.success)
      .reduce((sum, r) => sum + (r.pages || 0), 0);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Hoàn thành GA Frontend Visit!`);
    console.log(`   Thành công: ${successCount} / ${selectedUsers.length} users`);
    console.log(`   Thất bại : ${failCount}`);
    console.log(`   Tổng pageviews: ~${totalPages}`);
    console.log(`${'='.repeat(60)}\n`);

    if (failCount > 0) {
      console.log('❌ Users thất bại:');
      results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`   • ${r.user.name} (${r.user.phone}): ${r.error}`));
    }

    // Thoát với lỗi nếu không visit được user nào
    if (successCount === 0) {
      console.error('💥 Không thể visit bất kỳ user nào!');
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('💥 Lỗi nghiêm trọng:', err);
  process.exit(1);
});
