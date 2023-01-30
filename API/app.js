var express = require("express");
var cors = require("cors");
var app = express();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const fileUpload = require("express-fileupload");
const path = require("path");
const mime = require("mime");
const fs = require("fs");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Use cors to allow cross origin resource sharing
app.use(cors());
// Use the express-fileupload middleware
app.use(fileUpload());
var mysql = require("mysql");
const { url } = require("inspector");
var poolCluster = mysql.createPoolCluster();
poolCluster.add("node0", {
  host: "192.168.1.22",
  port: "3306",
  database: "mymariaDB",
  user: "devchon",
  password: "devchon101",
  charset: "utf8mb4",
});

app.get("/getUser", jsonParser, function (req, res, next) {
  poolCluster.getConnection(function (err, connection) {
    if (err) {
      console.log(err);
    } else {
      connection.query("SELECT * FROM User", function (err, rows) {
        if (err) {
          res.json({ err });
        } else {
          res.json({ rows });
          // connection.end();
          console.log(rows);
          connection.release();
        }
      });
    }
  });
});

app.post("/register", jsonParser, function (req, res, next) {
  console.log(req.body);
  const saltRounds = 10;
  const myPlaintextPassword = req.body.passWord;
  bcrypt.hash(myPlaintextPassword, saltRounds, function (err, hash) {
    console.log(hash);
    if (err) {
      console.log(err);
    } else {
      poolCluster.getConnection(function (err, connection) {
        if (err) {
          console.log(err);
        } else {
          connection.query(
            "INSERT INTO User (UserName, Password, fName, lName, PhoneNumber, Address, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
            [
              req.body.userName,
              hash,
              req.body.fName,
              req.body.lName,
              req.body.phoneNumber,
              req.body.address,
              req.body.latitude,
              req.body.longitude,
            ],
            function (err) {
              if (err) {
                res.json({ err });
              } else {
                res.json({ status: "success" });
                connection.release();
              }
            }
          );
        }
      });
    }
  });
});

app.post("/login", jsonParser, function (req, res, next) {
  console.log(req.body);

  poolCluster.getConnection(function (err, connection) {
    if (err) {
      console.log(err);
    } else {
      connection.query(
        "SELECT * FROM User WHERE UserName = ?",
        [req.body.userName],
        function (err, rows) {
          if (err) {
            console.log(err);
          } else {
            for (let index = 0; index < rows.length; index++) {
              const element = rows[index];
              bcrypt.compare(
                req.body.passWord,
                element.Password,
                function (err, result) {
                  if (err) {
                    console.log(err);
                  }
                  if (result == true) {
                    console.log("password match");
                    // res.json({ status: "success" });
                    // console.log(rows);
                    // console.log(rows.length);
                    // console.log(res.statusCode);
                    res.json({
                      user: element,
                      accessToken: 'wBv"_vLj>Ido#r4Fm1|YCm&wOwCA_v',
                    });
                    connection.release();
                  } else {
                    console.log("password not match");
                    // res.status==401;
                    res.json({ data: "notmatch", status: 402 });
                    connection.release();
                  }
                }
              );
            }
          }
          if (rows.length == 0 || rows == undefined) {
            res.json({ data: "Not found", status: 401 });
            connection.release();
          }
        }
      );
    }
  });
});

// for show resualt
app.post("/diseaseresualt", jsonParser, function (req, res, next) {
  poolCluster.getConnection(function (err, connection) {
    if (err) {
      console.log(err);
    } else {
      connection.query(
        "SELECT * FROM Disease WHERE DiseaseNameEng = ?;",
        [req.body.name],
        function (err, data) {
          if (err) {
            res.json({ err });
          } else {
            const DiseaseData = {
              DiseaseID: data[0].DiseaseID,
              DiseaseName: data[0].DiseaseName, //update this
              InfoDisease: data[0].InfoDisease,
              ProtectInfo: data[0].ProtectInfo,
              ImageUrl: "http://192.168.1.22:3030/image/" + data[0].ImageName,
              DiseaseNameEng: data[0].DiseaseNameEng,
            };
            res.json({ DiseaseData });
            // connection.end();
            connection.release();
          }
        }
      );
    }
  });
});

app.get("/disease", jsonParser, function (req, res, next) {
  poolCluster.getConnection(function (err, connection) {
    if (err) {
      console.log(err);
    } else {
      connection.query(
        "SELECT * FROM Disease",
        [req.body.name],
        function (err, data) {
          if (err) {
            res.json({ err });
          } else {
            console.log(data.length);
            for (let i = 0; i < data.length; i++) {
              data[i].ImageUrl =
                "http://192.168.1.22:3030/image/" + data[i].ImageName;
            }
            res.json({ data });
            // connection.end();
            connection.release();
          }
        }
      );
    }
  });
});

app.post("/DatabaseImage", jsonParser, function (req, res) {
  let ts = new Date().toLocaleDateString()
  poolCluster.getConnection(function (err, connection) {
    if (err) {
      console.log(err);
    } else {
      connection.query(
        "INSERT INTO DiseaseReport (UserID, UserFname, UserLname, Latitude, Longitude, PhoneNumber, Detail, DiseaseID, DiseaseName, DiseaseImage, ResaultPredict, DiseaseNameEng , DateReport) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [
          req.body.UserID,
          req.body.UserFname,
          req.body.UserLname,
          req.body.Latitude,
          req.body.Longitude,
          req.body.PhoneNumber,
          req.body.Detail,
          req.body.DiseaseID,
          req.body.DiseaseName,
          req.body.DiseaseImage,
          req.body.ResaultPredict,
          req.body.DiseaseNameEng,
          ts,
        ],
        function (err) {
          if (err) {
            res.json({ err });
            connection.release();
          } else {
            res.json({ status: "success" });
            connection.release();
          }
        }
      );
    }
  });
});

app.post("/uploadImage", jsonParser, function (req, res) {
  let sampleFile;
  let uploadPath;
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  sampleFile = req.files;
  console.log(sampleFile);
  console.log(sampleFile.file.name);
  uploadPath = __dirname + "/image/" + sampleFile.file.name + ".jpg";
  console.log(uploadPath);
  // Use the mv() method to place the file somewhere on your server
  sampleFile.file.mv(uploadPath, function (err) {
    if (err) return res.status(500).send(err);
    res.send("File uploaded!");
  });
});

//for get image url
app.get("/image/:filename", (req, res) => {
  const filePath = path.join(__dirname, "/image/", req.params.filename);
  console.log(filePath);
  const fileType = mime.lookup(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) throw err;
    res.writeHead(200, { "Content-Type": fileType });
    res.end(data);
  });
});

app.post("/diseasereport", jsonParser, function (req, res) {
  console.log(req.body);
  poolCluster.getConnection(function (err, connection) {
    if (err) {
      console.log(err);
    } else {
      connection.query(
        "SELECT * FROM DiseaseReport WHERE UserID = ?;",
        [req.body.userID],
        function (err, data) {
          if (err) {
            res.json({ err });
          } else {
            console.log(data.length);
            for (let i = 0; i < data.length; i++) {
              data[i].ImageUrl =
                "http://192.168.1.22:3030/image/" + data[i].DiseaseImage;
            }
            res.json({ data });
            // connection.end();
            connection.release();
          }
        }
      );
    }
  });
});

app.get("/diseaseallreport", jsonParser, function (req, res) {
  console.log(req.body);
  poolCluster.getConnection(function (err, connection) {
    if (err) {
      console.log(err);
    } else {
      connection.query(
        "SELECT * FROM DiseaseReport",
        [req.body.userID],
        function (err, data) {
          if (err) {
            res.json({ err });
          } else {
            console.log(data.length);
            for (let i = 0; i < data.length; i++) {
              data[i].ImageUrl =
                "http://192.168.1.22:3030/image/" + data[i].DiseaseImage ;
            }
            res.json({ data });
            // connection.end();
            connection.release();
          }
        }
      );
    }
  });
});

app.listen(3030, function () {
  console.log("CORS-enabled web server listening on port 3030");
});
