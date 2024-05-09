// models/AccessToken.js
const { DataTypes } = require('sequelize');
const sequelize  = require('../database/database');

const AccessToken = sequelize.define('AccessToken', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    access_token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    expiry: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

module.exports = AccessToken;
