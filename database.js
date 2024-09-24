let mysql = require('mysql');
let util = require('util');

// TODO: Remove credentials from here
let database = {
    configuration: {
        host: 'localhost',
        user: 'root',
        password: 'rootroot',
        database: 'hytex',
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
}

module.exports = database