import * as tl from 'azure-pipelines-task-lib/task';
import { isRunningOnAgent } from "../../params/auth/isRunningOnAgent";

(async () => {
  if (isRunningOnAgent()) {
    await main();
  }
})().catch(error => {
  tl.setResult(tl.TaskResult.Failed, error);
});

export async function main(): Promise<void> {
    const endpointName = tl.getInputRequired("PowerPlatformSPN");
    const authorization = tl.getEndpointAuthorization(endpointName, false);
    const environmentUrl = tl.getEndpointUrl(endpointName, false);

    tl.setVariable('PPBTExt.ApplicationId', authorization.parameters.serviceprincipalid, false, false);
    tl.setVariable('PPBTExt.TenantId', authorization.parameters.tenantid, false, false);
    tl.setVariable('PPBTExt.EnvironmentUrl', environmentUrl, false, false);

    tl.debug("Auth Scheme: " + authorization.scheme);
    if (authorization.scheme === "WorkloadIdentityFederation") {
        // Set environment variables for Workload Identity Federation
        tl.debug('Acquiring Workload Identity Federation details from pipeline service connection');
        const oidcApiVersion = '7.2-preview.1';
        const projectId = tl.getVariable('System.TeamProjectId');
        const hub = tl.getVariable("System.HostType");
        const planId = tl.getVariable('System.PlanId');
        const jobId = tl.getVariable('System.JobId');
        const serviceConnectionId = endpointName;
        let uri = tl.getVariable("System.CollectionUri");
        if (!uri) {
            uri = tl.getVariable("System.TeamFoundationServerUri");
        }

        const tokenRequestUrl = `${uri}${projectId}/_apis/distributedtask/hubs/${hub}/plans/${planId}/jobs/${jobId}/oidctoken?serviceConnectionId=${serviceConnectionId}&api-version=${oidcApiVersion}`;
        tl.setVariable('PPBTExt.OidcRequestUri', tokenRequestUrl, false, false);
    } else {
        tl.setVariable('PPBTExt.ClientSecret', authorization.parameters.clientSecret, true, false);
    }
}
