const { getAllProjectsService, findProjectByIdService} = require('./projectService');
const {withLogging} = require("../../utils/logger");

async function getAllProjectsController(req, res, next) {
    try {
        const projects = await getAllProjectsService();
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
        const project = await findProjectByIdService(id);
        return res.success('Project retrieved successfully', project);

    } catch (error) {
        next(error);
    }
}



module.exports = {
    getAllProjectsController: withLogging(getAllProjectsController, 'getAllProjectsController'),
    findProjectByIdController: withLogging(findProjectByIdController, 'findProjectByIdController'),
};
