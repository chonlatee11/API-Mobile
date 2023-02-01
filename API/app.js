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

app.post("/DatabaseImage", jsonParser, function (req, res) {
  let ts = new Date().toLocaleDateString()
  poolCluster.getConnection(function (err, connection) {
    if (err) {
      console.log(err);
    } else {
      connection.query(
        "INSERT INTO DiseaseReport (UserID, UserFname, UserLname, Latitude, Longitude, PhoneNumber, Detail, DiseaseID, DiseaseName, DiseaseImage, ResaultPredict, DiseaseNameEng , DateReport, AddressUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
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
          req.body.AddressUser,
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

app.listen(3030, function () {
  console.log("CORS-enabled web server listening on port 3030");
});
