'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  },

  down: async (queryInterface, Sequelize) => {
    // Optionally, add back table structure in the down method if needed.
  }
};
