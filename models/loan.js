'use strict';

const dateFormat = require('dateformat');

let now = new Date();
let nowMinusOne = new Date(now).setDate(now.getDate() - 1);
let today = dateFormat(now, "yyyy-mm-dd");
let yesterday = dateFormat(nowMinusOne, "yyyy-mm-dd");

/*
Basic structure generated through Sequelize CLI. Additions include validations, error messages,
removal of timestamps. Also included date functions and formatting above for the date-related
validations below.
*/

module.exports = (sequelize, DataTypes) => {
  const Loan = sequelize.define('Loan', {
    id: {
          type: DataTypes.INTEGER,
          primaryKey: true
    },
    book_id: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'The "Book_ID" field is required'
        }
      }
    },
    patron_id: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'The "Patron_ID" field is required'
        }
      }
    },
    loaned_on: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg: 'The "Loaned on" field is required'
        },
        isDate: {
          msg: 'You must enter a valid date in the "Loaned_on" field (i.e. 2001-10-29)'
        },
        isAfter: {
          args: [yesterday],
          msg: `You must enter a date after "${yesterday}" in the "Loaned on" field`
        }
      }
    },
    return_by: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg: 'The "Return by" field is required'
        },
        isDate: {
          msg: 'You must enter a valid date in the "Return by" field (i.e. 2001-10-29)'
        },
        isAfter: {
          args: [today],
          msg: 'You must enter a date after today\'s date in the "Return by" field'
        }
      }
    },
    returned_on: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg: 'The "Returned on" field is required'
        },
        isDate: {
          msg: 'You must enter a valid date in the "Returned on" field (i.e. 2001-10-29)'
        },
        isAfter: {
          args: [yesterday],
          msg: `You must enter a date after "${yesterday}" in the "Returned on" field`
        }
      }
    },
  }, {
    timestamps: false
  });
  Loan.associate = function(models) {
    // associations can be defined here
  };
  return Loan;
};
