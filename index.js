var fs = require('fs');
var path = require('path');
var server = require('http').createServer(onRequest);

var io = require('socket.io')(server);
var SSHClient = require('ssh2').Client;

// Load static files into memory
var staticFiles = {};
var basePath = path.join(require.resolve('xterm'), '..');

['addons/fit/fit.js',
    'xterm.css',
    'xterm.js'
].forEach(function (f) {

    staticFiles['/' + f] = fs.readFileSync(path.join(basePath, `../../dist/${f}`));
});

staticFiles['/'] = fs.readFileSync('index.html');

// Handle static file serving
function onRequest(req, res) {
    var file;


    if (req.method === 'GET' && (file = staticFiles[req.url])) {
        res.writeHead(200, {
            'Content-Type': 'text/'
                + (/css$/.test(req.url)
                    ? 'css'
                    : (/js$/.test(req.url) ? 'javascript' : 'html'))
        });
        return res.end(file);
    }
    res.writeHead(404);
    res.end();
}

io.on('connection', function (socket) {
    var conn = new SSHClient();
    conn.on('ready', function () {
        socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
        conn.shell(function (err, stream) {
            if (err)
                return socket.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
            socket.on('data', function (data) {
                stream.write(data);
            });
            stream.on('data', function (d) {
                socket.emit('data', d.toString('binary'));
            }).on('close', function () {
                conn.end();
            });
        });
    }).on('close', function () {
        socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
    }).on('error', function (err) {
        socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
    }).connect({
        host: '0.0.0.0',//ipserver
        port: '2233',
        username: 'username',
        password: 'password'
    });
});
console.log("http://localhost:8000");
server.listen(8000);