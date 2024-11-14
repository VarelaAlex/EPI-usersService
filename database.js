const mysql = require("mysql");
const util = require("util");
require("dotenv").config();

let database;

let initializeConnectionPool=()=> {
    database = mysql.createPool({
        connectionLimit: 10,
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
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