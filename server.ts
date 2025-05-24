import fs from 'node:fs';
import recurly from 'recurly';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import 'dotenv/config';
import { getPlanId } from './helpers/recurlyHelpers';

const PORT = process.env.PORT || 8000;

// Hardcoded strings
const website = "https://powersportsengines.ca/mongoose-vip-club";
const oneTimeSubscribed = "Thank you! Subscription was created and one-time charge was completed!";
const subscribed = "Thank you! Subscription was created!";
const discountPage = `
==== COUPONS AVAILABLE ====
VISIT: https://powersportsengines.ca/discounts-vip-club
===========================
`;
// Express client
const app = express();

// Recurly client
const client = new recurly.Client(process.env.RECURLY_API_KEY as string);

app.use(express.static(path.join(__dirname, 'public')));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Subscription's route
app.post("/purchases", async (req, res) => {
  // Request object
  const {
    firstName,
    lastName,
    email,
    address1,
    city,
    state,
    postalCode,
    planCode,
    customAmount,
    rjsTokenId,
    country
  } = req.body;

  // Assign email as unique identifier
  const accountCode = `code-${email}`;

  // Purchase object
  let purchaseReq = {
    currency: 'CAD',
    account: {
      code: accountCode,
      firstName,
      lastName,
      email,
      billingInfo: {
        tokenId: rjsTokenId
      }
    },
    subscriptions: [
      { planCode: planCode },
    ],
    customer_notes: discountPage
  };

  
  try {
    if (planCode === 'mongoosevipclub-onetime') {
      // Fetch plan.id
      const planId = await getPlanId(client, planCode);
      
      // Create an update object
      const planUpdate = {
        auto_renew: false,
        currencies: [
          {
            currency: 'CAD',
            unitAmount: customAmount
          }
        ]
      };      
      
      const updatedPlan = await client.updatePlan(planId, planUpdate)
      const currentPlanCode = updatedPlan.code;
      console.log('Updated plan: ', currentPlanCode)

      // Update subscription object
      let newPurchaseReq = {
        currency: 'CAD',
        account: {
          code: accountCode,
          firstName,
          lastName,
          email,
          billingInfo: {
            tokenId: rjsTokenId
          }
        },
        subscriptions: [
          { planCode: currentPlanCode },
        ],
        customer_notes: discountPage
      };

      // Creates a new one time subscription with updated plan info
      let oneTimeSubscription = await client.createPurchase(newPurchaseReq);
      console.log('Created Charge Invoice: ', oneTimeSubscription.chargeInvoice);
      console.log('Created Credit Invoices: ', oneTimeSubscription.creditInvoices);
      
      res.status(200).json({ success: true, message: oneTimeSubscribed, redirectUrl: website});
    } else {
      // Creates a new subscription
      let subscription = await client.createPurchase(purchaseReq);
      console.log('Created Charge Invoice: ', subscription.chargeInvoice);
      console.log('Created Credit Invoices: ', subscription.creditInvoices);

      res.status(200).json({ success: true, message: subscribed, redirectUrl: website});
    }
  } catch (err: any) {
    console.error("Error in /purchases:", err);

    if (err instanceof recurly.errors.ValidationError) {
      res.status(400).json({ error: err.params });
    } else {
      res.status(500).json({ error: 'Server error. Please try again.' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});