---
lang: ru
translationOf: openai-cookbook
---

# OpenAI harmony response format

The [`gpt-oss` models](https://openai.com/open-models) were trained on the harmony response format for defining conversation structures, generating reasoning output and structuring function calls. If you are not using `gpt-oss` directly but through an API or a provider like Ollama, you will not have to be concerned about this as your inference solution will handle the formatting. If you are building your own inference solution, this guide will walk you through the prompt format. The format is designed to mimic the OpenAI Responses API, so if you have used that API before, this format should hopefully feel familiar to you. `gpt-oss` should not be used without using the harmony format, as it will not work correctly.

## Concepts

### Roles

Every message that the model processes has a role associated with it. The model knows about five types of roles:

| Role        | Purpose                                                                                                                                                                                 |
| :---------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `system`    | A system message is used to specify reasoning effort, meta information like knowledge cutoff and built-in tools                                                                         |
| `developer` | The developer message is used to provide information about the instructions for the model (what is normally considered the “system prompt”) and available function tools                |
| `user`      | Typically representing the input to the model                                                                                                                                           |
| `assistant` | Output by the model which can either be a tool call or a message output. The output might also be associated with a particular “channel” identifying what the intent of the message is. |
| `tool`      | Messages representing the output of a tool call. The specific tool name will be used as the role inside a message.                                                                      |

These roles also represent the information hierarchy that the model applies in case there are any instruction conflicts: `system` \> `developer` \> `user` \> `assistant` \> `tool`

#### Channels

Assistant messages can be output in three different “channels”. These are being used to separate between user-facing responses and internal facing messages.

| Channel      | Purpose                                                                                                                                                                                                                                                                                                                                                            |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `final`      | Messages tagged in the final channel are messages intended to be shown to the end-user and represent the responses from the model.                                                                                                                                                                                                                                 |
| `analysis`   | These are messages that are being used by the model for its chain of thought (CoT). **Important:** Messages in the analysis channel do not adhere to the same safety standards as final messages do. Avoid showing these to end-users.                                                                                                                             |
| `commentary` | Any function tool call will typically be triggered on the `commentary` channel while built-in tools will normally be triggered on the `analysis` channel. However, occasionally built-in tools will still be output to `commentary`. Occasionally this channel might also be used by the model to generate a [preamble](#preambles) to calling multiple functions. |

## Harmony renderer library

We recommend using our harmony renderer through [PyPI](https://pypi.org/project/openai-harmony/) or [crates.io](https://crates.io/crates/openai-harmony) when possible as it will automatically handle rendering your messages in the right format and turning them into tokens for processing by the model.

Below is an example of using the renderer to construct a system prompt and a short conversation.

&lt;&lt;&lt;CODE_0&gt;>>

Additionally the openai_harmony library also includes a StreamableParser for parsing and decoding as the model is generating new tokens. This can be helpful for example to stream output and handle unicode characters during decoding.

&lt;&lt;&lt;CODE_1&gt;>>

## Prompt format

If you choose to build your own renderer, you’ll need to adhere to the following format.

### Special Tokens

The model uses a set of special tokens to identify the structure of your input. If you are using [tiktoken](https://github.com/openai/tiktoken) these tokens are encoded in the `o200k_harmony` encoding. All special tokens follow the format `&lt;|type|>`.

| Special token           | Purpose                                                                                                                                     | Token ID |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :------- |
| &lt;&#124;start&#124;>     | Indicates the beginning of a [message](#message-format). Followed by the “header” information of a message starting with the [role](#roles) | `200006` |
| &lt;&#124;end&#124;>       | Indicates the end of a [message](#message-format)                                                                                           | `200007` |
| &lt;&#124;message&#124;>   | Indicates the transition from the message “header” to the actual content                                                                    | `200008` |
| &lt;&#124;channel&#124;>   | Indicates the transition to the [channel](#channels) information of the header                                                              | `200005` |
| &lt;&#124;constrain&#124;> | Indicates the transition to the data type definition in a [tool call](#receiving-tool-calls)                                                | `200003` |
| &lt;&#124;return&#124;>    | Indicates the model is done with sampling the response message. A valid “stop token” indicating that you should stop inference.             | `200002` |
| &lt;&#124;call&#124;>      | Indicates the model wants to call a tool. A valid “stop token” indicating that you should stop inference.                                   | `200012` |

### Message format

The harmony response format consists of “messages” with the model potentially generating multiple messages in one go. The general structure of a message is as follows:

&lt;&lt;&lt;CODE_2&gt;>>

The `{header}` contains a series of meta information including the [role](#roles). `&lt;|end|>` represents the end of a fully completed message but the model might also use other stop tokens such as `&lt;|call|>` for tool calling and `&lt;|return|>` to indicate the model is done with the completion.

### Chat conversation format

Following the message format above the most basic chat format consists of a `user` message and the beginning of an `assistant` message.

#### Example input

&lt;&lt;&lt;CODE_3&gt;>>

The output will begin by specifying the `channel`. For example `analysis` to output the chain of thought. The model might output multiple messages (primarily chain of thought messages) for which it uses the `&lt;|end|>` token to separate them.

Once its done generating it will stop with either a `&lt;|return|>` token indicating it’s done generating the final answer, or `&lt;|call|>` indicating that a tool call needs to be performed. In either way this indicates that you should stop inference.

#### Example output

&lt;&lt;&lt;CODE_4&gt;>>

The `final` channel will contain the answer to your user’s request. Check out the [reasoning section](#reasoning) for more details on the chain-of-thought.

**Implementation note:** `&lt;|return|>` is a decode-time stop token only. When you add the assistant’s generated reply to conversation history for the next turn, replace the trailing `&lt;|return|>` with `&lt;|end|>` so that stored messages are fully formed as `&lt;|start|>{header}&lt;|message|>{content}&lt;|end|>`. Prior messages in prompts should therefore end with `&lt;|end|>`. For supervised targets/training examples, ending with `&lt;|return|>` is appropriate; for persisted history, normalize to `&lt;|end|>`.

### System message format

The system message is used to provide general information to the system. This is different to what might be considered the “system prompt” in other prompt formats. For that, check out the [developer message format](#developer-message-format).

We use the system message to define:

1. The **identity** of the model — This should always stay as `You are ChatGPT, a large language model trained by OpenAI.` If you want to change the identity of the model, use the instructions in the [developer message](#developer-message-format).
2. Meta **dates** — Specifically the `Knowledge cutoff:` and the `Current date:`
3. The **reasoning effort** — As specified on the levels `high`, `medium`, `low`
4. Available channels — For the best performance this should map to `analysis`, `commentary`, and `final`.
5. Built-in tools — The model has been trained on both a `python` and `browser` tool. Check out the [built-in tools section](#built-in-tools) for details.

**If you are defining functions,** it should also contain a note that all function tool calls must go to the `commentary` channel.

For the best performance stick to this format as closely as possible.

#### Example system message

The most basic system message you should use is the following:

&lt;&lt;&lt;CODE_5&gt;>>

If functions calls are present in the developer message section, use:

&lt;&lt;&lt;CODE_6&gt;>>

### Developer message format

The developer message represents what is commonly considered the “system prompt”. It contains the instructions that are provided to the model and optionally a list of [function tools](#function-calling) available for use or the output format you want the model to adhere to for [structured outputs](#structured-output).

If you are not using function tool calling your developer message would just look like this:

&lt;&lt;&lt;CODE_7&gt;>>

Where `{instructions}` is replaced with your “system prompt”.

For defining function calling tools, [check out the dedicated section](#function-calling).  
For defining an output format to be used in structured outputs, [check out this section of the guide](#structured-output).

### Reasoning

The gpt-oss models are reasoning models. By default, the model will do medium level reasoning. To control the reasoning you can specify in the [system message](#system-message-format) the reasoning level as `low`, `medium`, or `high`. The recommended format is:

&lt;&lt;&lt;CODE_8&gt;>>

The model will output its raw chain-of-thought (CoT) as assistant messages into the `analysis` channel while the final response will be output as `final`.

For example for the question `What is 2 + 2?` the model output might look like this:

&lt;&lt;&lt;CODE_9&gt;>>

In this case the CoT is

&lt;&lt;&lt;CODE_10&gt;>>

And the actual answer is:

&lt;&lt;&lt;CODE_11&gt;>>

**Important:**  
The model has not been trained to the same safety standards in the chain-of-thought as it has for final output. You should not show the chain-of-thought to your users, as they might contain harmful content. [Learn more in the model card](https://openai.com/index/gpt-oss-model-card/).

#### Handling reasoning output in subsequent sampling

In general, you should drop any previous CoT content on subsequent sampling if the responses by the assistant ended in a message to the `final` channel. Meaning if our first input was this:

&lt;&lt;&lt;CODE_12&gt;>>

and resulted in the output:

&lt;&lt;&lt;CODE_13&gt;>>

For the model to work properly, the input for the next sampling should be

&lt;&lt;&lt;CODE_14&gt;>>

The exception for this is tool/function calling. The model is able to call tools as part of its chain-of-thought and because of that, we should pass the previous chain-of-thought back in as input for subsequent sampling. Check out the [function calling section](#function-calling) for a complete example.

### Function calling

#### Defining available tools

All functions that are available to the model should be defined in the [developer message](#developer-message-format) in a dedicated `Tools` section.

To define the functions we use a TypeScript-like type syntax and wrap the functions into a dedicated `functions` namespace. It’s important to stick to this format closely to improve accuracy of function calling. You can check out the harmony renderer codebase for more information on how we are turning JSON schema definitions for the arguments into this format but some general formatting practices:

- Define every function as a `type {function_name} = () => any` if it does not receive any arguments
- For functions that receive an argument name the argument `_` and inline the type definition
- Add comments for descriptions in the line above the field definition
- Always use `any` as the return type
- Keep an empty line after each function definition
- Wrap your functions into a namespace, generally `functions` is the namespace you should use to not conflict with [other tools](#built-in-tools) that the model might have been trained on.

Here’s a complete input example including the definition of two functions:

&lt;&lt;&lt;CODE_15&gt;>>

#### Receiving tool calls

If the model decides to call a tool it will define a `recipient` in the header of the message using the format `to={name}`. For example, if it decides to trigger the `get_current_weather` function from above it would specify `to=functions.get_current_weather` in the header and `commentary` as the channel as specified in the [system message](#system-message-format). **The recipient might be defined in the role or channel section of the header.**

The model might also specify a `&lt;|constrain|>` token to indicate the type of input for the tool call. In this case since it’s being passed in as JSON the `&lt;|constrain|>` is set to `json`.

&lt;&lt;&lt;CODE_16&gt;>>

#### Handling tool calls

After the function call was handled we need to provide the output back to the model by specifying a new tool message with the output after the call message.

A tool message has the following format:

&lt;&lt;&lt;CODE_17&gt;>>

So in our example above

&lt;&lt;&lt;CODE_18&gt;>>

Once you have gathered the output for the tool calls you can run inference with the complete content:

&lt;&lt;&lt;CODE_19&gt;>>

As you can see above we are passing not just the function out back into the model for further sampling but also the previous chain-of-thought (“Need to use function get_current_weather.”) to provide the model with the necessary information to continue its chain-of-thought or provide the final answer.

#### Preambles

At times the model might choose to generate a “preamble” to inform the user about the tools it is about to call. For example, when it plans to call multiple tools. If this is the case it will generate an assistant message on the `commentary` channel that, unlike the chain-of-thought, is intended to be shown to the end-user.

&lt;&lt;&lt;CODE_20&gt;>>

In this case the model generated an action plan to inform the user about the multiple steps it is about to execute.

### Structured output

To control the output behavior of the model, you can define a response format at the end of the [developer message](#developer-message-format) with the following structure:

&lt;&lt;&lt;CODE_21&gt;>>

The format name functions similar to the name you can specify for your schema in the [Responses API](https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses#how-to-use) and the schema is a JSON Schema.

As an example, here’s a developer message that defines a schema for a shopping list:

&lt;&lt;&lt;CODE_22&gt;>>

This prompt alone will, however, only influence the model’s behavior but doesn’t guarantee the full adherence to the schema. For this you still need to construct your own grammar and enforce the schema during sampling.

### Built-in tools

During the training of the `gpt-oss` models, they were trained with two common tools to browse for information and execute python code to improve its results.

If you are trying to build this functionality, you should use the format below to improve reliability and accuracy.

These tools should be defined in the [system message](#system-message-format) not in the developer message by adding a `# Tools` section.

#### Browser tool

To define the browser tool add it to the system prompt section:

&lt;&lt;&lt;CODE_23&gt;>>

If the model decides to call actions in the browser it will use the same format as for [function calls](#function-calling) with two notable exceptions:

1. Requests will be made to the `analysis` channel
2. The recipient will be `browser.search`, `browser.open`, `browser.find` respectively

#### Python tool

&lt;&lt;&lt;CODE_24&gt;>>

If the model decides to execute Python code it will use the same format as for [function calls](#function-calling) with two notable exceptions:

3. Requests will be made to the `analysis` channel
4. The recipient will always be `python`
