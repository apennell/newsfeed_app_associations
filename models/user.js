"use strict";

var bcrypt = require("bcrypt");
var salt = bcrypt.genSaltSync(10);

// 
module.exports = function (sequelize, DataTypes){
  // sequelize.define acts as a constructor
  var User = sequelize.define('User', {
    email: { 
      type: DataTypes.STRING,
      // can only be one in the db
      unique: true,
      validate: {
        // min length 6, max length 30
        len: [6, 30],
      }
    },
    passwordDigest: {
      type:DataTypes.STRING,
      validate: {
        // must contain password/can't be empty
        notEmpty: true
      }
    }
  },

  {
    instanceMethods: {
      // call these instance methods in app.js with:
      // var user = db.User.find(1);
      // user.checkPassword("passwordblah");
      checkPassword: function(password) {
        return bcrypt.compareSync(password, this.passwordDigest);
      }
    },
    classMethods: {
      // You call these like this:
      // db.User.encryptPassword
      encryptPassword: function(password) {
        var hash = bcrypt.hashSync(password, salt);
        return hash;
      },
      createSecure: function(email, password) {
        if(password.length < 6) {
          throw new Error("Password too short");
        }
        return this.create({
          email: email,
          passwordDigest: this.encryptPassword(password)
        });

      },
      authenticate: function(email, password) {
        // find a user in the DB
        return this.find({
          where: {
            email: email
          }
        }) 
        .then(function(user){
          if (user === null){
            throw new Error("Username does not exist");
          }
          else if (user.checkPassword(password, user.passwordDigest)){
            return user;
          }

        });
      }

    } // close classMethods
  }); // close define user
  return User;
}; // close User function