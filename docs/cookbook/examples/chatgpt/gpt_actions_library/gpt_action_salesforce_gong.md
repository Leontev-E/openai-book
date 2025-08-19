---
lang: ru
translationOf: openai-cookbook
---

# GPT Action Library: Salesforce + Gong

## Introduction

This page provides an instruction & guide for developers building middleware to connect a GPT Action to a specific application. Before you proceed, make sure to first familiarize yourself with the following information:

- [Introduction to GPT Actions](https://platform.openai.com/docs/actions)
- [Introduction to GPT Actions Library](https://platform.openai.com/docs/actions/actions-library)
- [Example of Building a GPT Action from Scratch](https://platform.openai.com/docs/actions/getting-started)

This particular GPT Action provides an overview of how to build a GPT that retrieves information from Salesforce and Gong. This will include creating multiple custom actions which are documented in existing cookbooks. We will highlight these cookbooks in the next section.

### Value + Example Business Use Cases

**Value**: Users can now leverage ChatGPT's capabilities to:

- Connect to Salesforce
- Search for customer accounts
- Retrieve Gong transcripts from previous calls

**Example Use Cases**:

A sales rep is preparing for an upcoming customer meeting. Using this integration, they can quickly retrieve relevant account details from Salesforce, access recent Gong call transcripts, and receive AI-generated summaries and insights structured around proven sales methodologies like MEDPICC or SPICED. This empowers the rep with a clear, actionable understanding of the customer's current state and next steps — all in minutes

## Application Information
In this example, we are connecting to Salesforce and Gong (via a middleware). We are going to refer to existing cookbooks for basic setup and authentication instructions for Salesforce and creating a middleware. 

### Salesforce GPT Action

Refer to our cookbook on setting up a GPT Action for Salesforce. The two settings to pay attention to in that cookbook are:

- [Application Information](https://cookbook.openai.com/examples/chatgpt/gpt_actions_library/gpt_action_salesforce#application-information) - this covers the necessary concepts to be familiar with in Salesforce
- [Authentication Instructions](https://cookbook.openai.com/examples/chatgpt/gpt_actions_library/gpt_action_salesforce#authentication-instructions) - this covers creating a Connected App in Salesforce and configuring OAuth (on both Salesforce and ChatGPT)

### Middleware GPT Action
Refer to any one of our cookbooks on creating a middleware:

- [GPT Actions library (Middleware) - AWS](https://cookbook.openai.com/examples/chatgpt/gpt_actions_library/gpt_middleware_aws_function)
- [GPT Actions library (Middleware) - Azure Functions](https://cookbook.openai.com/examples/chatgpt/gpt_actions_library/gpt_middleware_azure_function)
- [GPT Actions library (Middleware) - Google Cloud Function](https://cookbook.openai.com/examples/chatgpt/gpt_actions_library/gpt_middleware_google_cloud_function)

### Application Prerequisites

In addition to the prerequisites in the cookbooks above, please ensure that you have access to a Gong API key 

## Application Setup

### Deploying a serverless function

This serverless function will accept an array of `callIds`, fetch the transcripts from Gong and clean up the response that it sends to ChatGPT. Here is an example of what it looks like on Azure Functions (Javascript)

<<&lt;CODE_0&gt;>>

Here are the dependencies that you would include in your `package.json` file

<<&lt;CODE_1&gt;>>

## ChatGPT Steps

### Custom GPT Instructions

Once you've created a Custom GPT, copy the text below in the Instructions panel. Have questions? Check out [Getting Started Example](https://platform.openai.com/docs/actions/getting-started) to see how this step works in more detail.

<<&lt;CODE_2&gt;>>
In the above example, replace the query in (3) to retrieves the Gong Call IDs from your custom Salesforce object.

You will now create 2 separate actions - one to connect to Salesforce and the other to connect to the middleware that calls the Gong APIs

### OpenAPI Schema for Salesforce custom action

Once you've created a Custom GPT, copy the text below in the Actions panel. Have questions? Check out [Getting Started Example](https://platform.openai.com/docs/actions/getting-started) to see how this step works in more detail.

Below is an example of what connecting to Salesforce might look like. You'll need to insert your URL in this section.

<<&lt;CODE_3&gt;>>

### Authentication instructions for Salesforce custom actions
Please follow the steps shown in [GPT Actions library - Salesforce](https://cookbook.openai.com/examples/chatgpt/gpt_actions_library/gpt_action_salesforce#in-chatgpt)

### OpenAPI Schema for the middleware that connects to Gong
In this example, we are setting this up for an Azure Function that calls the Gong APIs. Replace `url` with your own Middleware URL

<<&lt;CODE_4&gt;>>


*Are there integrations that you’d like us to prioritize? Are there errors in our integrations? File a PR or issue in our github, and we’ll take a look.*
