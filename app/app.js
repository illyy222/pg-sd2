// # IMPORT EXPRESS
// Express is used to create the server and handle routes
const express = require("express");

// # IMPORT MODELS
// These files help us get data from the database
const TestModel = require("./models/TestModel");
const UserModel = require("./models/UserModel");

// # CREATE EXPRESS APP
const app = express();


// ======================================
// # VIEW ENGINE SETUP
// ======================================

// # SET PUG AS TEMPLATE ENGINE
// This allows us to render .pug files as pages
app.set("view engine", "pug");

// # SET VIEWS FOLDER
// This tells Express where the .pug files are stored
app.set("views", __dirname + "/views");


// ======================================
// # MIDDLEWARE
// ======================================

// # STATIC FILES
// Allows CSS files from the static folder to load
app.use(express.static("static"));

// # FORM DATA PARSER
// Allows us to read data from forms
app.use(express.urlencoded({ extended: true }));


// ======================================
// # SESSION SETUP
// ======================================

// # IMPORT SESSION LIBRARY
const session = require("express-session");

// # ENABLE SESSIONS
// Used to remember which user is logged in
app.use(session({
  secret: "studycircle",
  resave: false,
  saveUninitialized: true
}));


// ======================================
// # DATABASE CONNECTION
// ======================================

// # IMPORT DATABASE CONNECTION FILE
const db = require("./services/db");


// ======================================
// # HOME PAGE
// ======================================

// # HOME ROUTE
// Shows homepage only if user is logged in
app.get("/", async function(req, res) {
  try {
    // # CHECK IF USER IS LOGGED IN
    if (req.session.user_id) {
      // # GET USER DETAILS FROM DATABASE
      const user = await UserModel.getById(req.session.user_id);

      // # RENDER HOME PAGE
      res.render("index", { user });
    } else {
      // # IF NOT LOGGED IN, SEND TO LOGIN
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

// # SHOW LOGIN PAGE
app.get("/login", async function(req, res) {
  try {
    // # GET ALL USERS FOR LOGIN DROPDOWN
    const users = await UserModel.getAll();

    // # SHOW LOGIN PAGE
    res.render("login", { users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # HANDLE LOGIN FORM
app.post("/login", function(req, res) {
  // # GET SELECTED USER ID FROM FORM
  const userId = req.body.user_id;

  // # SAVE USER ID IN SESSION
  req.session.user_id = userId;

  // # REDIRECT TO HOME PAGE
  res.redirect("/");
});

// # LOGOUT ROUTE
app.get("/logout", function(req, res) {
  // # DESTROY SESSION TO LOG OUT USER
  req.session.destroy();

  // # REDIRECT TO LOGIN PAGE
  res.redirect("/login");
});


// ======================================
// # DATABASE TEST
// ======================================

// # TEST DATABASE CONNECTION
app.get("/db_test", async function(req, res) {
  try {
    // # GET TEST DATA
    const results = await TestModel.getAll();

    // # SHOW RESULTS
    res.render("db_test", { results });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});


// ======================================
// # USERS ROUTES
// ======================================

// # SHOW ALL USERS
app.get("/users", async function(req, res) {
  try {
    // # GET ALL USERS
    const users = await UserModel.getAll();

    // # RENDER USERS PAGE
    res.render("users", { users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # SHOW SINGLE USER PROFILE
app.get("/users/:id", async function(req, res) {
  try {
    // # GET USER BY ID FROM URL
    const user = await UserModel.getById(req.params.id);

    // # IF USER DOES NOT EXIST
    if (!user) {
      return res.status(404).send("User not found");
    }

    // # RENDER PROFILE PAGE
    res.render("profile", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});


// ======================================
// # STUDY SESSION ROUTES
// ======================================

// # SHOW ALL STUDY SESSIONS
app.get("/sessions", async function(req, res) {
  try {
    // # SQL QUERY TO GET SESSIONS + CATEGORY
    const sql = `
      SELECT sessions.id, sessions.title, sessions.rating, categories.name AS category
      FROM sessions
      JOIN categories ON sessions.category_id = categories.id
    `;

    // # RUN QUERY
    const sessions = await db.query(sql);

    // # RENDER SESSIONS PAGE
    res.render("sessions", { sessions });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # SHOW ONE SESSION
app.get("/sessions/:id", async function(req, res) {
  try {
    // # SQL QUERY TO GET ONE SESSION BY ID
    const sql = `
      SELECT sessions.id, sessions.title, sessions.rating, sessions.description, categories.name AS category
      FROM sessions
      JOIN categories ON sessions.category_id = categories.id
      WHERE sessions.id = ?
    `;

    // # RUN QUERY USING ID FROM URL
    const result = await db.query(sql, [req.params.id]);

    // # GET FIRST RESULT
    const session = result[0];

    // # IF SESSION DOES NOT EXIST
    if (!session) {
      return res.status(404).send("Session not found");
    }

    // # RENDER SINGLE SESSION PAGE
    res.render("session", { session });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # HANDLE SESSION RATING FORM
app.post("/sessions/:id/rate", async function(req, res) {
  try {
    // # GET SESSION ID FROM URL
    const sessionId = req.params.id;

    // # GET RATING FROM FORM
    const rating = parseInt(req.body.rating);

    // # VALIDATE RATING
    // Must be between 1 and 5
    if (!rating || rating < 1 || rating > 5) {
      return res.send("Invalid rating");
    }

    // # UPDATE SESSION RATING IN DATABASE
    const sql = `
      UPDATE sessions
      SET rating = ?
      WHERE id = ?
    `;

    await db.query(sql, [rating, sessionId]);

    // # REDIRECT BACK TO SESSION PAGE
    res.redirect(`/sessions/${sessionId}`);
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
    // # SQL QUERY TO GET MESSAGE DATA + USER NAMES
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

    // # GET ALL MESSAGES
    const messages = await db.query(sql);

    // # GET ALL USERS FOR DROPDOWNS
    const users = await UserModel.getAll();

    // # RENDER MESSAGES PAGE
    res.render("messages", { messages, users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # HANDLE SEND MESSAGE FORM
app.post("/messages", async function(req, res) {
  try {
    // # GET FORM DATA
    const { sender_id, receiver_id, message_text } = req.body;

    // # VALIDATION: CHECK IF MESSAGE IS EMPTY
    if (!message_text || message_text.trim() === "") {
      return res.send("Message cannot be empty");
    }

    // # VALIDATION: CHECK IF MESSAGE IS TOO LONG
    // This helps reduce spam or misuse
    if (message_text.length > 200) {
      return res.send("Message too long");
    }

    // # SQL QUERY TO INSERT MESSAGE
    const sql = `
      INSERT INTO messages (sender_id, receiver_id, message_text)
      VALUES (?, ?, ?)
    `;

    // # SAVE MESSAGE TO DATABASE
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

// # START APP ON PORT 3000
app.listen(3000, function() {
  console.log("Server running at http://127.0.0.1:3000/");
});
