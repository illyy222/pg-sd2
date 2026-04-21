// # IMPORT EXPRESS
// This lets us create the web server and routes
const express = require("express");

// # IMPORT MODELS
// These get data from the database
const TestModel = require("./models/TestModel");
const UserModel = require("./models/UserModel");

// # CREATE APP
// This is the main app we use to build everything
var app = express();

// # SET PUG VIEW ENGINE
// Allows us to use .pug files for frontend
app.set("view engine", "pug");

// # SET VIEWS FOLDER
// Tells Express where our pug files are
app.set("views", __dirname + "/views");

// # STATIC FILES
// Allows us to use CSS (style.css)
app.use(express.static("static"));

// # READ FORM DATA
// Needed to get data from forms (login/messages)
app.use(express.urlencoded({ extended: true }));

// # SESSION SETUP (LOGIN SYSTEM)
// This stores user info temporarily (like who is logged in)
const session = require("express-session");
app.use(session({
  secret: "studycircle", // random key for security
  resave: false,
  saveUninitialized: true
}));

// # DATABASE CONNECTION
const db = require("./services/db");


// ======================================
// # HOME PAGE
// ======================================

app.get("/", async function(req, res) {

  // # CHECK IF USER IS LOGGED IN
  if (req.session.user_id) {

    // # GET USER DATA FROM DATABASE
    const user = await UserModel.getById(req.session.user_id);

    // # SHOW HOME PAGE WITH USER
    res.render("index", { user: user });

  } else {

    // # IF NOT LOGGED IN → GO TO LOGIN PAGE
    res.redirect("/login");
  }

});


// ======================================
// # LOGIN SYSTEM
// ======================================

// # SHOW LOGIN PAGE
// Gets all users and displays dropdown
app.get("/login", async function(req, res) {

  const users = await UserModel.getAll();

  // # SEND USERS TO LOGIN PAGE
  res.render("login", { users });

});


// # HANDLE LOGIN
// Takes selected user and saves in session
app.post("/login", function(req, res) {

  const userId = req.body.user_id;

  // # STORE USER ID IN SESSION
  req.session.user_id = userId;

  // # REDIRECT TO HOME
  res.redirect("/");
});


// # LOGOUT
// Removes session (logs user out)
app.get("/logout", function(req, res) {

  req.session.destroy();

  res.redirect("/login");
});


// ======================================
// # USERS
// ======================================

// # SHOW ALL USERS
app.get("/users", async function(req, res) {

  const users = await UserModel.getAll();

  res.render("users", { users });

});


// # USER PROFILE
app.get("/users/:id", async function(req, res) {

  const user = await UserModel.getById(req.params.id);

  res.render("profile", { user });

});


// ======================================
// # SESSIONS
// ======================================

// # SHOW ALL SESSIONS
app.get("/sessions", async function(req, res) {

  const sql = `
    SELECT sessions.id, sessions.title, sessions.rating, categories.name AS category
    FROM sessions
    JOIN categories ON sessions.category_id = categories.id
  `;

  const sessions = await db.query(sql);

  res.render("sessions", { sessions });

});


// # SINGLE SESSION PAGE
app.get("/sessions/:id", async function(req, res) {

  const sql = `
    SELECT sessions.title, sessions.rating, categories.name AS category
    FROM sessions
    JOIN categories ON sessions.category_id = categories.id
    WHERE sessions.id = ?
  `;

  const result = await db.query(sql, [req.params.id]);

  const session = result[0];

  res.render("session", { session });

});


// ======================================
// # MESSAGES
// ======================================

// # SHOW MESSAGES
app.get("/messages", async function(req, res) {

  const sql = `
    SELECT 
      messages.id,
      sender.name AS sender_name,
      receiver.name AS receiver_name,
      messages.message_text
    FROM messages
    JOIN users AS sender ON messages.sender_id = sender.id
    JOIN users AS receiver ON messages.receiver_id = receiver.id
  `;

  const messages = await db.query(sql);

  res.render("messages", { messages });

});


// # SEND MESSAGE
app.post("/messages", async function(req, res) {

  const { sender_id, receiver_id, message_text } = req.body;

  const sql = `
    INSERT INTO messages (sender_id, receiver_id, message_text)
    VALUES (?, ?, ?)
  `;

  await db.query(sql, [sender_id, receiver_id, message_text]);

  res.redirect("/messages");

});


// ======================================
// # START SERVER
// ======================================

app.listen(3000, function() {
  console.log("Server running at http://127.0.0.1:3000/");
});






