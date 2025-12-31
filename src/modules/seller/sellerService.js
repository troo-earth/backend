const Seller = require('./sellerModel');
const {withLogging} = require("../../utils/logger");

//find the seller by id
async function findSellerByIdService(seller_id){

    if(!seller_id){
        throw new Error('Seller id is required');
    }
    const seller = await Seller.findOne({ where: { seller_id } });
    if(!seller){
        throw new Error(`Seller with id ${seller_id} does not exist `);
    }
    return seller;
}

async function findSellerProjectByIdService(id, projectId){
    if(!projectId || !id){
        throw new Error('Project id and seller id is required');
    }

    return await findProjectBySellerIdService(id, projectId);
}

//create a new project
async function createProjectSellerService(seller_id, project){
    if(!project){
        throw new Error('Project is required');
    }
    if(!seller_id){
        throw new Error('Seller id is required');
    }

    await findSellerByIdService(seller_id);
    return await createProjectService(project, seller_id);
}


//get all projects
async function getAllProjectsSellerService(seller_id){

    if(!seller_id){
        throw new Error('Seller id is required');
    }

    await findSellerByIdService(seller_id);
    return await getAllProjectsBySellerService(seller_id);
}



module.exports = {
    findSellerByIdService: withLogging(findSellerByIdService, 'findSellerByIdService'),
    createProjectSellerService: withLogging(createProjectSellerService, 'createProjectSellerService'),
    getAllProjectsSellerService: withLogging(getAllProjectsSellerService, 'getAllProjectsSellerService'),
    findSellerProjectByIdService: withLogging(findSellerProjectByIdService, 'findSellerProjectByIdService'),
};
