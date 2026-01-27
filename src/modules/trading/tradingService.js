const Listing = require('../listing/listingModel.js');
const Holdings = require('../holdings/holdingsModel.js');
const Transactions = require('../transactions/transactionsModel.js');
const RetirementCertificate = require('../reitrements/retirementCertificateModel.js');
const IcrProject = require('../marketplace/models/icrProjects.js');
const Org = require('../org/orgModel.js');
const sequelize = require('../../config/database.js');
const { withLogging } = require('../../utils/logger.js');
const { createListingEvent } = require('../listingEvents/listingEventsService.js');

const buyCreditsService = async (
    listing_id,
    buyer_org_id,
    amount,
    { transaction }
) => {
    if (!transaction) {
        throw new Error('Transaction is required for buyCreditsService');
    }

    // Step 1: Find listing
    const listing = await Listing.findByPk(listing_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    if (!listing) throw new Error('Listing not found');
    if (listing.status !== 'open') throw new Error('Listing is not open for purchase');
    if (parseFloat(listing.credits_available) < amount) {
        throw new Error('Insufficient credits available in the listing');
    }

    // Step 2: Reduce listing supply
    listing.credits_available =
        (parseFloat(listing.credits_available) - amount).toFixed(2);

    if (parseFloat(listing.credits_available) === 0) {
        listing.status = 'closed';
    }

    await listing.save({ transaction });

    // Step 2.5: Reduce seller holdings (if org-owned listing)
    if (listing.seller_id) {
        const sellerHoldings = await Holdings.findOne({
            where: {
                org_id: listing.seller_id,
                project_id: listing.project_id,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!sellerHoldings) {
            throw new Error('Seller holdings not found');
        }

        if (parseFloat(sellerHoldings.locked_for_sale) < amount) {
            throw new Error('Seller does not have enough locked credits');
        }

        sellerHoldings.locked_for_sale =
            (parseFloat(sellerHoldings.locked_for_sale) - amount).toFixed(2);

        sellerHoldings.credit_balance =
            (parseFloat(sellerHoldings.credit_balance) - amount).toFixed(2);

        await sellerHoldings.save({ transaction });
    }

    // Step 3: Add credits to buyer holdings
    let buyerHoldings = await Holdings.findOne({
        where: {
            org_id: buyer_org_id,
            project_id: listing.project_id,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    if (!buyerHoldings) {
        buyerHoldings = await Holdings.create(
            {
                org_id: buyer_org_id,
                project_id: listing.project_id,
                credit_balance: amount,
            },
            { transaction }
        );
    } else {
        buyerHoldings.credit_balance =
            (parseFloat(buyerHoldings.credit_balance) + amount).toFixed(2);

        await buyerHoldings.save({ transaction });
    }

    // Step 4: Record domain transaction
    await Transactions.create(
        {
            type: 'buy',
            from_org_id: listing.seller_id,
            to_org_id: buyer_org_id,
            project_id: listing.project_id,
            amount,
            related_listing_id: listing.listing_id,
        },
        { transaction }
    );

    // Listing Event (PARTIALLY_FILLED or FILLED)
    const remainingCredits = parseFloat(listing.credits_available);

    const buyerOrg = await Org.findByPk(buyer_org_id, {
        attributes: ['org_code'],
        transaction,
    });

    await createListingEvent({
        listing_id: listing.listing_id,
        event_type: remainingCredits === 0 ? 'FILLED' : 'PARTIALLY_FILLED',
        actor_org_code: buyerOrg.org_code, // resolve this before calling service
        event_data: {
            bought_quantity: amount,
            remaining_quantity: remainingCredits,
            price_per_credit: listing.price_per_credit,
        },
        transaction,
    });

    // Emit CLOSED event if listing is now fully closed
    if (parseFloat(listing.credits_available) === 0) {
        await createListingEvent({
            listing_id: listing.listing_id,
            event_type: 'CLOSED',
            actor_org_code: null, // system action
            event_data: {
                reason: 'fully_filled',
            },
            transaction,
        });
    }
    return {};
};

const sellCreditsService = async (org_id, project_id, amount, price) => {
    const t = await sequelize.transaction();

    try {
        const org = await Org.findByPk(org_id, {
            attributes: ['org_code'],
            transaction: t
        });
        if (!org) throw new Error('Org not found');
        console.log('Organization found:', org.org_code);
        const holding = await Holdings.findOne({
            where: { org_id, project_id },
            transaction: t,
            lock: t.LOCK.UPDATE
        });
        if (!holding) throw new Error('No holdings found for this project');

        if (parseFloat(holding.credit_balance) < amount)
            throw new Error('Insufficient credits to sell');

        const project = await IcrProject.findByPk(project_id, { transaction: t });
        if (!project) throw new Error('Project not found');

        const projectStartYear = new Date(project.startDate).getFullYear();

        const sdg_numbers = project.otherBenefits
            .map(b => {
                const match = b.title.match(/SDG (\d+):/);
                return match ? Number(match[1]) : null;
            })
            .filter(Boolean);

        const existingListing = await Listing.findOne({
            where: {
                seller_id: org_id,
                project_id,
                price_per_credit: price,
                status: 'open'
            },
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        // 🔁 MERGE
        if (existingListing) {
            existingListing.credits_available =
                (parseFloat(existingListing.credits_available) + amount).toFixed(2);

            await existingListing.save({ transaction: t });

            holding.locked_for_sale =
                (parseFloat(holding.locked_for_sale) + amount).toFixed(2);

            await holding.save({ transaction: t });

            await createListingEvent({
                listing_id: existingListing.listing_id,
                event_type: 'UPDATED',
                actor_org_code: org.org_code,
                event_data: {
                    credits_added: amount,
                    new_credits_available: existingListing.credits_available,
                    price_per_credit: existingListing.price_per_credit
                },
                transaction: t
            });

            await t.commit();
            return {
                listing_id: existingListing.listing_id,
                credits_available: existingListing.credits_available
            };
        }

        // 🆕 CREATE
        holding.locked_for_sale =
            (parseFloat(holding.locked_for_sale) + amount).toFixed(2);

        await holding.save({ transaction: t });

        const listing = await Listing.create({
            seller_id: org_id,
            project_id,
            credits_available: amount,
            price_per_credit: price,
            status: 'open',
            project_name: project.fullName || project.shortDescription,
            project_start_year: projectStartYear,
            registry: project.registry,
            category: project.sector.title,
            location_city: project.city,
            location_state: project.state,
            location_country: project.countryCode,
            thumbnail_url: project.thumbnail,
            methodology: project.methodology.title || project.methodology.id,
            vintage_year: projectStartYear,
            sdg_numbers
        }, { transaction: t });

        await createListingEvent({
            listing_id: listing.listing_id,
            event_type: 'CREATED',
            actor_org_code: org.org_code,
            event_data: {
                credits_available: listing.credits_available,
                price_per_credit: listing.price_per_credit
            },
            transaction: t
        });

        await t.commit();
        return {
            listing_id: listing.listing_id,
            credits_available: listing.credits_available
        };

    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const transferCreditsService = async (
    from_org_id,
    to_org_code,
    project_id,
    amount
) => {
    const t = await sequelize.transaction();

    try {
        // 1️⃣ Resolve destination org by org_code
        const toOrg = await Org.findOne({
            where: { org_code: to_org_code },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        if (!toOrg) {
            throw new Error('Target organization not found');
        }

        const to_org_id = toOrg.org_id;

        if (from_org_id === to_org_id) {
            throw new Error('Cannot transfer to the same organization');
        }

        // 2️⃣ Sender holdings
        const sender = await Holdings.findOne({
            where: { org_id: from_org_id, project_id },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        if (!sender) {
            throw new Error('No Holdings found for this project');
        }

        const available =
            parseFloat(sender.credit_balance) -
            parseFloat(sender.locked_for_sale);

        if (available < amount) {
            throw new Error('Insufficient available credits to transfer');
        }

        // 3️⃣ Deduct from sender
        sender.credit_balance =
            (parseFloat(sender.credit_balance) - amount).toFixed(2);
        await sender.save({ transaction: t });

        // 4️⃣ Receiver holdings
        let receiver = await Holdings.findOne({
            where: { org_id: to_org_id, project_id },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        if (!receiver) {
            receiver = await Holdings.create(
                {
                    org_id: to_org_id,
                    project_id,
                    credit_balance: amount,
                },
                { transaction: t }
            );
        } else {
            receiver.credit_balance =
                (parseFloat(receiver.credit_balance) + amount).toFixed(2);
            await receiver.save({ transaction: t });
        }

        // 5️⃣ Transaction record
        await Transactions.create(
            {
                type: 'transfer',
                from_org_id,
                to_org_id,
                project_id,
                amount,
            },
            { transaction: t }
        );

        await t.commit();

        return {
            transferred: amount,
            to_org_code,
        };

    } catch (err) {
        await t.rollback();
        throw err;
    }
};

const retireCreditsService = async (
    org_id,
    project_id,
    amount,
    purpose,
    beneficiary
) => {
    const t = await sequelize.transaction();

    try {
        // 1. Fetch holdings (lock row)
        const holding = await Holdings.findOne({
            where: { org_id, project_id },
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!holding) throw new Error('No holdings found');

        const available =
            parseFloat(holding.credit_balance) -
            parseFloat(holding.locked_for_sale);

        if (available < amount)
            throw new Error('Insufficient available credits to retire');

        // 2. Burn credits
        holding.credit_balance =
            (parseFloat(holding.credit_balance) - amount).toFixed(2);

        await holding.save({ transaction: t });

        // 3. Create transaction (credit ledger)
        const tx = await Transactions.create({
            type: 'retire',
            from_org_id: org_id,
            to_org_id: null,
            project_id,
            amount
        }, { transaction: t });

        // 4. Create retirement certificate
        const certificate = await RetirementCertificate.create({
            org_id,
            project_id,
            amount,
            retired_at: new Date(),
            purpose,
            beneficiary,
            transaction_id: tx.tx_id,
            certificate_number: `CERT-${Date.now()}`
        }, { transaction: t });

        await t.commit();

        return {
            message: 'Credits retired successfully',
            certificate_id: certificate.certificate_id,
            certificate_number: certificate.certificate_number,
            retired_amount: amount
        };

    } catch (error) {
        await t.rollback();
        throw error;
    }
};

module.exports = {
    buyCreditsService: withLogging(buyCreditsService, 'buyCreditsService'),
    sellCreditsService: withLogging(sellCreditsService, 'sellCreditsService'),
    transferCreditsService: withLogging(transferCreditsService, 'transferCreditsService'),
    retireCreditsService: withLogging(retireCreditsService, 'retireCreditsService')
};
