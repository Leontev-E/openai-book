---
lang: ru
translationOf: openai-cookbook
---

# Как запустить gpt-oss локально с Ollama

Хотите запустить [**OpenAI gpt-oss**](https://openai.com/open-models) на собственном железе? В этом руководстве мы покажем, как с помощью [Ollama](https://ollama.ai) настроить **gpt-oss-20b** или **gpt-oss-120b** локально, чтобы общаться с моделью офлайн, использовать её через API и даже подключать к Agents SDK.

Обратите внимание, что руководство предназначено для потребительского оборудования, например для запуска модели на ПК или Mac. Для серверных приложений с выделенными GPU, например NVIDIA H100, [ознакомьтесь с нашим руководством по vLLM](https://cookbook.openai.com/articles/gpt-oss/run-vllm).

## Выберите модель

Ollama поддерживает оба размера модели gpt-oss:

- **`gpt-oss-20b`**
  - Меньшая модель
  - Рекомендуется для **≥16GB VRAM** или **объединённой памяти**
  - Идеально для мощных потребительских GPU или Mac на Apple Silicon
- **`gpt-oss-120b`**
  - Наша большая полноразмерная модель
  - Требует **≥60GB VRAM** или **объединённой памяти**
  - Подходит для мульти-GPU или мощных рабочих станций

**Несколько замечаний:**

- Эти модели поставляются **квантованными в MXFP4** из коробки, другой квантования пока нет
- Можно _выгружать_ часть на CPU при нехватке видеопамяти, но это замедлит работу.

## Быстрая установка

1. **Установите Ollama** → [Скачать здесь](https://ollama.com/download)
2. **Загрузите нужную модель:**

&lt;&lt;&lt;CODE_0&gt;>>

## Общение с gpt-oss

Готовы поговорить с моделью? Вы можете открыть чат в приложении или в терминале:

&lt;&lt;&lt;CODE_1&gt;>>

Ollama применяет **чатовый шаблон** по умолчанию, имитирующий [формат OpenAI harmony](https://cookbook.openai.com/articles/openai-harmony). Напишите сообщение и начните диалог.

## Использование API

Ollama предоставляет **API, совместимое с Chat Completions**, поэтому вы можете использовать OpenAI SDK с минимальными изменениями. Вот пример на Python:

&lt;&lt;&lt;CODE_2&gt;>>

Если вы уже работали с OpenAI SDK, то это покажется вам знакомым.

Кроме того, можно напрямую использовать Ollama SDK на [Python](https://github.com/ollama/ollama-python) или [JavaScript](https://github.com/ollama/ollama-js).

## Использование инструментов (вызов функций)

Ollama может:

- вызывать функции
- использовать **встроенный браузерный инструмент** (в приложении)

Пример вызова функции через Chat Completions:

&lt;&lt;&lt;CODE_3&gt;>>

Поскольку модели могут вызывать инструменты как часть цепочки рассуждений (chain-of-thought, CoT), важно возвращать рассуждения, полученные через API, обратно в последующие вызовы инструментов, чтобы модель могла дойти до окончательного ответа.

## Обходные пути с Responses API

Ollama пока не поддерживает **Responses API** нативно.

Если вам нужно использовать Responses API, вы можете воспользоваться [**прокси `Responses.js` от Hugging Face**](https://github.com/huggingface/responses.js), который конвертирует Chat Completions в Responses API.

Для базовых сценариев также можно [**запустить наш пример Python-сервера с Ollama в роли бэкенда.**](https://github.com/openai/gpt-oss?tab=readme-ov-file#responses-api) Этот сервер является простым примером и не имеет

&lt;&lt;&lt;CODE_4&gt;>>

## Интеграция с Agents SDK

Хотите использовать gpt-oss с OpenAI **Agents SDK**?

Оба Agents SDK позволяют переназначить базовый клиент OpenAI для работы с Ollama через Chat Completions или ваш Responses.js прокси для локальных моделей. Также можно использовать встроенные возможности для работы с моделью от сторонних разработчиков.

- **Python:** Используйте [LiteLLM](https://openai.github.io/openai-agents-python/models/litellm/) для проксирования на Ollama через LiteLLM
- **TypeScript:** Используйте [AI SDK](https://openai.github.io/openai-agents-js/extensions/ai-sdk/) с [адаптером ollama](https://ai-sdk.dev/providers/community-providers/ollama)

Пример Python-кода с Agents SDK и LiteLLM:

&lt;&lt;&lt;CODE_5&gt;>>