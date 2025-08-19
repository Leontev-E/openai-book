---
lang: ru
translationOf: openai-cookbook
---

# How to run gpt-oss locally with Ollama

Want to get [**OpenAI gpt-oss**](https://openai.com/open-models) running on your own hardware? This guide will walk you through how to use [Ollama](https://ollama.ai) to set up **gpt-oss-20b** or **gpt-oss-120b** locally, to chat with it offline, use it through an API, and even connect it to the Agents SDK.

Note that this guide is meant for consumer hardware, like running a model on a PC or Mac. For server applications with dedicated GPUs like NVIDIA’s H100s, [check out our vLLM guide](https://cookbook.openai.com/articles/gpt-oss/run-vllm).

## Pick your model

Ollama supports both model sizes of gpt-oss:

- **`gpt-oss-20b`**
  - The smaller model
  - Best with **≥16GB VRAM** or **unified memory**
  - Perfect for higher-end consumer GPUs or Apple Silicon Macs
- **`gpt-oss-120b`**
  - Our larger full-sized model
  - Best with **≥60GB VRAM** or **unified memory**
  - Ideal for multi-GPU or beefy workstation setup

**A couple of notes:**

- These models ship **MXFP4 quantized** out the box and there is currently no other quantization
- You _can_ offload to CPU if you’re short on VRAM, but expect it to run slower.

## Quick setup

1. **Install Ollama** → [Get it here](https://ollama.com/download)
2. **Pull the model you want:**

<<&lt;CODE_0&gt;>>

## Chat with gpt-oss

Ready to talk to the model? You can fire up a chat in the app or the terminal:

<<&lt;CODE_1&gt;>>

Ollama applies a **chat template** out of the box that mimics the [OpenAI harmony format](https://cookbook.openai.com/articles/openai-harmony). Type your message and start the conversation.

## Use the API

Ollama exposes a **Chat Completions-compatible API**, so you can use the OpenAI SDK without changing much. Here’s a Python example:

<<&lt;CODE_2&gt;>>

If you’ve used the OpenAI SDK before, this will feel instantly familiar.

Alternatively, you can use the Ollama SDKs in [Python](https://github.com/ollama/ollama-python) or [JavaScript](https://github.com/ollama/ollama-js) directly.

## Using tools (function calling)

Ollama can:

- Call functions
- Use a **built-in browser tool** (in the app)

Example of invoking a function via Chat Completions:

<<&lt;CODE_3&gt;>>

Since the models can perform tool calling as part of the chain-of-thought (CoT) it’s important for you to return the reasoning returned by the API back into a subsequent call to a tool call where you provide the answer until the model reaches a final answer.

## Responses API workarounds

Ollama doesn’t (yet) support the **Responses API** natively.

If you do want to use the Responses API you can use [**Hugging Face’s `Responses.js` proxy**](https://github.com/huggingface/responses.js) to convert Chat Completions to Responses API.

For basic use cases you can also [**run our example Python server with Ollama as the backend.**](https://github.com/openai/gpt-oss?tab=readme-ov-file#responses-api) This server is a basic example server and does not have the

<<&lt;CODE_4&gt;>>

## Agents SDK integration

Want to use gpt-oss with OpenAI’s **Agents SDK**?

Both Agents SDK enable you to override the OpenAI base client to point to Ollama using Chat Completions or your Responses.js proxy for your local models. Alternatively, you can use the built-in functionality to point the Agents SDK against third party models.

- **Python:** Use [LiteLLM](https://openai.github.io/openai-agents-python/models/litellm/) to proxy to Ollama through LiteLLM
- **TypeScript:** Use [AI SDK](https://openai.github.io/openai-agents-js/extensions/ai-sdk/) with the [ollama adapter](https://ai-sdk.dev/providers/community-providers/ollama)

Here’s a Python Agents SDK example using LiteLLM:

<<&lt;CODE_5&gt;>>
