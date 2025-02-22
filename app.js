const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const socketHandler = require('./socket/chat');
require('dotenv').config();

// Victim Routes
const victimAuthRouter = require('./routes/victim/auth');
const victimReportRouter = require('./routes/victim/report');
const victimChatRouter = require('./routes/victim/chat');

// Admin Routes
const adminAuthRouter = require('./routes/admin/auth');
const adminCounselorsRouter = require('./routes/admin/counselors');
const adminCasesRouter = require('./routes/admin/cases');
const adminChatRouter = require('./routes/admin/chat');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Victim Routes
app.use('/api/victim/report', victimReportRouter);
app.use('/api/victim/chat', victimChatRouter);
app.use('/api/victim', victimAuthRouter);
// Admin Routes
app.use('/api/admin/counselors', adminCounselorsRouter);
app.use('/api/admin/cases', adminCasesRouter);
app.use('/api/admin/chat', adminChatRouter);
app.use('/api/admin', adminAuthRouter);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

socketHandler.init(server);
module.exports = app;
