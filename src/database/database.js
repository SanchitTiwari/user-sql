require('dotenv').config();
const { Sequelize } = require('sequelize');


const sequelize= new Sequelize('Users', process.env.SQL_USER, process.env.SQL_PASS, {
    host: 'localhost',
    dialect: 'mysql'
});

try {
  sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

sequelize.sync()
  .then(() => {
    console.log('Database synchronized successfully');
  })
  .catch(err => {
    console.error('Error synchronizing database:', err);
  });

module.exports = sequelize;