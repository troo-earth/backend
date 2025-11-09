const Project = require('./projectModel');
const {withLogging} = require("../../utils/logger");

//find project by its id
async function findProjectByIdService(project_id){

    if(!project_id){
        throw new Error('Project id is required');
    }
    const project = await Project.findOne({ where: { project_id } });
    if(!project){
        throw new Error(`Project with id ${project_id} does not exist `);
    }
    return project;
}


//find project by its seller id
async function findProjectBySellerIdService(seller_id, project_id){

    if(!project_id){
        throw new Error('Project id is required');
    }
    const project = await Project.findOne({ where: { project_id , seller_id } });
    if(!project){
        throw new Error(`Project with id ${project_id} for seller with id ${seller_id} does not exist `);
    }
    return project;
}


//creates a new project
async function createProjectService(project, seller_id){
    const { project_name, description,  status } = project;

    if(!project_name || !description || !status){
        throw new Error('Project details are incomplete');
    }

    if(!seller_id){
        throw new Error('Seller id is required');
    }

    const duplicateProject = await Project.findOne({
        where: {
            project_name: project_name,
            seller_id: seller_id
        }
    });

    if (duplicateProject) {
        throw new Error(`A project with this name already exists for seller with id ${seller_id}`);
    }

    return await Project.create({project_name, description, status, seller_id});
}


//get all projects
async function getAllProjectsService(){
    return await Project.findAll();
}


//gets all project by seller
async function getAllProjectsBySellerService(seller_id){
    if(!seller_id){
        throw new Error('Seller id is required');
    }
    return await Project.findAll({ where: { seller_id } });
}

module.exports = {
    createProjectService: withLogging(createProjectService, 'createProjectService'),
    getAllProjectsBySellerService: withLogging(getAllProjectsBySellerService, 'getAllProjectsBySellerService'),
    findProjectBySellerIdService: withLogging(findProjectBySellerIdService, 'findProjectBySellerIdService'),
    findProjectByIdService: withLogging(findProjectByIdService, 'findProjectByIdService'),
    getAllProjectsService: withLogging(getAllProjectsService, 'getAllProjectsService'),
};
