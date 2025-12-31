const Listing = require('../listing/listingModel.js');
const Holdings = require('../holdings/holdingsModel.js');
const sequelize = require('../../config/database');
const { withLogging } = require('../../utils/logger');

const buyCreditsService = async (listing_id, buyer_org_id, amount) => {
    const t = await sequelize.transaction();
    try {
        // Step 1: Find listing
        const listing = await Listing.findByPk(listing_id, { transaction: t });

        if (!listing) throw new Error('Listing not found');
        if (listing.status !== 'open') throw new Error('Listing is not open for purchase');
        if (parseFloat(listing.credits_available) < amount)
            throw new Error('Insufficient credits available in the listing');

        // Step 2: Reduce listing supply
        listing.credits_available = (parseFloat(listing.credits_available) - amount).toFixed(2);
        if (listing.credits_available == 0) listing.status = 'closed';
        await listing.save({ transaction: t });

        // Step 3: Add credits to buyer holdings
        let buyerHoldings = await Holdings.findOne({
            where: { org_id: buyer_org_id, project_id: listing.project_id },
            transaction: t
        });

        if (!buyerHoldings) {
            // If buyer has no entry for this project, create a new one
            buyerHoldings = await Holdings.create({
                org_id: buyer_org_id,
                project_id: listing.project_id,
                credit_balance: amount
            }, { transaction: t });
        } else {
            buyerHoldings.credit_balance = (parseFloat(buyerHoldings.credit_balance) + amount).toFixed(2);
            await buyerHoldings.save({ transaction: t });
        }

        await t.commit();

        return {
            success: true,
            message: 'Purchase successful'
        };

    } catch (error) {
        if (t) await t.rollback();
        throw new Error(`Failed to buy credits: ${error.message}`);
    }
};

module.exports = {
    buyCreditsService: withLogging(buyCreditsService, 'buyCreditsService'),
};
