const db = require("../services/db");

class TestModel {

    static async getAll() {
        const sql = "SELECT * FROM test_table;";
        const results = await db.query(sql);
        return results;
    }

}

module.exports = TestModel;
