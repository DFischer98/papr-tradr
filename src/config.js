var convict = require('convict');

// Config Schema
var config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development"],
    default: "development",
    env: "NODE_ENV"
  },
  port: {
    doc: "The port to bind.",
    format: "port",
    default: 3000,
    env: "PORT",
    arg: "port"
  },
  db: {
    host: {
      doc: "Database host name/IP",
      format: '*',
      default: 'localhost'
    },
    name: {
      doc: "Database name",
      format: String,
      default: 'final'
    },
    user: {
        doc: "Database user",
        format: String,
        default: 'admin'
    },
    pwd: {
        doc: "Database Password",
        format: String,
        default: 'pwd'
    }
  }
});

// Load environment dependent configuration
var env = config.get('env');
config.loadFile('./config/' + env + '.json');

// Perform validation
config.validate({allowed: 'strict'});

module.exports = config;
