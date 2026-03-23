const db = require("../services/db");

class UserModel {
  static async getAll() {
    const sql = "SELECT * FROM users";
    const results = await db.query(sql);
    return results;
  }

  static async getById(id) {
    const sql = "SELECT * FROM users WHERE id = ?";
    const results = await db.query(sql, [id]);
    return results[0];
  }
}

module.exports = UserModel;


