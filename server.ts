import recurly from 'recurly';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import 'dotenv/config';
const PORT = process.env.PORT || 8000;

// Express client
const app = express();

// Recurly client
const client = new recurly.Client(process.env.RECURLY_API_KEY as string);

app.use(express.static(path.join(__dirname,'public')));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
  
// Create a new subscription
app.post("/purchases", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    customAmount,
    rjsTokenId,
    planCode,
    address,
  } = req.body;

  console.log("Incoming request:", req.body);

  // Assign email as unique identifier
  const accountCode = `code-${email}`;

  const accountInfo = {
    code: accountCode,
    firstName,
    lastName,
    email,
    preferredTimeZone: 'America/Chicago',
    address: {
      street1: address.street,
      city: address.city,
      region: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    billingInfo: {
      tokenId: rjsTokenId
    }
  };

  try {
    if (planCode === 'mongoosevipclub-onetime') {
      // 1. Create account
      const account = await client.createAccount(accountInfo);
      console.log('Created Account:', account.id);

      // 1.1 Check if account.id exists
      if(!account.id){
        throw new Error("Account code is missing after account creation");
      }

      // 2. Create one-time purchase
      const lineItem = await client.createLineItem(account.id, {
        currency: 'CAD',
        unitAmount: parseFloat(customAmount),
        type: 'charge'
      });

      console.log('Created one-time charge:', lineItem.uuid);

      // 3. Generate an invoice for purchase so user can be notified and charged
      let invoiceCreate = {
        currency: 'CAD',
        collectionMethod: 'automatic'
      }
      let invoiceCollection = await client.createInvoice(account.id, invoiceCreate);
      console.log('Created Invoice');
      console.log('Charge Invoice: ', invoiceCollection.chargeInvoice);
      console.log('Credit Invoices: ', invoiceCollection.creditInvoices);

      // 4. Send to the frontend a message after completion
      res.status(200).json({ success: true, message: 'One-time purchase completed. Thank you!', redirectUrl: 'https://powersportsengines.ca/mongoose-vip-club'});

    } else {
      // 5. Create subscription and account internally
      const subscription = await client.createSubscription({
        planCode,
        currency: 'CAD',
        account: accountInfo
      });
      console.log('Created subscription:', subscription.uuid);

      // 5.1 Send another message to the frontend
      res.status(200).json({ success: true, message: 'Subscription created. Thank you!', redirectUrl: 'https://powersportsengines.ca/mongoose-vip-club'});
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
