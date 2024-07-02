const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Reference the database file
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../db', 'database.sqlite')
});

const sanitizeUsername = (username) => {
  return username.replace(/[*_~`]/g, '');
};


const Fighter = sequelize.define('Fighter', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    set(value) {
      this.setDataValue('name', sanitizeUsername(value));
    },
  },
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
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
  fightDate: DataTypes.DATE,
  winnerId: DataTypes.STRING,
  combatStyle: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});


sequelize.sync();

module.exports = { sequelize, Fighter, Fight };
