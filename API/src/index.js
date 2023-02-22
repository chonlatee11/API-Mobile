import express from "express";
import ip from "ip";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import database from "./config/mysql.config.js";
import logger from "./util/logger.js";
import bodyParser from "body-parser";
const jsonParser = bodyParser.json();

dotenv.config();
const PORT = process.env.SERVER_PORT || 3001;
const app = express();
const secret = process.env.SECRET;
app.use(cors({ origin: "*" }));

app.get("/", (res) => {
  res.send("Hello World!");
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
                      let token = jwt.sign({ email: element.Email }, secret, {
                        expiresIn: "1h",
                      });
                      res.json({
                        user: element,
                        accessToken: token,
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

  app.listen(PORT, () =>
  logger.info(`Server running on : ${ip.address()}:${PORT}`)
);