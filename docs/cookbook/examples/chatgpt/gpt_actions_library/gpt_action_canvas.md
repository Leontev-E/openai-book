---
lang: ru
translationOf: openai-cookbook
---

# Canvas LMS Cookbook

### Table of Contents

1. [**General App Information**](#general-app-information) - Overview of Canvas LMS, its functionality, and the role of ChatGPT's Custom Actions to enhance educational experiences through AI integration.

2. [**Authentication from ChatGPT to Canvas**](#authentication-from-chatgpt-to-canvas) - Explanation of authentication methods (OAuth and User Generated Access Tokens) for connecting ChatGPT to Canvas, with detailed instructions for setting up each option.

3. [**Sample Use Case: Student Course Assistant**](#sample-use-case-student-course-assistant) - Detailed example of using ChatGPT to assist students with course navigation, exam preparation, and personalized feedback, including specific API calls and workflows.

4. [**Other Use Cases for Consideration**](#other-use-cases-for-consideration) - Additional potential integrations using the Canvas API, such as classroom analytics and report generation.

5. [**Congratulations**](#congratulations)  

## General App Information

Canvas is a widely-used Learning Management System (LMS) designed to support online learning and teaching. It offers a robust set of tools for course management, content delivery, assessments, and student collaboration. Through the [Canvas REST API](https://canvas.instructure.com/doc/api/all_resources.html), Canvas allows for extensive customization and integration with third-party applications, including AI-powered tools like ChatGPT. 

ChatGPT’s Custom Actions with Canvas enable educators to leverage AI to enhance course content, automate tasks, and provide personalized learning journeys for students. Examples include virtual teaching assistants based on active courses, as the capabilities are well-suited for pulling information in from Canvas to create an educational dialogue. ChatGPT with Custom Actions is not meant for automating the entire Canvas experience nor act as a replacement to many of its capabilities better suited for completion in the Canvas app. 

## Authentication from ChatGPT to Canvas

For a general overview on Authentication in Custom Actions, see the [Action authentication documentation](https://platform.openai.com/docs/actions/authentication).

There are two options for authentication in Canvas: 1) OAuth and 2) User Generated Access Tokens.
- For large-scale deployments, it is required to use OAuth for Action Authentication.
- If the user is considering a single-user deployment or does not have access to Admin Settings, they may consider User Generated Access Tokens. Be aware that any request made by the action will be made using the token the user generated, so Canvas will register all requests as the user's activity and use the user's permissions to complete them.

### Implementing OAuth for Canvas

While this Canvas Cookbook does not use OAuth, any deployment with more than one user must use it. See [OAuth for Canvas Documentation](https://canvas.instructure.com/doc/api/file.oauth.html#oauth2-flow) for a detailed walkthrough. 

Here are some things to keep in mind while implementing OAuth in a Canvas Custom Action:

-  Access to Canvas’ Admin settings is required for OAuth in order to retrieve a Client ID and Client Secret.
-  The Authorization URL will look like (make sure to update the Canvas Install URL): https://&lt;canvas-install-url&gt;/login/oauth2/auth
-  The Token URL will look like (make sure to update the Canvas Install URL): ttps://&lt;canvas-install-url&gt;/login/oauth2/token
-  Scopes may not need to be defined in the Custom Action. If the developer key does not require scopes and no scope parameter is specified, the access token will have access to all scopes. If the developer key does require scopes and no scope parameter is specified, Canvas will respond with "invalid_scope." More information on developer keys [here](https://canvas.instructure.com/doc/api/file.developer_keys.html) and endpoints [here](https://canvas.instructure.com/doc/api/file.oauth_endpoints.html#get-login-oauth2-auth).
-  Token Exchange Method is Default (POST Request)
-  Canvas uses the term `redirect_uri` where ChatGPT uses the term `Callback URL` for URL to complete the redirect process after successful authentication.

### Implementing authentication with User Generated Access Tokens

In some cases, it may be appropriate to use [User Generated Access Tokens](https://canvas.instructure.com/doc/api/file.oauth.html#manual-token-generation) for Custom Action authentication with Canvas. Here are the steps to follow to do so:

  1. Proceed to Canvas Account Settings shown here:
  ![canvas_lms_settings_link.png](../../../images/canvas_lms_settings_link.png)
  2. Scroll down to the List of Tokens shown here:          
  ![canvas_lms_list_of_tokens.png](../../../images/canvas_lms_list_of_tokens.png)
  3. Generate a New Token, and **store this token**. It will not be accessible later.
  ![canvas_lms_new_token.png](../../../images/canvas_lms_new_token.png)

## Sample Use Case: Student Course Assistant

### Overview

Assists students in navigating and understanding their courses by providing detailed information, generating personalized practice exams, and offering constructive feedback to enhance learning.

### Considerations

- Some information like the Syllabus is returned as an HTML page when requested by the API. This renders it impossible to show in ChatGPT. Instead, reference course description, modules, and the assignments to guide the user.
- Requests can be modified to retrieve specific pieces of information using the `include[]` query parameter. If you need to request specific information about a course, provide an example in the GPT instructions.

### GPT Instructions

There can be multiple ways to write these instructions. [See here](https://platform.openai.com/docs/guides/prompt-engineering) for guidance on Prompt Engineering strategies and best practices.

<<&lt;CODE_0&gt;>>

### OpenAPI Schema

- API Calls Featured
  - [GET] [listYourCourses](https://canvas.instructure.com/doc/api/courses.html#method.courses.index)
  - [GET] [getSingleCourse](https://canvas.instructure.com/doc/api/courses.html#method.courses.show)
  - [GET] [listModules](https://canvas.instructure.com/doc/api/modules.html#method.context_modules_api.index)
  - [GET] [listModuleItems](https://canvas.instructure.com/doc/api/modules.html#method.context_module_items_api.index)
  - [GET] [searchCourses](https://canvas.instructure.com/doc/api/search.html#method.search.all_courses)

Below was generated with a combination of [Canvas API Reference](https://canvas.instructure.com/doc/api/index.html) and the [ActionsGPT](https://chatgpt.com/g/g-TYEliDU6A-actionsgpt).

<<&lt;CODE_1&gt;>>

### Sample Conversation Starters

- Help me take a practice exam.
- Give an overview of one of my courses.
- List all of my courses.

### GPT Capabilities

- [On] Web Browsing
- [On] DALL·E Image Generation
- [On] Code Interpreter & Data Analysis

## Other Use Cases for Consideration

Below is a non-exhaustive list of additional use cases that could be explored using the Canvas API. The basic outline for each is provided, but the GPT Instructions and specific API calls referenced are intentionally left to you as the user to decide what works best for your needs. 

### Classroom Analytics and Reports

**Use Case:** Empowers teachers with comprehensive analytics and performance reports on student engagement, grades, and participation. By leveraging this data, teachers can make informed decisions to tailor their course delivery, identify at-risk students, and enhance overall classroom effectiveness.

**API Resources:**

- [**Analytics**](https://canvas.instructure.com/doc/api/analytics.html) and [**Quiz Statistics**](https://canvas.instructure.com/doc/api/quiz_statistics.html): Retrieve detailed data on student participation, grades, and course-level statistics.
- [**Quiz Reports**](https://canvas.instructure.com/doc/api/quiz_reports.html): Generate and view various reports to analyze overall class performance and track progress over time.

### Review and Improvement Guidance for Graded Assignments

**Use Case:** Provide students with a tool to review their graded assignments, analyze their performance, and receive targeted guidance on how to improve in areas where they have knowledge gaps. The tool can highlight specific questions or sections where the student struggled and suggest additional resources or practice materials to help them improve.

**API Resources:**

- [**Submissions**](https://canvas.instructure.com/doc/api/submissions.html) and [**Quiz Submissions**](https://canvas.instructure.com/doc/api/quiz_submissions.html): Retrieve the student’s submissions and associated grades.
- [**Assignments**](https://canvas.instructure.com/doc/api/assignments.html): Retrieve detailed information about the assignment, including rubrics and grading criteria.
- [**Rubric Assessments**](https://canvas.instructure.com/doc/api/rubrics.html): Access detailed feedback and rubric assessments
- [**Modules**](https://canvas.instructure.com/doc/api/modules.html): Suggest additional learning modules that target the student’s weak areas using the List modules API.
- [**Quizzes**](https://canvas.instructure.com/doc/api/quizzes.html): Recommend practice quizzes to help the student improve on specific knowledge gaps

# Congratulations!

You’ve successfully created a Custom GPT with a working Custom Action using Canvas LMS. You should be able to have a conversation that looks similar to the screenshot below. Great job and keep going!

![canvas_lms_sample_conversation.png](../../../images/canvas_lms_sample_conversation.png) 
