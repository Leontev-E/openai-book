---
lang: ru
translationOf: openai-cookbook
---

# GPT Action Library: GitHub

## Introduction

This page provides instructions for developers connecting a GPT Action to GitHub. Before proceeding, familiarize yourself with the following resources:
- [Introduction to GPT Actions](https://platform.openai.com/docs/actions)
- [GPT Actions Library](https://platform.openai.com/docs/actions/actions-library)
- [Building a GPT Action from Scratch](https://platform.openai.com/docs/actions/getting-started)

This GPT Action helps developers evaluate the quality and security of a GitHub Pull Request diff. It provides feedback and suggestions for each domain, allowing developers to modify or accept the feedback before automatically submitting it as a comment on the Pull Request.

## Value & Example Business Use Cases

### **Value**:
Users can leverage ChatGPT's natural language capabilities to assist with GitHub Pull Request reviews.

- **For developers**: Analyze code changes and perform high-quality reviews with instant feedback on proposed modifications.
- **For organizations**: Ensure diffs adhere to best practices and coding standards, or automatically propose refactored alternatives (additional API requests may be required to define best practices).
- **Overall**: Boost productivity and ensure higher-quality, more secure code with this AI-powered Code Review assistant.

### **Example Use Cases**:
- A reviewer seeks feedback on the quality and security of a proposed code change.
- An organization encourages adherence to best practices and standards automatically during code review.

## Demonstration Video:
[![Watch the video](https://img.youtube.com/vi/bcjybCh-x-Q/0.jpg)](https://www.youtube.com/watch?v=bcjybCh-x-Q)

## Application Information

### **Key Links**
Before starting, explore these resources:
- [GitHub](https://github.com)
- [GitHub API Documentation](https://docs.github.com/en/rest/pulls?apiVersion=2022-11-28)

### **Prerequisites**
Ensure you have a repository with an open pull request.

## Application Setup

### **Select a Pull Request**
1. Navigate to a repository, e.g., [example PR](https://github.com/microsoft/vscode/pull/229241).
   - Note the owner (e.g., "microsoft"), repository name (e.g., "vscode"), and PR number (e.g., "229241").
   - If the repository owner is an SSO organization, your token may need [approval](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/managing-requests-for-personal-access-tokens-in-your-organization#managing-fine-grained-personal-access-token-requests).
2. Review [how to perform a high-quality code review](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/getting-started/best-practices-for-pull-requests).

### **Generate a "Fine Grained" GitHub Personal Access Token**
1. Log in to GitHub and go to **Settings**.
2. Navigate to **Developer settings** > **Fine Grained Personal access tokens**.
3. Click **Generate new token**, name it, set an expiration date, and select the necessary scopes (e.g., `read:content`, `read&write:pull_requests`).
4. Copy and securely store the token.

## ChatGPT Steps

### **Custom GPT Instructions**

Once you've created a Custom GPT, copy the following into the Instructions panel:

<<&lt;CODE_0&gt;>>

### OpenAPI Schema

Once you've created a Custom GPT, copy the text below in the Actions panel. Have questions? Check out [Getting Started Example](https://platform.openai.com/docs/actions/getting-started) to see how this step works in more detail.

Below is an example of what connecting to GitHub to GET the Pull Request Diff and POST the Feedback to the Pull Request might look like.

<<&lt;CODE_1&gt;>>

## Authentication Instructions

Below are instructions on setting up authentication with this 3rd party application. Have questions? Check out [Getting Started Example](https://platform.openai.com/docs/actions/getting-started) to see how this step works in more detail.

### In ChatGPT (refer to Step 2 in the Getting Started Example)

In ChatGPT, click on "Authentication" and choose **"Bearer"**. Enter in the information below. Ensure your token has the permissions described in Application setup, above.

- Authentication Type: API Key
- Auth Type: Bearer
- API Key 
  &lt;personal_access_token&gt;

### Test the GPT

You are now ready to test out the GPT. You can enter a simple prompt like "Can you review my pull request? owner: &lt;org_name&gt;, repo: &lt;repo_name&gt;, pull request number: &lt;PR_Number&gt;" and expect to see the following:

![landing_page.png](../../../../images/landing_page.png)

1. A summary of changes in the referenced pull request(PR).

![First Interaction](../../../images/first_interaction.png)

2. Quality and Security feedback and suggestions to incorporate in the next iteration of the PR.

![First Feedback](../../../images/first_feedback.png)

3. An option to iterate on the feedback or accept it and have the GPT post it directly to the PR as a comment from you. 

![First Interaction](../../../images/final_result.png)

*Are there integrations that you’d like us to prioritize? Are there errors in our integrations? File a PR or issue in our github, and we’ll take a look.*