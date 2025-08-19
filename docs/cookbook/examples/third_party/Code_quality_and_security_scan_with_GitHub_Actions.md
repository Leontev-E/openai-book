---
lang: ru
translationOf: openai-cookbook
---

# Reasoning over Code Quality and Security in GitHub Pull Requests

## Introduction
This guide explains how to integrate OpenAI reasoning models into your GitHub Pull Request (PR) workflow to automatically review code for quality, security, and enterprise standards compliance. By leveraging AI-driven insights early in the development process, you can catch issues sooner, reduce manual effort, and maintain consistent best practices across your codebase.

## Why Integrate OpenAI Reasoning Models in PRs?
• Save time during code reviews by automatically detecting code smells, security vulnerabilities, and style inconsistencies.  
• Enforce coding standards organization-wide for consistent, reliable code.  
• Provide developers with prompt, AI-guided feedback on potential improvements.

## Example Use Cases
• A reviewer wants feedback on the security of a new code change before merging.  
• A team seeks to enforce standard coding guidelines, ensuring consistent code quality across the organization.

## Prerequisites

### 1. Generate an OpenAI “Project Key”
1. Go to platform.openai.com/api-keys and click to create a new secret key.  
2. Securely store the token in your GitHub repository secrets as OPENAI_API_KEY.

### 2. Choose Your OpenAI Model
Use [OpenAI Reasoning Models](https://platform.openai.com/docs/guides/reasoning) for in-depth analysis of code changes. Begin with the most advanced model and refine your prompt as needed.

### 3. Select a Pull Request
1. Confirm GitHub Actions is enabled for your repository.  
2. Ensure you have permissions to configure repository secrets or variables (e.g., for your PROMPT, MODELNAME, and BEST_PRACTICES variables).

### 4. Define Enterprise Coding Standards
Store your standards as a repository variable (BEST_PRACTICES). These may include:  
• Code style & formatting  
• Readability & maintainability  
• Security & compliance  
• Error handling & logging  
• Performance & scalability  
• Testing & QA  
• Documentation & version control  
• Accessibility & internationalization  

### 5. Define Prompt Content
Construct a meta-prompt to guide OpenAI toward security, quality, and best-practice checks. Include:  
1. Code Quality & Standards  
2. Security & Vulnerability Analysis  
3. Fault Tolerance & Error Handling  
4. Performance & Resource Management  
5. Step-by-Step Validation  

Encourage OpenAI to provide a thorough, line-by-line review with explicit recommendations.

## Create Your GitHub Actions Workflow

This GitHub Actions workflow is triggered on every pull request against the main branch and comprises two jobs. The first job gathers a diff of all changed files—excluding .json and .png files—and sends these changes to OpenAI for analysis. Any suggested fixes from OpenAI are included in a comment on the PR. The second job evaluates the PR against your defined enterprise standards and returns a markdown table that summarizes the code’s adherence to those standards. You can easily adjust or refine the workflow by updating variables such as the prompt, model name, and best practices.

<<&lt;CODE_0&gt;>>

## Test the Workflow
Commit this workflow to your repository, then open a new PR. The workflow will run automatically, posting AI-generated feedback as a PR comment.

*For a public example, see the OpenAI-Forum repository’s workflow: [pr_quality_and_security_check.yml](https://github.com/alwell-kevin/OpenAI-Forum/blob/main/.github/workflows/pr_quality_and_security_check.yml).*

![pr_quality_and_security_check.png](../../images/pr_quality_and_security_check.png)

![workflow_check.png](../../images/workflow_check.png)