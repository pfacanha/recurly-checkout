// Apply PUBLIC KEY for recurly
recurly.configure('ewr1-7CmUOdfgabkiYdgBEvWjUj');

// Subscription's name
const planCode = 'mongoosevipclub-individuals';

// Recurly's element instance
const elements = recurly.Elements();

// Apply styles to CardElement
const card = elements.CardElement({
  inputType: 'mobileSelect',
  style: {
    fontSize: '1em',
    placeholder: {
      color: 'gray !important',
      fontWeight: 'bold',
      content: {
        number: 'Card number',
        cvv: 'CVC'
      }
    },
    invalid: {
      fontColor: 'red'
    }
  }
});

// Attach styles to DOM element
card.attach('#recurly-elements');

// <form> submission
document.querySelector('#my-form').addEventListener('submit', async function (event) {
  event.preventDefault();

  // Assign HTML form as current element
  const form = this;

  // Wrap recurly.token (callback-based) in a Promise to use async/await
  try {
    const token = await new Promise((resolve, reject) => {
      recurly.token(elements, form, function (err, token) {
        if (err) {
          return reject(err);
        }
        resolve(token);
      });
    });

    // Fetch <form> values
    const email = form.querySelector('input[name="email"]').value;
    const firstName = form.querySelector('input[name="first_name"]').value;
    const lastName = form.querySelector('input[name="last_name"]').value;

    // Create a purchaseData object
    const purchaseData = {
      firstName,
      lastName,
      email,
      rjsTokenId: token.id,
      planCode: planCode
    };

    console.log('Sending purchaseData:', purchaseData);

    // Build and send a POST request to the server with the purchase data
    const response = await fetch('/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData)
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    // Parse the server's response body as JSON
    const json = await response.json();
    console.log("Server responded: ", json);

  } catch (error) {
    console.error("Something went wrong:", error);
  }
});
