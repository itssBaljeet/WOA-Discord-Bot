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
  rank: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  hasSentChallenge: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  hasBeenChallenged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  hooks: {
    beforeCreate: async (fighter) => {
      const maxRank = await Fighter.max('rank') || 0;
      fighter.rank = maxRank + 1;
    }
  }
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
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
  fightDate: DataTypes.DATE,
  winnerId: DataTypes.STRING,
});


sequelize.sync();

module.exports = { sequelize, Fighter, Fight };
