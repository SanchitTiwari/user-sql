require('dotenv').config();
const express = require('express');
const serialize = require('./src/database/database');
const userRoutes = require('./src/routes/routes');
const passport = require('passport');
const app = express();
const PORT = process.env.PORT || 3000;
const session = require('express-session');

app.use(session( {secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true}
}));

app.use(express.json());
app.use(passport.initialize());// passport library for auth is initialized 
app.use(passport.session()); // passport authentication session is stored 
require('./src/passport/passport.js');
app.use('/', userRoutes);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
