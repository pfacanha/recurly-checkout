import recurly from 'recurly';

export async function getPlanId(client: recurly.Client, planCode: string): Promise<string>{
  const plans = client.listPlans({ params: { limit: 200 } });

  for await (const plan of plans.each()) {
    if (plan.code === planCode) {
        return plan.id as string;
      } 
  }

  throw new Error(`Plan code ${planCode} is invalid or not found.`);
}

export async function getRecaptcha(token: any, url: string){
  const verifyResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY as string,
        response: token
      })
    });

    await verifyResponse.json();
}

export async function updatePlan(customAmount: number, client: recurly.Client, planId: string, purchaseObj: any){
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
      
      // Update plan info 
      const updatedPlan = await client.updatePlan(planId, planUpdate)
      const currentPlanCode = updatedPlan.code;
      console.log('Updated plan: ', currentPlanCode)

      // Update purchase object
      purchaseObj.subscriptions[0].planCode = currentPlanCode;

      return purchaseObj;
}