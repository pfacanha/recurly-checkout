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