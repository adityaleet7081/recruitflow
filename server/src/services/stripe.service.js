const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (companyId, companyName, customerEmail) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: customerEmail,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'RecruitFlow Pro',
                        description: 'Unlimited jobs, AI resume scoring, email automation',
                    },
                    unit_amount: 2900,
                    recurring: { interval: 'month' },
                },
                quantity: 1,
            },
        ],
        metadata: { companyId },
        success_url: `${process.env.CLIENT_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/billing/cancel`,
    });

    return session;
};

module.exports = { stripe, createCheckoutSession };