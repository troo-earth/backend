const { createProject, getAllProjects, findProjectById} = require('./projectService');

async function getAllProjectsController(req, res, next) {
    try {
        const projects = await getAllProjects();
        return res.success('All Projects retrieved successfully', projects);

    } catch (error) {
        next(error);
    }
}

async function findProjectByIdController(req, res, next) {
    try {
        const { id } = req.params;

        if(!id){
            res.error('Project Id is missing', 400);
        }
        const project = await findProjectById(id);
        return res.success('Project retrieved successfully', project);

    } catch (error) {
        next(error);
    }
}



module.exports = { getAllProjectsController, findProjectByIdController };