// Apply PUBLIC KEY for recurly
recurly.configure("ewr1-7CmUOdfgabkiYdgBEvWjUj");

// Subscriptions' plans
const individualsPlanCode = "mongoosevipclub-individuals";
const businessesPlanCode = "mongoosevipclub-businesses";
const oneTimePlanCode = "mongoosevipclub-onetime";

// Recurly's element instance
const elements = recurly.Elements();

// Apply styles to CardElement
const card = elements.CardElement({
  inputType: "mobileSelect",
  style: {
    fontSize: "1em",
    placeholder: {
      color: "gray !important",
      fontWeight: "bold",
      content: {
        number: "Card number",
        cvv: "CVC",
      },
    },
    invalid: {
      fontColor: "red",
    },
  },
});

// Attach cardElement to DOM
card.attach("#recurly-elements");

// Get <form> inputs
const textInputs = document.querySelectorAll('input[type="text"]');

// Get radio options
const planOptions = document.querySelectorAll('input[type="radio"]');

// Display customAmount field if 'onetime' ooption is selected
updateOptionsStyle();

// <form> submission
document.querySelector("#my-form").addEventListener("submit", async function (event) {
  event.preventDefault();

  const planCode = getPlanCode(planOptions);

  validatePlanCode(planCode);

  if (!validateInputs(textInputs)) return;

  const customAmount = document.querySelector('input[name="custom_amount"]');
  const form = this;

  try {
    const token = await getToken(elements, form);

    const purchaseData = getPurchaseData(form);
    purchaseData["planCode"] = planCode;
    purchaseData["customAmount"] = customAmount.value;
    purchaseData["rjsTokenId"] = token.id;

    console.log("Sending to backend:", purchaseData);
    await sendPurchaseData(purchaseData);
  } catch (error) {
    console.error("Something went wrong during form submission:", error);
    if (Array.isArray(error) && error.length > 0) {
      alert(error[0].message);
    } else {
      alert(error.message);
    }
  }
});

async function sendPurchaseData(data) {
  // Get and attach reCHAPTCHA response to data
  const recaptchaToken = grecaptcha.getResponse();
  if (!recaptchaToken) {
    alert("Please complete the reCAPTCHA.");
    return;
  }
  data["recaptchaToken"] = recaptchaToken;

  const response = await fetch("/purchases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  // Parse the server's response body as JSON
  const json = await response.json();
  console.log("Server responded: ", json);

  if (json.success) {
    alert(json.message);
    window.location.href = json.redirectUrl;
  } else {
    throw json.error;
  }
}

function getToken(elements, form) {
  return new Promise((resolve, reject) => {
    recurly.token(elements, form, function (err, token) {
      if (err) {
        return reject(err);
      }
      resolve(token);
    });
  });
}

function getPlanCode(options) {
  let selectedPlan;

  // Iterate over radio buttons
  options.forEach((option) => {
    // Get the plan chosen
    if (option.checked) {
      selectedPlan = option;
    }
  });

  if (!selectedPlan) {
    console.log("Please select an option!");
    return null;
  }
  // Check with current plan options
  let planCode;
  if (selectedPlan.value === "individuals") {
    planCode = individualsPlanCode;
  }
  if (selectedPlan.value === "businesses") {
    planCode = businessesPlanCode;
  }
  if (selectedPlan.value === "onetime") {
    planCode = oneTimePlanCode;
  }
  return planCode;
}

function getPurchaseData(form) {
  const data = {};

  for (let element of form.elements) {
    if (element.type === "text") {
      data[camelCase(element.name)] = element.value;
    }
  }
  return data;
}

function validatePlanCode(code) {
  if (!code) {
    console.log("Invalid plan code, please choose an option");
    alert("You must choose an option");
    return;
  }
}

function validateInputs(inputs) {
  isValid = true;

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      input.classList.add("input-error");
      isValid = false;
    } else {
      input.classList.remove("input-error");
    }
  });

  if (!isValid) {
    alert("Please fill up all required fields");
  }

  return isValid;
}

function updateOptionsStyle() {
  // Get "one-time" input element
  const oneTimeInput = document.getElementById("onetime-amount");

  planOptions.forEach((option) => {
    option.addEventListener("change", function () {
      if (option.value === "onetime") {
        oneTimeInput.style.display = "block";
      } else {
        oneTimeInput.style.display = "none";
      }
    });
  });
}

function camelCase(str) {
  const newStr = str.split("_");

  if (!newStr[1]) return newStr[0];

  newStr[1] =
    newStr[1].charAt(0).toUpperCase() + newStr[1].slice(1).toLowerCase();

  return newStr[0] + newStr[1];
}
