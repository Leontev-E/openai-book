---
lang: ru
translationOf: openai-cookbook
---

# How to run gpt-oss with Hugging Face Transformers

The Transformers library by Hugging Face provides a flexible way to load and run large language models locally or on a server. This guide will walk you through running [OpenAI gpt-oss-20b](https://huggingface.co/openai/gpt-oss-20b) or [OpenAI gpt-oss-120b](https://huggingface.co/openai/gpt-oss-120b) using Transformers, either with a high-level pipeline or via low-level `generate` calls with raw token IDs.

We'll cover the use of [OpenAI gpt-oss-20b](https://huggingface.co/openai/gpt-oss-20b) or [OpenAI gpt-oss-120b](https://huggingface.co/openai/gpt-oss-120b) with the high-level pipeline abstraction, low-level \`generate\` calls, and serving models locally with \`transformers serve\`, with in a way compatible with the Responses API.

In this guide we’ll run through various optimised ways to run the **gpt-oss models via Transformers.**

Bonus: You can also fine-tune models via transformers, [check out our fine-tuning guide here](https://cookbook.openai.com/articles/gpt-oss/fine-tune-transformers).

## Pick your model

Both **gpt-oss** models are available on Hugging Face:

- **`openai/gpt-oss-20b`**
  - \~16GB VRAM requirement when using MXFP4
  - Great for single high-end consumer GPUs
- **`openai/gpt-oss-120b`**
  - Requires ≥60GB VRAM or multi-GPU setup
  - Ideal for H100-class hardware

Both are **MXFP4 quantized** by default. Please, note that MXFP4 is supported in Hopper or later architectures. This includes data center GPUs such as H100 or GB200, as well as the latest RTX 50xx family of consumer cards.

If you use `bfloat16` instead of MXFP4, memory consumption will be larger (\~48 GB for the 20b parameter model).

## Quick setup

1. **Install dependencies**  
   It’s recommended to create a fresh Python environment. Install transformers, accelerate, as well as the Triton kernels for MXFP4 compatibility:

&lt;&lt;&lt;CODE_0&gt;>>

2. **(Optional) Enable multi-GPU**  
   If you’re running large models, use Accelerate or torchrun to handle device mapping automatically.

## Create an Open AI Responses / Chat Completions endpoint

To launch a server, simply use the `transformers serve` CLI command:

&lt;&lt;&lt;CODE_1&gt;>>

The simplest way to interact with the server is through the transformers chat CLI

&lt;&lt;&lt;CODE_2&gt;>>

or by sending an HTTP request with cURL, e.g.

&lt;&lt;&lt;CODE_3&gt;>>

Additional use cases, like integrating `transformers serve` with Cursor and other tools, are detailed in [the documentation](https://huggingface.co/docs/transformers/main/serving).

## Quick inference with pipeline

The easiest way to run the gpt-oss models is with the Transformers high-level `pipeline` API:

&lt;&lt;&lt;CODE_4&gt;>>

## Advanced inference with `.generate()`

If you want more control, you can load the model and tokenizer manually and invoke the `.generate()` method:

&lt;&lt;&lt;CODE_5&gt;>>

## Chat template and tool calling

OpenAI gpt-oss models use the [harmony response format](https://cookbook.openai.com/article/harmony) for structuring messages, including reasoning and tool calls.

To construct prompts you can use the built-in chat template of Transformers. Alternatively, you can install and use the [openai-harmony library](https://github.com/openai/harmony) for more control.

To use the chat template:

&lt;&lt;&lt;CODE_6&gt;>>

To integrate the [`openai-harmony`](https://github.com/openai/harmony) library to prepare prompts and parse responses, first install it like this:

&lt;&lt;&lt;CODE_7&gt;>>

Here’s an example of how to use the library to build your prompts and encode them to tokens:

&lt;&lt;&lt;CODE_8&gt;>>

Note that the `Developer` role in Harmony maps to the `system` prompt in the chat template.

## Multi-GPU & distributed inference

The large gpt-oss-120b fits on a single H100 GPU when using MXFP4. If you want to run it on multiple GPUs, you can:

- Use `tp_plan="auto"` for automatic placement and tensor parallelism
- Launch with `accelerate launch or torchrun` for distributed setups
- Leverage Expert Parallelism
- Use specialised Flash attention kernels for faster inference

&lt;&lt;&lt;CODE_9&gt;>>

You can then run this on a node with four GPUs via

&lt;&lt;&lt;CODE_10&gt;>>
