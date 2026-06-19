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

// Kiểm tra JWT có hết hạn chưa (decode payload không cần verify signature)
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    // Hết hạn hoặc còn dưới 1 giờ
    return payload.exp && (Date.now() / 1000) > (payload.exp - 3600);
  } catch {
    return true;
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
  const results = { loginOk: 0, loginFail: 0, reusedOk: 0, pingOk: 0, pingFail: 0 };
  
  // Đọc file session-tokens.json lưu trữ từ các lần chạy trước
  const fs = require('fs');
  const path = require('path');
  const tokenFilePath = path.join(process.cwd(), 'session-tokens.json');
  let savedTokens = {};
  
  try {
    if (fs.existsSync(tokenFilePath)) {
      savedTokens = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
      console.log(`🔑 Đã khôi phục session tokens lưu trữ từ session-tokens.json`);
    }
  } catch (err) {
    console.log('⚠️ Không thể đọc file session-tokens.json:', err.message);
  }

  // ── Xử lý cho từng user ────────────────────────────────────────────────────
  for (const user of USERS) {
    let token = savedTokens[user.phone];
    let isReused = false;

    // Kiểm tra xem token cũ còn dùng được không
    if (token && !isTokenExpired(token)) {
      if (loginOnly) {
        // Chỉ đăng nhập: nếu token chưa hết hạn thì coi như bỏ qua/hoàn thành
        results.reusedOk++;
        console.log(`  🔄 [Reused] ${user.name.padEnd(35)} (${user.phone}) — Token còn hiệu lực`);
        continue;
      } else {
        // Gửi heartbeat thử bằng token cũ
        const pingResult = await heartbeatUser(user, token);
        if (pingResult.success) {
          results.reusedOk++;
          results.pingOk++;
          console.log(`  💓 [Reused] ${user.name.padEnd(35)} (${user.phone}) — Heartbeat OK`);
          isReused = true;
        } else {
          console.log(`  ⚠️ [Reused] ${user.name.padEnd(35)} (${user.phone}) — Heartbeat lỗi (${pingResult.error}), tiến hành đăng nhập lại...`);
        }
      }
    }

    // Nếu không tái sử dụng được hoặc ping lỗi → đăng nhập mới
    if (!isReused) {
      const loginResult = await loginUser(user);
      if (loginResult.success) {
        token = loginResult.token;
        savedTokens[user.phone] = token;
        results.loginOk++;
        console.log(`  ✅ [New Login] ${user.name.padEnd(35)} (${user.phone})`);
        
        // Nếu không phải chế độ chỉ login → gửi heartbeat lập tức
        if (!loginOnly) {
          const pingResult = await heartbeatUser(user, token);
          if (pingResult.success) {
            results.pingOk++;
            console.log(`     └─ 💓 Heartbeat OK`);
          } else {
            results.pingFail++;
            console.log(`     └─ 🔴 Heartbeat lỗi: ${pingResult.error}`);
          }
        }
      } else {
        results.loginFail++;
        results.pingFail++;
        console.log(`  ❌ [Failed] ${user.name.padEnd(35)} (${user.phone}) — Đăng nhập lỗi: ${loginResult.error}`);
      }
    }
    
    await sleep(250); // Delay nhẹ giữa mỗi user để tránh spam API
  }

  // Lưu lại token mới vào file session-tokens.json
  try {
    fs.writeFileSync(tokenFilePath, JSON.stringify(savedTokens, null, 2), 'utf8');
    console.log('\n💾 Đã cập nhật và lưu session-tokens.json');
  } catch (err) {
    console.log('\n⚠️ Không thể ghi file session-tokens.json:', err.message);
  }

  // ── Tổng kết ────────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Hoàn thành!`);
  console.log(`   Sử dụng lại token: ${results.reusedOk}/${USERS.length} user`);
  console.log(`   Đăng nhập mới    : ${results.loginOk} thành công / ${results.loginFail} lỗi`);
  if (!loginOnly) {
    console.log(`   Heartbeat thành công: ${results.pingOk}/${USERS.length}`);
  }
  console.log(`${'='.repeat(60)}\n`);

  // Exit với lỗi nếu không giữ được user nào online (khi không phải chế độ LOGIN_ONLY)
  const totalActive = results.reusedOk + results.loginOk;
  if (totalActive === 0) {
    console.error('💥 Lỗi: Không thể duy trì phiên hoạt động hoặc đăng nhập cho bất kỳ user nào!');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('💥 Lỗi nghiêm trọng:', err);
  process.exit(1);
});
