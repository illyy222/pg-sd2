// Import express
const express = require("express");

// Import Models
const TestModel = require("./models/TestModel");
const UserModel = require("./models/UserModel");

// Create express app
var app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

// Add static files location
app.use(express.static("static"));

// Get database functions
const db = require('./services/db');

// Home route
app.get("/", function(req, res) {
res.render("index");
});

// DB test route
app.get("/db_test", async function(req, res) {
try {
const results = await TestModel.getAll();
console.log(results);
res.render("db_test", { results });
} catch(err) {
console.error(err);
res.status(500).send("Database error");
}
});

// ✅ USERS LIST ROUTE
app.get("/users", async function(req, res) {
try {
const users = await UserModel.getAll();
res.render("users", { users: users });
} catch (err) {
console.error(err);
res.status(500).send("Database error");
}
});

// ✅ USER PROFILE ROUTE 
app.get("/users/:id", async function(req, res) {
try {
const user = await UserModel.getById(req.params.id);

if (!user) {
return res.status(404).send("User not found");
}

res.render("profile", { user: user });

} catch (err) {
console.error(err);
res.status(500).send("Database error");
}
});

// Goodbye route
app.get("/goodbye", function(req, res) {
res.send("Goodbye Study Circle!");
});

// Dynamic hello route
app.get("/hello/:name", function(req, res) {
console.log(req.params);
res.send("Hello " + req.params.name);
});

// Start server
app.listen(3000,function(){
console.log(`Server running at http://127.0.0.1:3000/`);
});

