var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var ss = require('socket.io-stream');
var fs = require('fs');
var path = require('path');
var request = require('request');
var multiparty = require('multiparty');
var util = require('util');
var cors = require('cors');

app.use(cors());

var port = 8000;
console.log('Server listening on port ' + port)
server.listen(port);

var monitorId;
var serverId;
var clientConnected = false;
var monitorConnected = false;

io.on('connection', function (socket) {
  socket.on('monitor-connect', function (data) {
    monitorId = socket.Id;
    socket.join(socket.Id);
    if (clientId) io.clients[clientId].emit('monitor connected', monitorId);
    console.log('Monitor detected');
  });
  socket.on('client-connect', function (data) {
    clientId = socket.Id;
    if (monitorId) io.clients[clientId].emit('monitor connected', monitorId);
    console.log('Client detected');
  });
  ss(socket).on('ws-upload', function(stream, data) {
    console.log('uploading...');
    var filename = path.basename(data.name);
    stream.pipe(fs.createWriteStream(filename));
  });
});

// Hosting the client monitor
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html', function () {
    console.log('Monitor up');
  });
});

app.use('/js', express.static(__dirname + '/js'));
app.use('/css', express.static(__dirname + '/css'));

app.post('/upload', function (req, res) {
  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('Received Upload');
    res.end();
  });
  form.on('progress', function(bytesReceived, bytesExpected) {
    var progress = Math.floor((bytesReceived / bytesExpected)*100);
    console.log(progress);
    var response = {'progress':progress};
    io.sockets.emit('update-http-progress', response);
  });
})
