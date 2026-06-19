/**
 * auto-login.js — A Trợ Auto Keepalive Script
 * Chạy bởi GitHub Actions mỗi 30 phút để giữ tất cả user luôn online.
 * Yêu cầu: biến môi trường API_BASE_URL (set trong GitHub Secrets)
 */

const API_BASE = (process.env.API_BASE_URL || '').replace(/\/$/, '');

if (!API_BASE) {
  console.error('❌ Thiếu biến môi trường API_BASE_URL!');
  console.error('   → Vào GitHub repo → Settings → Secrets → New secret');
  console.error('   → Name: API_BASE_URL, Value: https://your-backend.railway.app/api/v1');
  process.exit(1);
}

// ── Danh sách user (đồng bộ với admin-login-tool.html) ───────────────────────
const USERS = [
  { name: 'Quán Nhậu Galaxy',              phone: '862019199'   },
  { name: 'Ghiền BBQ',                      phone: '0372311859'  },
  { name: 'MANYO Tteokbokki Hoà Lạc',       phone: '0977567833'  },
  { name: 'HaBi Streets Cuisine - Hoà Lạc', phone: '0398900026'  },
  { name: '1988 BBQ',                        phone: '0329656565'  },
  { name: 'Bánh tráng Tana',                phone: '0975533159'  },
  { name: 'Nhất Nướng Quán',                phone: '0985372989'  },
  { name: 'Cơm Gà Ruby',                    phone: '0966378633'  },
  { name: 'Sweet Cake Tân Xã',              phone: '0334678158'  },
  { name: 'Cơm rang Nguyễn Việt',           phone: '356721667'   },
  { name: 'Young Food&Drink',               phone: '0335990484'  },
  { name: 'Lẩu nướng 368',                  phone: '977625684'   },
  { name: 'Nem nướng Hùng Anh',             phone: '342436528'   },
  { name: 'Trung Toàn Bakery',              phone: '0338893388'  },
  { name: 'Thành Phát Bakery Hoà Lạc',      phone: '0906066585'  },
  { name: 'Taetna Hoà Lạc',                 phone: '968478816'   },
  { name: 'Hằng Nguyễn bakery',             phone: '962288790'   },
  { name: 'Chè ngon Jolly',                 phone: '0869958939'  },
  { name: 'Techno Tea',                     phone: '326392618'   },
  { name: 'Takocha',                        phone: '0343857996'  },
  { name: 'Bún Cá Nam Hà',                  phone: '966707009'   },
  { name: 'Barbershop Hoà Lạc',             phone: '389369202'   },
  { name: 'Tiên An Costumes',               phone: '929745666'   },
  { name: 'Phở Nam Nhất',                   phone: '385748668'   },
  { name: "Loan's Pickleball",              phone: '0989419586'  },
  { name: 'Qin Hair Salon',                 phone: '0983071566'  },
  { name: 'Liên Facial Spa',                phone: '0395769189'  },
  { name: 'Bún Chả Thu Hà',                 phone: '0898243680'  },
  { name: 'Bún Bò Huế Đức Duy',             phone: '0973271135'  },
  { name: 'Quán Ăn Đêm Tuấn Hằng',          phone: '0964495509'  },
  { name: 'Bún Cá Thái Bình',               phone: '0901513669'  },
  { name: 'Lẩu Nướng 368',                  phone: '0977625684'  },
  { name: 'Quán meo meo phở bò cơm rang',   phone: '0981890636'  },
  { name: 'Yên Bái Quán',                   phone: '0879952398'  },
  { name: 'Cơm sạch 17',                    phone: '0822783123'  },
  { name: 'Hẻm Nướng 1978',                 phone: '0327127277'  },
  { name: 'Cơm Xe Tải Thanh Huyền',         phone: '0987746158'  },
  { name: 'Cơm Nguyễn Tuấn',                phone: '0983556183'  },
  { name: 'Cơm Tấm Chính Lan 1998',         phone: '0368466998'  },
  { name: 'Thiên Ban Quán Bún Cá Cay',      phone: '0968860363'  },
  { name: 'Mây Quán',                       phone: '0862261226'  },
  { name: 'Tiêm Cơm Gia Đinh Hà Đông',      phone: '0965730550'  },
  { name: 'Cơm Ngon Anh Béo',               phone: '0968251516'  },
  { name: 'Tiệm Cơm Nàng Tấm',              phone: '0839103388'  },
  { name: 'Bún Đậu Thủy Gà',                phone: '0985102468'  },
  { name: 'Tít Thò Lò',                     phone: '0972895533'  },
  { name: 'Cháo Mr.Bean',                   phone: '0862655924'  },
  { name: 'Tiệm Bánh Thu Trang',            phone: '0936290932'  },
  { name: "MỲ CAY LA'CA",                   phone: '0989251931'  },
  { name: 'Chân Gà Sốt Thái MeeChang',      phone: '0336789071'  },
  { name: 'Chất Lẩu Nướng Buffet',          phone: '0969158193'  },
  { name: 'Quán nhậu Trang Trẻ Trâu',       phone: '0968598771'  },
  { name: 'Bia hơi minh tâm',               phone: '0836484333'  },
  { name: 'Phở Thìn Mỹ Đình',               phone: '02432006379' },
  { name: 'Quán Tươi',                      phone: '0974356725'  },
  { name: 'Cơm Văn Đô Trung Kính',          phone: '0356922789'  },
  { name: 'KienKo Kitchen',                 phone: '0779222029'  },
  { name: 'Bún riêu tóp mỡ 37',             phone: '0961013130'  },
  { name: 'Đụt Quán',                       phone: '0868128180'  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

// ── Login một user ────────────────────────────────────────────────────────────
async function loginUser(user) {
  try {
    const { ok, status, data } = await fetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ taxCode: user.phone, password: user.phone }),
    });
    if (!ok) throw new Error(data.error || data.message || `HTTP ${status}`);
    return { success: true, token: data.token, sessionId: data.sessionId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Heartbeat cho một user (cập nhật lastActiveAt + session duration) ─────────
// Backend endpoint: PATCH /auth/session/heartbeat
// Comment trong code: "Frontend gọi mỗi 5 phút để update thời gian session đang mở"
async function heartbeatUser(user, token) {
  try {
    const { ok, status } = await fetchJson(`${API_BASE}/auth/session/heartbeat`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!ok) return { success: false, error: `HTTP ${status}` };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const vnTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🗓️  A Trợ Auto Keepalive — ${vnTime} (VN)`);
  console.log(`🔗  API: ${API_BASE}`);
  console.log(`👥  Tổng user: ${USERS.length}`);
  console.log(`${'='.repeat(60)}\n`);

  const loginOnly = process.env.LOGIN_ONLY === 'true';
  const results = { loginOk: 0, loginFail: 0, pingOk: 0, pingFail: 0 };
  const tokens = {};

  // ── Bước 1: Đăng nhập tất cả user ──────────────────────────────────────────
  console.log('📋 BƯỚC 1: Đăng nhập tất cả user...\n');
  for (const user of USERS) {
    const result = await loginUser(user);
    if (result.success) {
      tokens[user.phone] = result.token;
      results.loginOk++;
      console.log(`  ✅ ${user.name.padEnd(35)} (${user.phone})`);
    } else {
      results.loginFail++;
      console.log(`  ❌ ${user.name.padEnd(35)} (${user.phone}) — ${result.error}`);
    }
    await sleep(250); // Delay 250ms giữa mỗi request để không spam API
  }

  console.log(`\n  → Đăng nhập: ${results.loginOk} thành công / ${results.loginFail} lỗi\n`);

  if (loginOnly) {
    console.log('ℹ️  LOGIN_ONLY=true, bỏ qua bước ping keepalive.');
  } else {
    // ── Bước 2: Gọi heartbeat cho tất cả user đã login ────────────────────
    console.log('💓 BƯỚC 2: Gọi heartbeat (cập nhật lastActiveAt)...\n');
    const loggedPhones = Object.keys(tokens);
    for (const phone of loggedPhones) {
      const user = USERS.find((u) => u.phone === phone);
      const token = tokens[phone];
      const result = await heartbeatUser(user, token);
      if (result.success) {
        results.pingOk++;
        console.log(`  💓 ${user.name.padEnd(35)} — heartbeat OK`);
      } else {
        results.pingFail++;
        console.log(`  🔴 ${user.name.padEnd(35)} — ${result.error}`);
      }
      await sleep(150);
    }
    console.log(`\n  → Heartbeat: ${results.pingOk} thành công / ${results.pingFail} lỗi\n`);
  }

  // ── Tổng kết ────────────────────────────────────────────────────────────────
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Hoàn thành!`);
  console.log(`   Login  : ${results.loginOk}/${USERS.length} thành công`);
  if (!loginOnly) {
    console.log(`   Heartbeat: ${results.pingOk}/${results.loginOk} thành công`);
  }
  console.log(`${'='.repeat(60)}\n`);

  // Exit với lỗi nếu quá nhiều user fail (để GitHub Actions đánh dấu job failed)
  if (results.loginOk === 0) {
    console.error('💥 Không đăng nhập được user nào! Kiểm tra API_BASE_URL và server.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('💥 Lỗi nghiêm trọng:', err);
  process.exit(1);
});
