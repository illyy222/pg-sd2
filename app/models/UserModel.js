// # IMPORT DATABASE CONNECTION
const db = require("../services/db");

// # USER MODEL CLASS
class UserModel {

  // # GET ALL USERS
  static async getAll() {
    // # SQL QUERY TO GET ALL USERS
    const sql = "SELECT * FROM users";

    // # RUN QUERY
    const users = await db.query(sql);

    // # ADD SKILLS TO EACH USER
    users.forEach(user => {
      if (user.name === "Ilhan Mohamed") {
        user.skills = "Referencing, Essay Structure, Study Support";
      } else if (user.name === "Sabrin Saed") {
        user.skills = "Java, Programming Support";
      } else if (user.name === "Huda Abi") {
        user.skills = "Essay Review, Academic Writing";
      } else if (user.name === "Amina Aden") {
        user.skills = "Proofreading, Study Advice";
      } else if (user.name === "Aisha Mohamed") {
        user.skills = "Group Study, Referencing";
      } else if (user.name === "Noah Smith") {
        user.skills = "Java, Coding Basics";
      } else if (user.name === "Ayah Hadid") {
        user.skills = "Referencing, Coursework Help";
      } else if (user.name === "Malik Khan") {
        user.skills = "Revision Support, Programming";
      } else {
        user.skills = "General Study Support";
      }
    });

    // # RETURN USERS
    return users;
  }

  // # GET ONE USER BY ID
  static async getById(id) {
    // # SQL QUERY TO GET ONE USER
    const sql = "SELECT * FROM users WHERE id = ?";

    // # RUN QUERY WITH ID
    const results = await db.query(sql, [id]);

    // # GET FIRST RESULT
    const user = results[0];

    // # ADD SKILLS TO SINGLE USER
    if (user) {
      if (user.name === "Ilhan Mohamed") {
        user.skills = "Referencing, Essay Structure, Study Support";
      } else if (user.name === "Sabrin Saed") {
        user.skills = "Java, Programming Support";
      } else if (user.name === "Huda Abi") {
        user.skills = "Essay Review, Academic Writing";
      } else if (user.name === "Amina Aden") {
        user.skills = "Proofreading, Study Advice";
      } else if (user.name === "Aisha Mohamed") {
        user.skills = "Group Study, Referencing";
      } else if (user.name === "Noah Smith") {
        user.skills = "Java, Coding Basics";
      } else if (user.name === "Ayah Hadid") {
        user.skills = "Referencing, Coursework Help";
      } else if (user.name === "Malik Khan") {
        user.skills = "Revision Support, Programming";
      } else {
        user.skills = "General Study Support";
      }
    }

    // # RETURN USER
    return user;
  }
}

// # EXPORT USER MODEL
module.exports = UserModel;



