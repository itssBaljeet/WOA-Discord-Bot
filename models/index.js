const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Reference the database file
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../db', 'database.sqlite')
});

const Fighter = sequelize.define('Fighter', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  rank: DataTypes.INTEGER,
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

const Fight = sequelize.define('Fight', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fighter1Id: DataTypes.STRING,
  fighter2Id: DataTypes.STRING,
  result: DataTypes.STRING,
});

const PreviousFight = sequelize.define('PreviousFight', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fighter1Id: DataTypes.STRING,
  fighter2Id: DataTypes.STRING,
  winnerId: DataTypes.STRING,
  fightDate: DataTypes.DATE,
});

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
});

sequelize.sync();

module.exports = { sequelize, Fighter, Fight, PreviousFight, Admin };
