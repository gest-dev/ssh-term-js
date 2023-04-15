const app = require("express")();
const http = require("http").Server(app);
const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");

var io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

var SSHClient = require("ssh2").Client;

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
// Config CORS and JSON response

app.use(cors());
app.use(express.json());
// Delivering static files
app.use("/assets", express.static("public"));
//app.use(helmet());
app.get("/term", function (req, res) {
  res.status(200);
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function (socket) {
  socket.on("initterm", function (datareq) {
    console.log(datareq);
    if (datareq.token === "ituckyssh") {
      //ssh cliente
      var conn = new SSHClient();
      conn
        .on("ready", function () {
          //teste com front vue
          socket.emit("term", "\r\n*** CONEXÃO SSH ESTABELECIDA ***\r\n");
          conn.shell(function (err, stream) {
            if (err)
              return socket.emit(
                "term",
                "\r\n*** ERRO SSH SHELL: " + err.message + " ***\r\n"
              );
            socket.on("term", function (data) {
              stream.write(data);
            });
            //not change name event
            stream
              .on("data", function (d) {
                socket.emit("term", d.toString("binary"));
              })
              .on("close", function () {
                conn.end();
              });
          });
        })
        .on("close", function () {
          socket.emit("term", "\r\n*** CONEXÃO SSH FECHADA ***\r\n");
        })
        .on("error", function (err) {
          socket.emit(
            "term",
            "\r\n*** ERRO DE CONEXÃO SSH: " + err.message + " ***\r\n"
          );
        })
        .connect({
          host: "172.16.0.10", //ip
          port: "22",
          username: "itucky",
          password: "5895]311",
        });
    } else {
      socket.emit("term", "\r\n*** DADOS INCORRETOS ***\r\n");
    }
    /* {
        host: "172.16.0.10", //ip
        port: "22",
        username: "itucky",
        password: "5895]311",
      } */
    socket.setMaxListeners(0);
  });

  //test fornt vue
  setInterval(function () {
    const data = {
      date: new Date(),
      message: "Mensagem enviada pelo servidor!",
    };
    socket.emit("server-message", data);
    socket.on("server-message", function (data) {
      console.log(data);
    });
  }, 5000);
});

app.get("/", function (req, res) {
  res.status(200);
  res.sendFile(__dirname + "/welcome.html");
});
app.use((req, res, next) => {
  const bomba = new Error("Error when requesting page!");
  bomba.status = 404;
  return next(bomba);
});
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      Mensgaem: err.message,
    },
  });
});

http.listen(8000, () => {
  console.log("http://localhost:8000");
});
