var DataTypes = require("sequelize").DataTypes;
var _CarbonCredits = require("./CarbonCredits");
var _OrgUsers = require("./OrgUsers");
var _Orgs = require("./Orgs");
var _Projects = require("./Projects");
var _RetirementCertificates = require("./RetirementCertificates");
var _Sellers = require("./Sellers");
var _SequelizeMeta = require("./SequelizeMeta");
var _Txns = require("./Txns");
var _Users = require("./Users");
var _WalletTxns = require("./WalletTxns");
var _Wallets = require("./Wallets");

function initModels(sequelize) {
  var CarbonCredits = _CarbonCredits(sequelize, DataTypes);
  var OrgUsers = _OrgUsers(sequelize, DataTypes);
  var Orgs = _Orgs(sequelize, DataTypes);
  var Projects = _Projects(sequelize, DataTypes);
  var RetirementCertificates = _RetirementCertificates(sequelize, DataTypes);
  var Sellers = _Sellers(sequelize, DataTypes);
  var SequelizeMeta = _SequelizeMeta(sequelize, DataTypes);
  var Txns = _Txns(sequelize, DataTypes);
  var Users = _Users(sequelize, DataTypes);
  var WalletTxns = _WalletTxns(sequelize, DataTypes);
  var Wallets = _Wallets(sequelize, DataTypes);


  return {
    CarbonCredits,
    OrgUsers,
    Orgs,
    Projects,
    RetirementCertificates,
    Sellers,
    SequelizeMeta,
    Txns,
    Users,
    WalletTxns,
    Wallets,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
