import recurly from 'recurly';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import 'dotenv/config';
import { getPlanId, getRecaptcha, updatePlan } from './helpers/recurlyHelpers';

const PORT = process.env.PORT;

// Hardcoded strings
const website = "https://powersportsengines.com/powersportsengines-vip-club";
const oneTimeSubscribed = "Thank you! Subscription was created and one-time charge was completed!";
const subscribed = "Thank you! Subscription was created!";
const discountPage = process.env.DISCOUNT_PAGE;
const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';

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
    planCode,
    customAmount,
    rjsTokenId,
    recaptchaToken
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
    // Get reCAPTCHA response
    await getRecaptcha(recaptchaToken, recaptchaUrl);

    // Check plan code
    if (planCode === 'mongoosevipclub-onetime') {
      
      const planId = await getPlanId(client, planCode);
      
      // Update purchase object
      const updatedPurchase = await updatePlan(customAmount, client, planId, purchaseReq)

      // Creates a new one time/subscription purchase with updated plan info
      let oneTimeSubscription = await client.createPurchase(updatedPurchase);
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
    console.error("Error stack:", err.stack);

    if (err instanceof recurly.errors.ValidationError) {
      console.error("Validation Error Message: ", err.message);
      res.status(400).json({ error: err.params });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});