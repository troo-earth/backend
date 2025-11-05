const {createProjectSeller, findSellerById, findSellerProjectById} = require("./sellerService");
const {getAllProjectsSeller} = require("../seller/sellerService");

async function createProjectSellerController(req, res, next) {
    try{
        const { id } = req.params;
        const { project } = req.body;
        if(!id || !project){
            return res.error("Missing Seller Id or Project", 400);
        }
        const newProject = await createProjectSeller(id, project);
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

        const allProjects = await getAllProjectsSeller(id);
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

        const project = await findSellerProjectById(id, projectId);
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

       const seller = await findSellerById(id);
       return res.success(`Seller with ${id} found successfully`, seller);
   } catch (error){
       next(error);
   }
}

module.exports = { createProjectSellerController, getAllProjectsSellerController, sellerProfileController, findProjectByIdSellerController }