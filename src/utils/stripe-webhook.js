// utils/stripeWebhookHandler.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sequelize = require('../config/database');

const { buyCreditsService } = require('../modules/trading/tradingService');
const Payments = require('../modules/payments/paymentsModel');

// ✅ Define expected domain errors ONCE
const EXPECTED_DOMAIN_ERRORS = new Set([
    'Listing not found',
    'Listing is not open for purchase',
    'Insufficient credits available in the listing',
    'Seller holdings not found',
    'Seller does not have enough locked credits',
]);

async function handlePaymentIntentSucceeded(paymentIntent, event) {
    if (!event || !event.id) {
        console.error('Missing Stripe event object, aborting');
        return;
    }

    const { listing_id, buyer_org_id, credits_amount } =
        paymentIntent.metadata || {};

    if (!listing_id || !buyer_org_id || !credits_amount) {
        console.warn('Missing metadata, skipping processing');
        return;
    }

    const amount = parseFloat(credits_amount);
    if (isNaN(amount) || amount <= 0) {
        console.warn('Invalid credits_amount, skipping processing');
        return;
    }

    await sequelize.transaction(async (t) => {
        const existingPayment = await Payments.findOne({
            where: { stripe_payment_intent_id: paymentIntent.id },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        if (existingPayment) {
            console.warn('Payment already processed:', paymentIntent.id);
            return;
        }

        await Payments.create(
            {
                stripe_payment_intent_id: paymentIntent.id,
                stripe_event_id: event.id,
                buyer_org_id,
                listing_id,
                credits_amount: amount,
                amount_paid_cents: paymentIntent.amount_received,
                currency: paymentIntent.currency,
                status: paymentIntent.status,
                raw_payment_intent: paymentIntent,
            },
            { transaction: t }
        );

        await buyCreditsService(
            listing_id,
            buyer_org_id,
            amount,
            { transaction: t }
        );
    });

    console.log(
        'Payment + credit transfer committed:',
        paymentIntent.id
    );
}

function buildStripeWebhookExpressHandler() {
    return async function stripeWebhookExpressHandler(req, res) {
        const sig = req.headers['stripe-signature'];
        const rawBody = req.body;

        let event;

        try {
            event = stripe.webhooks.constructEvent(
                rawBody,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error(
                'Stripe webhook signature verification failed:',
                err.message
            );
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        console.log('Stripe event received:', event.type);

        try {
            if (event.type === 'payment_intent.succeeded') {
                await handlePaymentIntentSucceeded(
                    event.data.object,
                    event
                );
            }

            return res.status(200).send('ok');
        } catch (err) {
            // ✅ Clean domain failures
            if (EXPECTED_DOMAIN_ERRORS.has(err.message)) {
                console.warn('[PAYMENT_DOMAIN_FAILURE]', {
                    payment_intent_id: event?.data?.object?.id,
                    reason: err.message,
                });
            } else {
                // 🚨 Unexpected system failure
                console.error('[WEBHOOK_SYSTEM_ERROR]', err);
            }
            return res.status(200).send('ok');
        }
    };
}

module.exports = {
    buildStripeWebhookExpressHandler,
};
