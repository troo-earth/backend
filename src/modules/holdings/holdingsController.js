const { viewHoldingService } = require('./holdingsService');
const { validate: uuidValidate } = require('uuid');
const { withLogging } = require('../../utils/logger');

const viewHoldingController = async (req, res) => {
    try {
        const { org_id } = req.params;

        // Validate org_id as UUID
        if (!org_id || !uuidValidate(org_id)) {
            return res.status(400).json({ success: false, message: 'Invalid org ID format (must be a valid UUID)' });
        }

        const holdings = await viewHoldingService(org_id);
        return res.status(200).json({ success: true, message: 'Holdings fetched successfully', data: holdings });
    } catch (error) {
        const statusMap = {
            'Failed to fetch holdings': 500,
            // Add more as needed
        };

        const status = statusMap[error.message] || 500;
        if (status !== 500) {
            return res.status(status).json({ success: false, message: error.message });
        }
        console.error('Error fetching holdings:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    viewHoldingController: withLogging(viewHoldingController, 'viewHoldingController'),
};