
// # IMPORT EXPRESS
const express = require("express");

// # IMPORT MODELS
const TestModel = require("./models/TestModel");
const UserModel = require("./models/UserModel");

// # CREATE EXPRESS APP
const app = express();

// ======================================
// # VIEW ENGINE SETUP
// ======================================

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

// ======================================
// # MIDDLEWARE
// ======================================

app.use(express.static("static"));
app.use(express.urlencoded({ extended: true }));

// ======================================
// # SESSION SETUP
// ======================================

const session = require("express-session");

app.use(session({
  secret: "studycircle",
  resave: false,
  saveUninitialized: true
}));

// ======================================
// # DATABASE CONNECTION
// ======================================

const db = require("./services/db");

// ======================================
// # HOME PAGE
// ======================================

app.get("/", async function(req, res) {
  try {
    if (req.session.user_id) {
      const user = await UserModel.getById(req.session.user_id);
      res.render("index", { user });
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// ======================================
// # LOGIN ROUTES
// ======================================

app.get("/login", async function(req, res) {
  try {
    const users = await UserModel.getAll();
    res.render("login", { users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.post("/login", function(req, res) {
  const userId = req.body.user_id;
  req.session.user_id = userId;
  res.redirect("/");
});

app.get("/logout", function(req, res) {
  req.session.destroy();
  res.redirect("/login");
});

// ======================================
// # DATABASE TEST
// ======================================

app.get("/db_test", async function(req, res) {
  try {
    const results = await TestModel.getAll();
    res.render("db_test", { results });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// ======================================
// # USERS ROUTES
// ======================================

// # SHOW ALL USERS OR FILTER BY SKILL
app.get("/users", async function(req, res) {
  try {
    const skill = req.query.skill;

    let users = await UserModel.getAll();

    if (skill && skill.trim() !== "") {
      users = users.filter(user =>
        user.skills &&
        user.skills.toLowerCase().includes(skill.toLowerCase())
      );
    }

    res.render("users", { users });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # SHOW SINGLE USER PROFILE
app.get("/users/:id", async function(req, res) {
  try {
    const user = await UserModel.getById(req.params.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("profile", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// ======================================
// # STUDY SESSION ROUTES
// ======================================

app.get("/sessions", async function(req, res) {
  try {
    const sql = `
      SELECT sessions.id, sessions.title, sessions.rating, categories.name AS category
      FROM sessions
      JOIN categories ON sessions.category_id = categories.id
    `;

    const sessions = await db.query(sql);
    res.render("sessions", { sessions });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.get("/sessions/:id", async function(req, res) {
  try {
    const sql = `
      SELECT sessions.id, sessions.title, sessions.rating, sessions.description, categories.name AS category
      FROM sessions
      JOIN categories ON sessions.category_id = categories.id
      WHERE sessions.id = ?
    `;

    const result = await db.query(sql, [req.params.id]);
    const session = result[0];

    if (!session) {
      return res.status(404).send("Session not found");
    }

    res.render("session", { session });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # RATE SESSION
app.post("/sessions/:id/rate", async function(req, res) {
  try {
    const sessionId = req.params.id;
    const rating = parseInt(req.body.rating);

    if (!rating || rating < 1 || rating > 5) {
      return res.send("Invalid rating");
    }

    const sql = `
      UPDATE sessions
      SET rating = ?
      WHERE id = ?
    `;

    await db.query(sql, [rating, sessionId]);
    res.redirect(`/sessions/${sessionId}`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// ======================================
// # MESSAGE ROUTES
// ======================================

app.get("/messages", async function(req, res) {
  try {
    const sql = `
      SELECT 
        messages.id,
        sender.name AS sender_name,
        receiver.name AS receiver_name,
        messages.message_text
      FROM messages
      JOIN users AS sender ON messages.sender_id = sender.id
      JOIN users AS receiver ON messages.receiver_id = receiver.id
      ORDER BY messages.id DESC
    `;

    const messages = await db.query(sql);
    const users = await UserModel.getAll();

    res.render("messages", { messages, users });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # SEND MESSAGE WITH VALIDATION
app.post("/messages", async function(req, res) {
  try {
    const { sender_id, receiver_id, message_text } = req.body;

    // # PREVENT SELF MESSAGING
    if (sender_id === receiver_id) {
      return res.send("You cannot message yourself");
    }

    // # EMPTY MESSAGE CHECK
    if (!message_text || message_text.trim() === "") {
      return res.send("Message cannot be empty");
    }

    // # LENGTH CHECK
    if (message_text.length > 200) {
      return res.send("Message too long");
    }

    const sql = `
      INSERT INTO messages (sender_id, receiver_id, message_text)
      VALUES (?, ?, ?)
    `;

    await db.query(sql, [sender_id, receiver_id, message_text]);
    res.redirect("/messages");

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// ======================================
// # START SERVER
// ======================================

app.listen(3000, function() {
  console.log("Server running at http://127.0.0.1:3000/");
});


