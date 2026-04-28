
// ======================================
// # IMPORT EXPRESS (server framework)
// ======================================
const express = require("express");

// ======================================
// # IMPORT MODELS (database logic)
// ======================================
const TestModel = require("./models/TestModel");
const UserModel = require("./models/UserModel");

// ======================================
// # CREATE EXPRESS APP
// ======================================
const app = express();

// ======================================
// # VIEW ENGINE SETUP (frontend)
// ======================================
app.set("view engine", "pug"); // # use pug templates
app.set("views", __dirname + "/views"); // # views folder location

// ======================================
// # MIDDLEWARE (runs before routes)
// ======================================
app.use(express.static("static")); // # allows CSS/images
app.use(express.urlencoded({ extended: true })); // # read form data

// ======================================
// # SESSION SETUP (login system)
// ======================================
const session = require("express-session");

app.use(session({
  secret: "studycircle", // # session security key
  resave: false,
  saveUninitialized: true
}));

// ======================================
// # DATABASE CONNECTION
// ======================================
const db = require("./services/db");

// ======================================
// # HOME PAGE ROUTE
// ======================================
app.get("/", async function(req, res) {
  try {
    let user = null; // # default if not logged in

    if (req.session.user_id) {
      user = await UserModel.getById(req.session.user_id);
    }

    res.render("index", { user });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// ======================================
// # LOGIN ROUTES
// ======================================

// # SHOW LOGIN PAGE
app.get("/login", async function(req, res) {
  try {
    const users = await UserModel.getAll(); // # dropdown users
    res.render("login", { users });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # HANDLE LOGIN
app.post("/login", function(req, res) {
  req.session.user_id = req.body.user_id; // # save user in session
  res.redirect("/");
});

// # LOGOUT
app.get("/logout", function(req, res) {
  req.session.destroy(); // # remove session
  res.redirect("/");
});

// ======================================
// # DATABASE TEST ROUTE
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

// # SHOW USERS WITH OPTIONAL SKILL SEARCH
app.get("/users", async function(req, res) {
  try {
    const skill = req.query.skill; // # get search input

    let users = await UserModel.getAll(); // # get all users

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

// # SINGLE USER PROFILE
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

// # SHOW ALL SESSIONS
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

// # SINGLE SESSION PAGE
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
// # BOOK SESSION FEATURE
// ======================================

// # USER CAN BOOK A SESSION
app.get("/sessions/:id/book", async function(req, res) {
  try {
    // # CHECK USER IS LOGGED IN
    if (!req.session.user_id) {
      return res.redirect("/login");
    }

    // # GET SESSION ID FROM URL
    const sessionId = req.params.id;

    // # GET SESSION INFO FROM DATABASE
    const sql = `SELECT id, title FROM sessions WHERE id = ?`;
    const result = await db.query(sql, [sessionId]);
    const session = result[0];

    // # IF SESSION DOES NOT EXIST
    if (!session) {
      return res.status(404).send("Session not found");
    }

    // # SHOW BOOKING CONFIRMATION PAGE
    res.render("booking", { session });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// ======================================
// # MESSAGE ROUTES
// ======================================

// # SHOW MESSAGES PAGE
app.get("/messages", async function(req, res) {
  try {
    // # CHECK USER IS LOGGED IN
    if (!req.session.user_id) {
      return res.redirect("/login");
    }

    // # GET LOGGED-IN USER ID
    const loggedInUserId = req.session.user_id;

    // # GET ONLY MESSAGES WHERE LOGGED-IN USER IS SENDER OR RECEIVER
    // # This improves privacy because users only see their own conversations
    const sql = `
      SELECT 
        messages.id,
        sender.name AS sender_name,
        receiver.name AS receiver_name,
        messages.message_text
      FROM messages
      JOIN users AS sender ON messages.sender_id = sender.id
      JOIN users AS receiver ON messages.receiver_id = receiver.id
      WHERE messages.sender_id = ? OR messages.receiver_id = ?
      ORDER BY messages.id DESC
    `;

    // # RUN QUERY WITH LOGGED-IN USER ID TWICE
    const messages = await db.query(sql, [loggedInUserId, loggedInUserId]);

    // # GET USERS FOR RECEIVER DROPDOWN
    let users = await UserModel.getAll();

    // # REMOVE LOGGED-IN USER FROM DROPDOWN
    users = users.filter(user => user.id != loggedInUserId);

    // # RENDER MESSAGES PAGE
    res.render("messages", { messages, users });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # SEND MESSAGE
app.post("/messages", async function(req, res) {
  try {
    // # GET LOGGED-IN USER AS SENDER
    const sender_id = req.session.user_id;

    // # GET RECEIVER AND MESSAGE FROM FORM
    const { receiver_id, message_text } = req.body;

    // # CHECK USER IS LOGGED IN
    if (!sender_id) {
      return res.redirect("/login");
    }

    // # PREVENT SELF MESSAGING
    if (sender_id == receiver_id) {
      return res.send("You cannot message yourself");
    }

    // # VALIDATION: MESSAGE CANNOT BE EMPTY
    if (!message_text || message_text.trim() === "") {
      return res.send("Message cannot be empty");
    }

    // # VALIDATION: MESSAGE LENGTH LIMIT
    if (message_text.length > 200) {
      return res.send("Message too long");
    }

    // # SAVE MESSAGE TO DATABASE
    const sql = `
      INSERT INTO messages (sender_id, receiver_id, message_text)
      VALUES (?, ?, ?)
    `;

    await db.query(sql, [sender_id, receiver_id, message_text]);

    // # REDIRECT BACK TO MESSAGES PAGE
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

