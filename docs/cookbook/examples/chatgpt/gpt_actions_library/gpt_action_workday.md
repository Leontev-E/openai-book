---
lang: ru
translationOf: openai-cookbook
---

# **Workday GPT Action Cookbook**

## **Table of Contents**

1. [General App Information](#general-app-information)  
2. [Authentication from ChatGPT to Workday](#authentication-from-chatgpt-to-workday)  
3. [Sample Use Case: PTO Submission and Benefit Plan Inquiry](#sample-use-case-pto-submission-and-benefit-plan-inquiry)  
4. [Additional Resources](#additional-resources)  
5. [Conclusion](#conclusion)

## General App Information

Workday is a cloud-based platform that offers solutions for human capital management, payroll, and financial management. Integrating ChatGPT with Workday through Custom Actions can enhance HR operations by providing automated responses to employee inquiries, guiding employees through HR processes, and retrieving key information from Workday.

ChatGPT’s Custom Actions with Workday allow organizations to use AI to improve HR processes, automate tasks, and offer personalized employee support. This includes virtual HR assistants for inquiries about benefits, time off, and payroll.

## Authentication from ChatGPT to Workday

To connect ChatGPT with Workday, use OAuth:

* Requires Workday Admin access to obtain Client ID and Client Secret.  
* Important URLs:  
    * **Authorization URL**: `[Workday Tenant URL]/authorize`, typically in this format: `https://wd5-impl.workday.com/&lt;your_tenant&gt;/authorize`  
    * **Token URL**: `[Workday Tenant URL]/token`, typically in this format: `https://wd5-impl-services1.workday.com/ccx/oauth2/&lt;your_tenant&gt;/token` 

*Reference the URls Workday provides once you create the API Client in Workday. They will provide the specific URLs needed based on the tenant and data center.*

**Steps to Set Up OAuth**:

1. Use the Register API client task in Workday.
2. Set your API client settings in workday similar to the provided example below.  
3. Scopes will vary depending on the actions being performed by GPT. For this use-case, you will need: `Staffing`, `Tenant Non-Configurable`, `Time Off and Leave`, `Include Workday Owned Scope`
4. Enter the **Redirection URI** from the GPT into the API client settings.
5. Store the **Client ID** and **Client Secret** for later use in GPT.  
6. Add the OAuth details into the GPT Authentication section as shown below.  

*The redirection URI is retrieved from the GPT setup once OAuth has been selected as authentication, on the GPT set-up screen.* 

![workday-cgpt-oauth.png](../../../../images/workday-cgpt-oauth.png)

![workday-api-client.png](../../../../images/workday-api-client.png)

The [Workday Community page on API client]((https://doc.workday.com/admin-guide/en-us/authentication-and-security/authentication/oauth/dan1370797831010.html)) can be a good resource to go deeper *(this requires a community account)*.

## Sample Use Case: PTO Submission and Benefit Plan Inquiry

### Overview

This use case demonstrates how to help employees submit PTO requests, retrieve worker details, and view benefit plans through a RAAS report.

## GPT Instructions

Use the following instructions to cover PTO Submission use-cases, Worker details retrieval and benefit plan inquiry:

<<&lt;CODE_0&gt;>>

### Creating request on behalf of the employee

As employee ID is required to take actions on Workday onto the employee, this information will need to be retrieved before doing any queries. We have accomplished this by calling a RAAS report in workday after authentication that provides the user who is logging in. There may be another way to do this via just a REST API call itself. Once the ID has been returned it will be used in all other actions.

Sample RAAS Report: Using the field Current User will return the worker who has authenticated via OAuth.    
![custom-report-workday-01.png](../../../../images/custom-report-workday-01.png)

![custom-report-workday-02.png](../../../../images/custom-report-workday-02.png)

### OpenAPI Schema

Below is an example OpenAPI schema generated using the Workday REST API Reference and [ActionsGPT](https://chatgpt.com/g/g-TYEliDU6A-actionsgpt).

We're using the following API calls:
* **\[POST\] Request\_Time\_Off**: Creates a time off request for an employee.  
* **\[GET\] Get\_Workers**: Retrieves information on worker details.  
* **\[GET\] Get\_eligibleAbsenceTypes**: Retrieves eligible time off plans.  
* **\[GET\] Get\_Report\_As\_A\_Service (RAAS)**: Pulls reports, including custom RAAS reports, for benefit details.


Replace the paths with the correct tenant ID and configure them to the appropriate servers. Ensure the required IDs are set correctly for different PTO types.

<<&lt;CODE_1&gt;>>

## Conclusion

Congratulations on setting up a GPT for Workday with capabilities such as PTO submission, employee details retrieval, and benefits plan inquiry!

This integration can streamline HR processes, provide quick access to personal details, and make it easy for employees to request PTO. This guide provides a customizable framework for implementing ChatGPT with Workday, allowing you to easily add more actions and enhance GPT capabilities further.

![workday-gpt.png](../../../../images/workday-gpt.png)

![pto-request.png](../../../../images/pto-request.png)
