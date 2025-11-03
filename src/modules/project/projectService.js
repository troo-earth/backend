
const Project = require('./projectModel');
const {findSellerById} = require("../seller/sellerService");

async function createProject(project, seller_id){
    const { project_name, description,  status } = project;

    if(!project_name || !description || !status){
        throw new Error('Project details are incomplete');
    }

    if(!seller_id){
        throw new Error('Seller id is required');
    }

    await findSellerById(seller_id);

    return await Project.create({project_name, description, status, seller_id});
}

module.exports = { createProject };