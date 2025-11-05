const Seller = require('./sellerModel');
const {where} = require("sequelize");
const {createProject, getAllProjectsBySeller, findProjectBySellerId} = require("../project/projectService");

//find the seller by id
async function findSellerById(seller_id){

    if(!seller_id){
        throw new Error('Seller id is required');
    }
    const seller = await Seller.findOne({ where: { seller_id } });
    if(!seller){
        throw new Error(`Seller with id ${seller_id} does not exist `);
    }
    return seller;
}

async function findSellerProjectById(id, projectId){
    if(!projectId || !id){
        throw new Error('Project id and seller id is required');
    }

    return await findProjectBySellerId(id, projectId);
}

//create a new project
async function createProjectSeller(seller_id, project){
    if(!project){
        throw new Error('Project is required');
    }
    if(!seller_id){
        throw new Error('Seller id is required');
    }

    await findSellerById(seller_id);
    return await createProject(project, seller_id);
}


//get all projects
async function getAllProjectsSeller(seller_id){

    if(!seller_id){
        throw new Error('Seller id is required');
    }

    await findSellerById(seller_id);
    return await getAllProjectsBySeller(seller_id);
}



module.exports = { findSellerById, createProjectSeller, getAllProjectsSeller, findSellerProjectById };