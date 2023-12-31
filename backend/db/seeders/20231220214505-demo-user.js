'use strict';

const { User } = require('../models')
const bcrypt = require('bcryptjs')

let options = {}

if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

options.tableName = 'Users';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await User.bulkCreate([
      {
        firstName:'Stryker',
        lastName:'Huber',
        email: 'demo@user.io',
        username: 'user1',
        hashedPassword: bcrypt.hashSync('p')
      },
      {
        firstName:'Dan',
        lastName:'Reynolds',
        email: 'user1@user.io',
        username: 'FakeUser1',
        hashedPassword: bcrypt.hashSync('password2')
      },
      {
        firstName:'Lydia',
        lastName:'Ge',
        email: 'user2@user.io',
        username: 'FakeUser2',
        hashedPassword: bcrypt.hashSync('password3')
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johnDoe',
        email: 'johnDoe@example.com',
        hashedPassword: bcrypt.hashSync('password4')
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        username: 'janeDoe',
        email: 'janeDoe@example.com',
        hashedPassword: bcrypt.hashSync('password5')
      },
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        username: 'aliceJohnson',
        email: 'aliceJohnson@example.com',
        hashedPassword: bcrypt.hashSync('password6')
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        username: 'bobJohnson',
        email: 'bobJohnson@example.com',
        hashedPassword: bcrypt.hashSync('password7')
      },
      {
        firstName: 'Charlie',
        lastName: 'Brown',
        username: 'charlieBrown',
        email: 'charlieBrown@example.com',
        hashedPassword: bcrypt.hashSync('password8')
      },
      {
        firstName: 'David',
        lastName: 'Smith',
        username: 'davidSmith',
        email: 'davidSmith@example.com',
        hashedPassword: bcrypt.hashSync('password9')
      },
      {
        firstName: 'Emily',
        lastName: 'Davis',
        username: 'emilyDavis',
        email: 'emilyDavis@example.com',
        hashedPassword: bcrypt.hashSync('password10')
      },
      {
        firstName: 'Frank',
        lastName: 'Miller',
        username: 'frankMiller',
        email: 'frankMiller@example.com',
        hashedPassword: bcrypt.hashSync('password11')
      },
      {
        firstName: 'Grace',
        lastName: 'Wilson',
        username: 'graceWilson',
        email: 'graceWilson@example.com',
        hashedPassword: bcrypt.hashSync('password12')
      },
      {
        firstName: 'Harry',
        lastName: 'Moore',
        username: 'harryMoore',
        email: 'harryMoore@example.com',
        hashedPassword: bcrypt.hashSync('password13')
      }
    ], { validate: true });

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, null, {});
  }
};
