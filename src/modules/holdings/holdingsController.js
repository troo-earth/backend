const { viewHoldingService } = require('./holdingsService');
const { validate: uuidValidate } = require('uuid');
const { withLogging } = require('../../utils/logger');

const viewHoldingController = async (req, res, next) => {
    try {
        const { org_id } = req.params;

        // Validate org_id as UUID
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

module.exports = {
    viewHoldingController: withLogging(viewHoldingController, 'viewHoldingController'),
};