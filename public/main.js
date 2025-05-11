// Apply PUBLIC KEY for recurly
recurly.configure('ewr1-7CmUOdfgabkiYdgBEvWjUj');

// Subscriptions' plans
const individualsPlanCode = 'mongoosevipclub-individuals';
const businessesPlanCode = 'mongoosevipclub-businesses';
const oneTimePlanCode = 'mongoosevipclub-onetime';

// Required Fields
const requiredFields = [
    'first_name',
    'last_name',
    'email',
    'address1',
    'city',
    'state',
    'postal_code'
];

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

// Attach cardElement to DOM
card.attach('#recurly-elements');

// <form> submission
document.querySelector('#my-form').addEventListener('submit', async function (event) {
  event.preventDefault();

  const form = this;

  // Check plan option
  const planOptions = form.querySelectorAll('input[name="plan_option"]');
  const planCode = getPlanCode(planOptions);

  if(!planCode){
    alert("Please choose one of our plans to proceed.");
    console.log("Please make sure you choose an option!");
    return;
  }

  // Check for missing fields
  validateFields(requiredFields, form);

  // Fetch <form> values
  const email = form.querySelector('input[name="email"]').value;
  const firstName = form.querySelector('input[name="first_name"]').value;
  const lastName = form.querySelector('input[name="last_name"]').value;
  const customAmount = form.querySelector('input[name="custom_amount"]').value;
  const street = form.querySelector('input[name="address1"]').value;
  const city = form.querySelector('input[name="city"]').value;
  const country = form.querySelector('select[name="country"]').value;
  const state = form.querySelector('input[name="state"]').value;
  const postalCode = form.querySelector('input[name="postal_code"]').value;

  try {
    const token = await getToken(elements,form);

    // Create a purchaseData object to be sent to backend server
    const purchaseData = {
      firstName,
      lastName,
      email,
      customAmount,
      rjsTokenId: token.id,
      planCode,
      address: {
        street,
        city,
        country,
        state,
        postalCode
      }
    };

    await sendPurchaseData(purchaseData);

  } catch (error) {
    console.error("Something went wrong:", error);
  }
});

async function sendPurchaseData(data){
  const response = await fetch('/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Server responded with status ${response.status}`);
  }
  
  // Parse the server's response body as JSON
  const json = await response.json();
  console.log("Server responded: ", json);

  if (json.success) {
    alert(json.message);
    if (json.redirectUrl) {
      window.location.href = json.redirectUrl;
    }
  } else {
    alert("Something went wrong!");
}}

function validateFields(fields, form){
  let isValid = true;

  // Clear previous errors
  fields.forEach(fieldName => {
    const input = form.querySelector(`[name="${fieldName}"]`);
    if (input) input.classList.remove('input-error');
  });

  // Validate
  fields.forEach(fieldName => {
    const input = form.querySelector(`[name="${fieldName}"]`);
    if (input && !input.value.trim()) {
      input.classList.add('input-error');
      isValid = false;
    }
  });

  if (!isValid) {
    alert("Please fill out all required fields.");
    return;
  }
}

function getPlanCode(radioButtons){
  // Verify which plan option was checked
  let selectedPlan;

  radioButtons.forEach(radio => {
    if(radio.checked){
      selectedPlan = radio;
    }
  });

  let planCode;

  if(selectedPlan){
    // Assign plan accordingly to option chosen
    if(selectedPlan.value === 'individuals'){
      planCode = individualsPlanCode;
    }

    if(selectedPlan.value === 'businesses'){
      planCode = businessesPlanCode;
    }

    if(selectedPlan.value === 'onetime'){
      planCode = oneTimePlanCode;
    }
  } else {
    planCode = null;
  }
  return planCode;
}

async function getToken(elements,form){
  return new Promise((resolve, reject) => {
    recurly.token(elements, form, function (err, token) {
      if (err) {
        return reject(err);
      }
      resolve(token);
    });
  });
}
