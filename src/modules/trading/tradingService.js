const Listing = require('../listing/listingModel.js');
const Holdings = require('../holdings/holdingsModel.js');
const Transactions = require('./transactionsModel.js');
const RetirementCertificate = require('./retirementCertificateModel');
const IcrProject = require('../marketplace/models/icrProjects.js');
const sequelize = require('../../config/database.js');
const { withLogging } = require('../../utils/logger.js');

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

        // Step 2.5: Reduce seller holdings if this is an org-owned listing
        if (listing.seller_id) {
            const sellerHoldings = await Holdings.findOne({
                where: { org_id: listing.seller_id, project_id: listing.project_id },
                transaction: t,
                lock: t.LOCK.UPDATE
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
            await sellerHoldings.save({ transaction: t });
        }

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

        return {};

    } catch (error) {
        if (t) await t.rollback();
        throw new Error(error.message);
    }
};

const sellCreditsService = async (org_id, project_id, amount, price) => {
    const t = await sequelize.transaction();
    try {
        // 1. Get seller holdings for this project
        const holding = await Holdings.findOne({
            where: { org_id, project_id },
            transaction: t,
            lock: t.LOCK.UPDATE
        });
        if (!holding) throw new Error('No holdings found for this project');
        if (parseFloat(holding.credit_balance) < amount)
            throw new Error('Insufficient credits to sell');

        // Fetch project details from icrProject
        const project = await IcrProject.findByPk(project_id, { transaction: t });
        if (!project) throw new Error('Project not found');

        // Extract year from startDate for project_start_year
        const startDate = project.startDate; // Assuming this is a Date or ISO string
        const projectStartYear = new Date(startDate).getFullYear();

        // Extract SDG numbers from otherBenefits
        const sdg_numbers = project.otherBenefits.map(b => {
            const match = b.title.match(/SDG (\d+):/);
            return match ? parseInt(match[1]) : null;
        }).filter(n => n !== null);

        // Check if similar listing already exists
        const existingListing = await Listing.findOne({
            where: {
                seller_id: org_id,
                project_id,
                price_per_credit: price,
                status: 'open'
            },
            transaction: t
        });
        if (existingListing) {
            // Increase available credits instead of creating new listing
            existingListing.credits_available =
                (parseFloat(existingListing.credits_available) + amount).toFixed(2);
            await existingListing.save({ transaction: t });
            holding.locked_for_sale = (parseFloat(holding.locked_for_sale || 0) + amount).toFixed(2);
            await holding.save({ transaction: t });
            await t.commit();
            return {
                success: true,
                message: 'Listing updated (merged with existing open listing)',
                listing_id: existingListing.listing_id,
                total_available: existingListing.credits_available
            };
        }

        // 2. Move credits to locked_for_sale
        holding.locked_for_sale = (parseFloat(holding.locked_for_sale || 0) + amount).toFixed(2);
        await holding.save({ transaction: t });

        // 3. Create listing with required fields from project
        const listing = await Listing.create({
            seller_id: org_id,
            project_id,
            credits_available: amount,
            price_per_credit: price,
            status: 'open',
            project_name: project.fullName || project.shortDescription, // Use appropriate field if fullName is the name
            project_start_year: projectStartYear,
            registry: project.registry,
            category: project.sector.title, // Assuming category is sector.title
            location_city: project.city,
            location_state: project.state,
            location_country: project.countryCode, // Map to full name if needed, e.g., 'US' to 'United States'
            thumbnail_url: project.thumbnail,
            methodology: project.methodology.title || project.methodology.id,
            vintage_year: projectStartYear,
            sdg_numbers: sdg_numbers // Now as array; assume model field is ARRAY type
        }, { transaction: t });

        await t.commit();

        return {
            success: true,
            message: 'Listing created for sale',
            listing_id: listing.listing_id,
            locked_for_sale: holding.locked_for_sale
        };
    } catch (error) {
        if (t) await t.rollback();
        throw error; // Rethrow original error without wrapping
    }
};

const transferCreditsService = async (
    from_org_id,
    to_org_id,
    project_id,
    amount
) => {
    const t = await sequelize.transaction();

    try {
        if (from_org_id === to_org_id)
            throw new Error("Cannot transfer to the same organization");

        // 1. Sender holdings
        const sender = await Holdings.findOne({
            where: { org_id: from_org_id, project_id },
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!sender) throw new Error("Sender has no holdings");

        const available =
            parseFloat(sender.credit_balance) -
            parseFloat(sender.locked_for_sale);

        if (available < amount)
            throw new Error("Insufficient available credits to transfer");

        // 2. Deduct from sender
        sender.credit_balance =
            (parseFloat(sender.credit_balance) - amount).toFixed(2);
        await sender.save({ transaction: t });

        // 3. Receiver holdings
        let receiver = await Holdings.findOne({
            where: { org_id: to_org_id, project_id },
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!receiver) {
            receiver = await Holdings.create({
                org_id: to_org_id,
                project_id,
                credit_balance: amount
            }, { transaction: t });
        } else {
            receiver.credit_balance =
                (parseFloat(receiver.credit_balance) + amount).toFixed(2);
            await receiver.save({ transaction: t });
        }

        await t.commit();

        return {
            success: true,
            message: "Transfer successful",
            transferred: amount
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
