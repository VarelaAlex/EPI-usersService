const mysql = require("mysql");
const util = require("util");
const fs = require('fs');
require("dotenv").config();

let database;

const dbUser = fs.readFileSync('/run/secrets/DB_USER', 'utf8').trim();
const dbPassword = fs.readFileSync('/run/secrets/DB_PASSWORD', 'utf8').trim();
const dbName = fs.readFileSync('/run/secrets/DB_NAME', 'utf8').trim();
const dbHost = process.env.DB_HOST;

let initializeConnectionPool=()=> {
    database = mysql.createPool({
        connectionLimit: 10,
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        multipleStatements: true
    });

    database.query = util.promisify(database.query);

    database.on("error", (err) => {
        if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET" || err.code === "ETIMEDOUT") {
            console.error("Database connection was closed. Reconnecting...");
            initializeConnectionPool();
        } else {
            console.error("Database error:", err);
            throw err;
        }
    });
}

initializeConnectionPool();

module.exports = database;
