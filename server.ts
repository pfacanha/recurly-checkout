import recurly from 'recurly';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path'
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

// List site's subscriptions
app.get("/subscriptions", async (req, res) => {
    try {
      const subscriptions = client.listSubscriptions({
        params: { state: "active", limit: 200 }
      });
      
      const count = await subscriptions.count();
  
      const results = [];
      for await (const subs of subscriptions.each()) {
        results.push(subs);
      }
      console.log(results[0]);
      res.status(200).json({ count, subscriptions : results });
    } catch (error: any) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).send(`Error: ${error.message}`);
    }
  });
  
// Create a new subscription
app.post("/purchases", async (req, res) => {
  console.log('req.body:', req.body);

  const { firstName, lastName, email, rjsTokenId, planCode } = req.body;
  
  const accountCode = email;

  // Create purchaseReq object
  try {
    let purchaseReq = {
      currency: 'CAD',
      account: {
        code: accountCode,
        firstName: firstName,
        lastName: lastName,
        email: email,
        billingInfo: {
          tokenId: rjsTokenId
        }
      },
      subscriptions: [
        { planCode: planCode },
      ]
    }

    let invoiceCollection = await client.createPurchase(purchaseReq);

    console.log('Created Charge Invoice: ', invoiceCollection.chargeInvoice);
    console.log('Created Credit Invoices: ', invoiceCollection.creditInvoices);

    res.status(201).json({ message : "Purchase completed!"});
  } catch (err) {
    if (err instanceof recurly.errors.ValidationError) {
      // If the request was not valid, you may want to tell your user
      // why. You can find the invalid params and reasons in err.params
      console.log('Failed validation', err.message);
      res.status(400).json({ message : "Purchase not completed!"});
    } else {
      // If we don't know what to do with the err, we should
      // probably re-raise and let our web framework and logger handle it
      console.log('Unknown Error: ', err);
      res.status(500).json({ message : "Something went wrong!"});
    }
  }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
