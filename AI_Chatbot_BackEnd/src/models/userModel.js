import db from "../db.js";

/**
 * UserModel:
 * - Lưu lịch sử hội thoại (messages)
 * - Lưu intent thường xuyên
 * - Lưu sở thích khách hàng (brand, style, price,...)
 */

const UserModel = {
  // Tạo user hoặc lấy user theo session_id
  async getOrCreateUser(sessionId) {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE session_id = ? LIMIT 1",
      [sessionId]
    );

    if (rows.length > 0) return rows[0];

    // nếu chưa có → tạo mới
    await db.execute(
      "INSERT INTO users (session_id, messages, preferences, last_intent) VALUES (?, ?, ?, ?)",
      [sessionId, JSON.stringify([]), JSON.stringify({}), null]
    );

    const [created] = await db.execute(
      "SELECT * FROM users WHERE session_id = ? LIMIT 1",
      [sessionId]
    );
    return created[0];
  },

  // Lưu một message vào lịch sử
  async saveMessage(sessionId, role, message) {
    const user = await this.getOrCreateUser(sessionId);
    // safe JSON parse (handle empty strings / bad data)
    let history;
    try {
      const raw = user && user.messages !== undefined && user.messages !== null ? user.messages : "[]";
      if (typeof raw === 'string') {
        history = raw.trim() === "" ? [] : JSON.parse(raw);
      } else if (typeof raw === 'object') {
        history = raw;
      } else {
        history = [];
      }
    } catch (e) {
      history = [];
    }

    history.push({
      role,
      message,
      timestamp: new Date().toISOString()
    });

    await db.execute(
      "UPDATE users SET messages = ? WHERE session_id = ?",
      [JSON.stringify(history), sessionId]
    );
  },

  // Lưu sở thích khách hàng (brand, category, price,...)
  async savePreferences(sessionId, prefs) {
    const user = await this.getOrCreateUser(sessionId);
    const old = JSON.parse(user.preferences || "{}");

    const updated = {
      ...old,
      ...prefs
    };

    await db.execute(
      "UPDATE users SET preferences = ? WHERE session_id = ?",
      [JSON.stringify(updated), sessionId]
    );
  },

  // Lưu intent cuối cùng
  async saveIntent(sessionId, intent) {
    await db.execute(
      "UPDATE users SET last_intent = ? WHERE session_id = ?",
      [intent, sessionId]
    );
  },

  // Lấy lịch sử hội thoại
  async getHistory(sessionId) {
    const user = await this.getOrCreateUser(sessionId);
    try {
      const raw = user && user.messages !== undefined && user.messages !== null ? user.messages : "[]";
      if (typeof raw === 'string') {
        return raw.trim() === "" ? [] : JSON.parse(raw);
      }
      if (typeof raw === 'object') return raw;
      return [];
    } catch (e) {
      return [];
    }
  },

  // Lấy sở thích khách hàng
  async getPreferences(sessionId) {
    const user = await this.getOrCreateUser(sessionId);
    try {
      const raw = user && user.preferences !== undefined && user.preferences !== null ? user.preferences : "{}";
      if (typeof raw === 'string') {
        return raw.trim() === "" ? {} : JSON.parse(raw);
      }
      if (typeof raw === 'object') return raw;
      return {};
    } catch (e) {
      return {};
    }
  }
};

export default UserModel;

// Named helpers for controller compatibility
export async function saveUserIfNotExists(sessionId, userInfo = {}) {
  const user = await UserModel.getOrCreateUser(sessionId);
  // If userInfo contains preferences-like fields, store them
  if (userInfo && Object.keys(userInfo).length) {
    try {
      // only save relevant keys (brand/style/height/weight/gender)
      const prefs = {};
      ['brand', 'style', 'price', 'height', 'weight', 'gender'].forEach((k) => {
        if (userInfo[k] !== undefined) prefs[k] = userInfo[k];
      });
      if (Object.keys(prefs).length) {
        await UserModel.savePreferences(sessionId, prefs);
      }
    } catch (e) {
      // non-fatal
      console.warn('[userModel] saveUserIfNotExists: failed to save prefs', e);
    }
  }
  return user.session_id || sessionId;
}

export async function saveChatMessage(sessionId, role, message) {
  return UserModel.saveMessage(sessionId, role, message);
}
