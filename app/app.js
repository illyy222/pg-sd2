// # IMPORT EXPRESS
// Express is used to create the web server and handle routes
const express = require("express");

// # IMPORT MODELS
// These files contain functions to interact with the database
const TestModel = require("./models/TestModel");
const UserModel = require("./models/UserModel");

// # CREATE EXPRESS APP
// This is your main application
const app = express();


// ======================================
// # SETUP VIEW ENGINE
// ======================================

// # SET TEMPLATE ENGINE TO PUG
// Allows us to use .pug files to render HTML pages
app.set("view engine", "pug");

// # SET VIEWS FOLDER LOCATION
// Tells Express where your .pug files are stored
app.set("views", __dirname + "/views");


// ======================================
// # MIDDLEWARE
// ======================================

// # STATIC FILES
// Allows CSS and images from /static folder
app.use(express.static("static"));

// # FORM DATA PARSER
// Lets us read data sent from forms (POST requests)
app.use(express.urlencoded({ extended: true }));


// ======================================
// # SESSION MANAGEMENT
// ======================================

// # IMPORT SESSION LIBRARY
const session = require("express-session");

// # ENABLE SESSIONS
// Used to store logged-in user information
app.use(session({
  secret: "studycircle",   // secret key (can be anything)
  resave: false,           // don't save if unchanged
  saveUninitialized: true  // save new sessions
}));


// ======================================
// # DATABASE CONNECTION
// ======================================

// # IMPORT DATABASE CONNECTION FILE
const db = require("./services/db");


// ======================================
// # HOME PAGE ROUTE
// ======================================

// # GET REQUEST FOR HOME PAGE "/"
app.get("/", async function(req, res) {
  try {

    // # CHECK IF USER IS LOGGED IN (SESSION EXISTS)
    if (req.session.user_id) {

      // # GET USER FROM DATABASE USING ID
      const user = await UserModel.getById(req.session.user_id);

      // # RENDER HOME PAGE AND PASS USER DATA
      res.render("index", { user });

    } else {

      // # IF NOT LOGGED IN → REDIRECT TO LOGIN
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

    // # GET ALL USERS FROM DATABASE
    const users = await UserModel.getAll();

    // # RENDER LOGIN PAGE WITH USERS LIST
    res.render("login", { users });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # HANDLE LOGIN FORM SUBMISSION
app.post("/login", function(req, res) {

  // # GET USER ID FROM FORM
  const userId = req.body.user_id;

  // # SAVE USER ID IN SESSION
  req.session.user_id = userId;

  // # REDIRECT TO HOME PAGE
  res.redirect("/");
});

// # LOGOUT ROUTE
app.get("/logout", function(req, res) {

  // # DESTROY SESSION (LOG OUT USER)
  req.session.destroy();

  // # REDIRECT TO LOGIN PAGE
  res.redirect("/login");
});


// ======================================
// # DATABASE TEST ROUTE
// ======================================

// # TEST IF DATABASE CONNECTION WORKS
app.get("/db_test", async function(req, res) {
  try {

    // # GET TEST DATA FROM DATABASE
    const results = await TestModel.getAll();

    // # DISPLAY RESULTS
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

    // # GET USERS FROM DATABASE
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

    // # CHECK IF USER EXISTS
    if (!user) {
      return res.status(404).send("User not found");
    }

    // # SHOW PROFILE PAGE
    res.render("profile", { user });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});


// ======================================
// # STUDY SESSIONS ROUTES
// ======================================

// # SHOW ALL SESSIONS
app.get("/sessions", async function(req, res) {
  try {

    // # SQL QUERY TO JOIN SESSIONS + CATEGORIES
    const sql = `
      SELECT sessions.id, sessions.title, sessions.rating, categories.name AS category
      FROM sessions
      JOIN categories ON sessions.category_id = categories.id
    `;

    // # RUN QUERY
    const sessions = await db.query(sql);

    // # RENDER PAGE
    res.render("sessions", { sessions });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # SHOW SINGLE SESSION
app.get("/sessions/:id", async function(req, res) {
  try {

    const sql = `
      SELECT sessions.title, sessions.rating, sessions.description, categories.name AS category
      FROM sessions
      JOIN categories ON sessions.category_id = categories.id
      WHERE sessions.id = ?
    `;

    // # RUN QUERY WITH ID
    const result = await db.query(sql, [req.params.id]);

    // # GET FIRST RESULT
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


// ======================================
// # MESSAGING ROUTES
// ======================================

// # SHOW ALL MESSAGES
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

    // # GET MESSAGES
    const messages = await db.query(sql);

    // # GET USERS FOR DROPDOWN
    const users = await UserModel.getAll();

    // # SHOW PAGE
    res.render("messages", { messages, users });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});


// # SEND MESSAGE
app.post("/messages", async function(req, res) {
  try {

    const { sender_id, receiver_id, message_text } = req.body;

    // # VALIDATION: EMPTY MESSAGE
    if (!message_text || message_text.trim() === "") {
      return res.send("Message cannot be empty");
    }

    // # VALIDATION: MESSAGE LENGTH
    if (message_text.length > 200) {
      return res.send("Message too long");
    }

    // # INSERT MESSAGE INTO DATABASE
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
// # SERVER START
// ======================================

// # START SERVER ON PORT 3000
app.listen(3000, function() {
  console.log("Server running at http://127.0.0.1:3000/");
});

