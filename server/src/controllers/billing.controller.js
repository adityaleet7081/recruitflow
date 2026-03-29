const pool = require('../config/db');
const { stripe, createCheckoutSession } = require('../services/stripe.service');

const createCheckout = async (req, res, next) => {
    try {
        const { companyId, role, email } = req.user;

        if (role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can manage billing' });
        }

        const companyResult = await pool.query(
            'SELECT * FROM companies WHERE id = $1',
            [companyId]
        );
        const company = companyResult.rows[0];
        if (!company) return res.status(404).json({ error: 'Company not found' });

        if (company.plan === 'pro') {
            return res.status(400).json({ error: 'Already on Pro plan' });
        }

        const session = await createCheckoutSession(companyId, company.name, email);

        res.json({ url: session.url });
    } catch (err) {
        next(err);
    }
};

const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature failed:', err.message);
        return res.status(400).json({ error: 'Webhook error' });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const companyId = session.metadata.companyId;

        await pool.query(
            `UPDATE companies SET plan = 'pro',
       stripe_customer_id = $1,
       stripe_subscription_id = $2
       WHERE id = $3`,
            [session.customer, session.subscription, companyId]
        );
        console.log(`Company ${companyId} upgraded to Pro`);
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        await pool.query(
            `UPDATE companies SET plan = 'free' WHERE stripe_subscription_id = $1`,
            [subscription.id]
        );
    }

    res.json({ received: true });
};

const getPlans = async (req, res, next) => {
    try {
        const companyResult = await pool.query(
            'SELECT plan FROM companies WHERE id = $1',
            [req.user.companyId]
        );
        const company = companyResult.rows[0];

        res.json({
            currentPlan: company?.plan || 'free',
            plans: [
                {
                    id: 'free',
                    name: 'Free',
                    price: 0,
                    features: [
                        '3 job postings',
                        'Unlimited candidates',
                        'Kanban pipeline',
                        'Basic analytics',
                    ],
                },
                {
                    id: 'pro',
                    name: 'Pro',
                    price: 29,
                    features: [
                        'Unlimited job postings',
                        'AI resume scoring',
                        'Email automation',
                        'Priority support',
                        'Advanced analytics',
                    ],
                },
            ],
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { createCheckout, handleWebhook, getPlans };