'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orgs', 'country_code', {
      type: Sequelize.STRING(2),
      allowNull: false,
      defaultValue: 'XX',
    });

    await queryInterface.addColumn('Orgs', 'registration_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Orgs', 'logo_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('Orgs', 'incorporation_doc_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Orgs', 'country_code');
    await queryInterface.removeColumn('Orgs', 'registration_id');
    await queryInterface.removeColumn('Orgs', 'logo_url');
    await queryInterface.removeColumn('Orgs', 'incorporation_doc_url');
  },
};
