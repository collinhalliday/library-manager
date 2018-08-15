'use strict';
module.exports = (sequelize, DataTypes) => {
  var Book = sequelize.define('Book', {
    id: {
          type: DataTypes.INTEGER,
          primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'The "Title" field is required'
        }
      }
    },
    author: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'The "Author" field is required'
        }
      }
    },
    genre: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'The "Genre" field is required'
        }
      }
    },
    first_published: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        not: {
          args: [/[^0-9]/i],
          msg: 'The "First Published" field must be in year format (i.e. 1994)'
        }
      }
    }
  }, {
    timestamps: false
  });
  Book.associate = function(models) {
    // associations can be defined here
  };
  return Book;
};
