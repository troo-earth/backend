const { viewHoldingService, getProjectByHoldingIdService } = require('./holdingsService');
const { validate: uuidValidate } = require('uuid');
const { withLogging } = require('../../utils/logger');

const viewHoldingController = async (req, res, next) => {
    try {
        const org_id  = req.session.user.org_id
        
        if (!org_id || !uuidValidate(org_id)) {
            return res.error(
                'Invalid org ID format (must be a valid UUID)',
                400
            );
        }

        const result = await viewHoldingService(org_id);

        if (result.error) {
            return res.error(result.error, result.statusCode);
        }

        return res.success(
            'Holdings fetched successfully',
            result.data
        );

    } catch (error) {
        console.error('Error fetching holdings:', error);
        next(error);
    }
};

const getProjectByHoldingIdController = async (req, res) => {
    try {
        const { holding_id } = req.body;
        if (!holding_id || !uuidValidate(holding_id)) {
            return res.error(
                'Invalid Holding ID format (must be a valid UUID)',
                400
            );
        }

        if (!holding_id) {
            return res.error('holding_id is required', 400);
        }

        const result = await getProjectByHoldingIdService(
            holding_id,
            req.session.user.org_id
        );

        if (result.error) {
            return res.error(result.error, result.statusCode);
        }

        return res.success('Project fetched successfully', result.data);
    } catch (error) {
        return res.error(error.message || 'Internal server error', 500);
    }
};

module.exports = {
    viewHoldingController: withLogging(viewHoldingController, 'viewHoldingController'),
    getProjectByHoldingIdController: withLogging(getProjectByHoldingIdController, 'getProjectByHoldingIdController'),
};