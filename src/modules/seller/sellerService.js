const Seller = require('./sellerModel');
const {createProject} = require("../project/projectService");

async function createProjectForSeller(project, seller_id){

    if(!seller_id){
        throw new Error('Seller id is required');
    }

    const seller = await Seller.findOne(seller_id);
    if(!seller){
        throw new Error('Seller does not exist ');
    }

    return await createProject(project, seller_id);
}