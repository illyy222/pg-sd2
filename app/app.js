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

// # SET PUG AS THE TEMPLATE ENGINE
// This lets us render .pug files in the browser
app.set("view engine", "pug");

// # SET THE VIEWS FOLDER
// This tells Express where the .pug files are stored
app.set("views", __dirname + "/views");


// ======================================
// # MIDDLEWARE
// ======================================

// # USE STATIC FILES
// This allows CSS files from the static folder to work
app.use(express.static("static"));

// # READ FORM DATA
// This allows us to get form input from POST requests
app.use(express.urlencoded({ extended: true }));


// ======================================
// # SESSION SETUP
// ======================================

// # IMPORT EXPRESS-SESSION
// This is used to remember which user is logged in
const session = require("express-session");

// # ENABLE SESSIONS
app.use(session({
  secret: "studycircle",   // # SECRET KEY FOR SESSION
  resave: false,           // # DON'T SAVE SESSION IF NOTHING CHANGED
  saveUninitialized: true  // # SAVE NEW SESSION
}));


// ======================================
// # DATABASE CONNECTION
// ======================================

// # IMPORT DATABASE CONNECTION FILE
const db = require("./services/db");


// ======================================
// # HOME PAGE ROUTE
// ======================================

// # HOME PAGE
// This route shows the main page if user is logged in
app.get("/", async function(req, res) {
  try {
    // # CHECK IF USER IS LOGGED IN
    if (req.session.user_id) {
      // # GET LOGGED-IN USER DETAILS FROM DATABASE
      const user = await UserModel.getById(req.session.user_id);

      // # RENDER HOME PAGE AND PASS USER DATA
      res.render("index", { user });
    } else {
      // # IF NOT LOGGED IN, SEND USER TO LOGIN PAGE
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
// This gets all users so they can pick a user to log in as
app.get("/login", async function(req, res) {
  try {
    // # GET ALL USERS FROM DATABASE
    const users = await UserModel.getAll();

    // # RENDER LOGIN PAGE
    res.render("login", { users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// # HANDLE LOGIN FORM
// This saves selected user ID into session
app.post("/login", function(req, res) {
  // # GET SELECTED USER ID FROM FORM
  const userId = req.body.user_id;

  // # STORE USER ID IN SESSION
  req.session.user_id = userId;

  // # REDIRECT TO HOME PAGE
  res.redirect("/");
});

// # LOGOUT ROUTE
// This removes the session and logs the user out
app.get("/logout", function(req, res) {
  // # DESTROY SESSION
  req.session.destroy();

  // # REDIRECT TO LOGIN PAGE
  res.redirect("/login");
});


// ======================================
// # DATABASE TEST ROUTE
// ======================================

// # TEST DATABASE CONNECTION
// This shows if the database is working
app.get("/db_test", async function(req, res) {
  try {
    // # GET TEST DATA
    const results = await TestModel.getAll();

    // # SHOW RESULTS ON PAGE
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
// This displays all users from the database
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
// This shows one user profile based on the ID in the URL
app.get("/users/:id", async function(req, res) {
  try {
    // # GET USER BY ID
    const user = await UserModel.getById(req.params.id);

    // # IF USER DOESN'T EXIST, SHOW ERROR
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
    // # SQL QUERY TO GET SESSION DETAILS + CATEGORY NAME
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

// # SHOW ONE STUDY SESSION
app.get("/sessions/:id", async function(req, res) {
  try {
    // # SQL QUERY TO GET ONE SESSION BY ID
    const sql = `
      SELECT sessions.title, sessions.rating, sessions.description, categories.name AS category
      FROM sessions
      JOIN categories ON sessions.category_id = categories.id
      WHERE sessions.id = ?
    `;

    // # RUN QUERY WITH SESSION ID
    const result = await db.query(sql, [req.params.id]);

    // # GET FIRST RESULT
    const session = result[0];

    // # IF SESSION DOESN'T EXIST, SHOW ERROR
    if (!session) {
      return res.status(404).send("Session not found");
    }

    // # RENDER SESSION PAGE
    res.render("session", { session });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});


// ======================================
// # MESSAGE ROUTES
// ======================================

// # SHOW MESSAGES PAGE
// This page shows all saved messages and the form to send a message
app.get("/messages", async function(req, res) {
  try {
    // # SQL QUERY TO GET MESSAGES WITH SENDER AND RECEIVER NAMES
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

    // # GET ALL USERS FOR DROPDOWN MENUS
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

    // # ETHICAL VALIDATION: CHECK IF MESSAGE IS EMPTY
    if (!message_text || message_text.trim() === "") {
      return res.send("Message cannot be empty");
    }

    // # ETHICAL VALIDATION: CHECK MESSAGE LENGTH
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

// # RUN THE APP ON PORT 3000
app.listen(3000, function() {
  console.log("Server running at http://127.0.0.1:3000/");
});

