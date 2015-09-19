var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
//var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

/* Main Server */

var app = express();
var server = require('http').Server(app);

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

var io = require('socket.io')(server);

server.listen(port, function(){
  console.log('listening on: ' + this.address().port);
});

var userCount = 0;
var userIDs = [];
var allClients = [];

io.on('connection', function (socket) {

  /* User connected */

  socket.emit('initial-connection', {
    myID: socket.id,
    connected: userIDs
  });

  allClients.push(socket);
  userIDs.push(socket.id);
  //socket.join(socket.id);
  console.log('user connected: ' + userIDs[userCount]); 

  socket.broadcast.emit('user-connected', {
    userID: userIDs[userCount]
  });

  userCount++;

  /* User disconnected */

  socket.on('disconnect',function() { 
    userCount--;
    var disconnectedIndex = allClients.indexOf(socket);
    socket.broadcast.emit('user-disconnected', {
      userID: userIDs[disconnectedIndex]
    })
    console.log('user disconnected: ' + userIDs[disconnectedIndex]); 
    userIDs.splice(disconnectedIndex, 1);
    allClients.splice(disconnectedIndex, 1);
  });

  /* Message Engine */

  socket.on('incoming-message', function (data) {

    for (i=0; i < data.recipients.length; i++) {
      if (userIDs.indexOf( data.recipients[i] ) > -1) {
        allClients[ userIDs.indexOf( data.recipients[i] ) ].emit("outgoing-message", {
          sender: data.sender,
          recipients: data.recipients,
          message: data.message
        }); 
      }
    }

  });

  /* In case of an error */

  socket.on('error', function (err) { 
    console.error(err.stack);
  })

});

/* End Main Server */

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// STUFF I DONT KNOW STARTS HERE

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

module.exports = app;
