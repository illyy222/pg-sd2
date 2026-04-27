// # IMPORT DATABASE CONNECTION
const db = require("../services/db");

// # USER MODEL CLASS (handles all user data)
class UserModel {

  // # GET ALL USERS FROM DATABASE
  static async getAll() {
    // # SQL QUERY TO FETCH ALL USERS (INCLUDING SKILLS)
    const sql = "SELECT * FROM users";

    // # EXECUTE QUERY
    const users = await db.query(sql);

    // # RETURN RESULT TO CONTROLLER
    return users;
  }

  // # GET SINGLE USER BY ID
  static async getById(id) {
    // # SQL QUERY TO FIND USER BY ID
    const sql = "SELECT * FROM users WHERE id = ?";

    // # EXECUTE QUERY WITH PARAMETER
    const results = await db.query(sql, [id]);

    // # RETURN FIRST MATCHED USER
    return results[0];
  }
}

// # EXPORT MODEL TO USE IN ROUTES
module.exports = UserModel;

