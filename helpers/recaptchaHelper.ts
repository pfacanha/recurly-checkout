import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

const projectID = "my-project-2737-1748402282152";
const recaptchaKey = "6LchU0wrAAAAAADsK_Dm-003QygoYcwP6p_684ZX";
const recaptchaAction = "purchase";

export async function verifyRecaptchaEnterprise(token: string): Promise<number | null> {
  const client = new RecaptchaEnterpriseServiceClient();
  const projectPath = client.projectPath(projectID);

  const request = {
    assessment: {
      event: {
        token,
        siteKey: recaptchaKey,
      },
    },
    parent: projectPath,
  };

  const [response] = await client.createAssessment(request);

  if (!response.tokenProperties?.valid) {
    console.log("Invalid token:", response.tokenProperties?.invalidReason);
    return null;
  }

  if (response.tokenProperties.action !== recaptchaAction) {
    console.log("Action mismatch:", response.tokenProperties.action);
    return null;
  }

  console.log("Score:", response.riskAnalysis?.score);
  return response.riskAnalysis?.score ?? null;
}
