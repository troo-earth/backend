const { createProject } = require('./projectService');

async function createProjectController(req, res, next) {
    try {
        if (!req.body) {
            return res.error('Missing request body', 400);
        }
        const { project, seller_id } = req.body;

        if (!project || !seller_id) {
            return res.error('Missing request fields', 400);
        }

        const newProject = await createProject(project, seller_id);
        return res.success('Project created successfully', newProject);

    } catch (error) {
        next(error);
    }
}

module.exports = { createProjectController };