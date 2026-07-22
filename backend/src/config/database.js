const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const config = require('./index');

// MySQL Configuration — reads from environment variables via config
const sequelize = new Sequelize(
    config.database.name,
    config.database.username,
    config.database.password,
    {
        host: config.database.host,
        port: config.database.port,
        dialect: 'mysql',
        logging: config.server.env === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('MySQL Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to MySQL database:', err);
    });

// MongoDB Configuration
mongoose.connect(config.mongodb.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

module.exports = {
    sequelize,
    mongoose
}; 