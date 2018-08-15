'use strict';

/*
Basic structure generated through Sequelize CLI. Additions include validations, error messages,
removal of timestamps. Also made the library_id unique.
*/

module.exports = (sequelize, DataTypes) => {
  const Patron = sequelize.define('Patron', {
    id: {
          type: DataTypes.INTEGER,
          primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'The "First Name" field is required'
        }
      }
    },
    last_name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'The "Last Name" field is required'
        }
      }
    },
    address: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'The "Address" field is required'
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'The "Email" field is required'
        },
          isEmail: {
            msg: 'The "Email" field must be in email format (i.e. name@email.com)'
          }
      }
    },
    library_id: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'The "Library ID" field is required'
        }
      }
    },
    zip_code: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'The "Zip Code" field is required'
        },
        not: {
          args: [/[^0-9]/i],
          msg: 'The "Zip Code" field must not include letters (i.e. 90210)'
        }
      }
    }
  }, {
    timestamps: false,
    indexes: [ { unique: true, fields: [ 'library_id' ] } ]
  });
  Patron.associate = function(models) {
    // associations can be defined here
  };
  return Patron;
};
