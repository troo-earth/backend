const {createProjectSellerService, findSellerByIdService, findSellerProjectByIdService} = require("./sellerService");
const {getAllProjectsSellerService} = require("../seller/sellerService");
const {withLogging} = require("../../utils/logger");

async function createProjectSellerController(req, res, next) {
    try{
        const { id } = req.params;
        const { project } = req.body;
        if(!id || !project){
            return res.error("Missing Seller Id or Project", 400);
        }
        const newProject = await createProjectSellerService(id, project);
        return res.success(`New project for user with ${id} created successfully`, newProject);
    } catch (error){
        next(error);
    }
}

async function getAllProjectsSellerController(req, res, next) {
    try{
        const { id } = req.params;
        if(!id){
            return res.error("Missing seller Id", 400);
        }

        const allProjects = await getAllProjectsSellerService(id);
        return res.success(`Projects of user with ${id} retrieved successfully`, allProjects);
    } catch (error){
        next(error);
    }
}

async function findProjectByIdSellerController(req,res, next){
    try{
        const { id, projectId } = req.params;

        if(!id || !projectId){
            return res.error("Missing Seller Id or Project Id", 400);
        }

        const project = await findSellerProjectByIdService(id, projectId);
        return res.success(`Project with id ${projectId} for seller with id ${id} found successfully `, project);
    } catch (error){
        next(error);
    }
}

async function sellerProfileController(req, res, next){
   try{
       const { id } = req.params;
       if(!id){
           return res.error("Missing Seller Id", 400);
       }

       const seller = await findSellerByIdService(id);
       return res.success(`Seller with ${id} found successfully`, seller);
   } catch (error){
       next(error);
   }
}

module.exports = {
    createProjectSellerController: withLogging(createProjectSellerController, 'createProjectSellerController'),
    getAllProjectsSellerController: withLogging(getAllProjectsSellerController, 'getAllProjectsSellerController'),
    sellerProfileController: withLogging(sellerProfileController, 'sellerProfileController'),
    findProjectByIdSellerController: withLogging(findProjectByIdSellerController, 'findProjectByIdSellerController'),
};
