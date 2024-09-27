let mysql = require('mysql');
let util = require('util');
require('dotenv').config();

let database = {
    configuration: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    },
    connected: false,
    mysqlConnection: null,
    query: null,
    connect() {
        if (this.connected == false) {
            this.connected = true;
            this.mysqlConnection = mysql.createConnection(this.configuration);
            this.query = util.promisify(this.mysqlConnection.query).bind(this.mysqlConnection);
        }
    },
    disconnect() {
        if (this.connected == true) {
            this.connected = false;
            this.mysqlConnection.end();
        }
    }
};

module.exports = database;