**Extensions for Power Platform Build Tools**
==============================

## Overview
This extension adds additional tasks on top of the [Power Platform Build Tools](https://aka.ms/buildtoolsdoc) from Microsoft to automate common build and deployment tasks related to Power Platform.

## Feedback & Questions
Please use the issues tracker in the home repo: <https://github.com/YannickRe/ppbt-extensiontasks/issues>

## Remarks
The standard Power Platform Build Tools will clear all auth profiles from the pipeline after each action! Make sure to re-run the Set Connection Variables task from these extensions again after each time you use an action from the standard set of tasks.

## Tasks
### Set Connection Variables
Use it in the pipeline like this:
```
      - task: PPBTExtSetConnectionVariables@1
        displayName: Set Connection Variables
        inputs:
          PowerPlatformSPN: 'YourSPNHere'
```

After which you can create a pac cli auth profile using Federated Identity Credentials / Workload Identity Federation:
```
      - task: PowerShell@2
        displayName: Create pac cli auth profile
        env:
          PAC_ADO_ID_TOKEN_REQUEST_TOKEN: $(System.AccessToken)
          PAC_ADO_ID_TOKEN_REQUEST_URL: $(PPBTExt.OidcRequestUri)
        inputs:
          targetType: 'inline'
          script: |
            pac auth create --name devops-temp --environment $(PPBTExt.EnvironmentUrl) --azureDevOpsFederated --tenant $(PPBTExt.TenantId) --applicationId $(PPBTExt.ApplicationId)
          pwsh: true
```

It makes available the following environment variables:
- PPBTExt.EnvironmentUrl
- PPBTExt.TenantId
- PPBTExt.ApplicationId
- PPBTExt.ClientSecret
- PPBTExt.OidcRequestUri