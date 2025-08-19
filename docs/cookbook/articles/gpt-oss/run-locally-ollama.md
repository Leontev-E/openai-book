---
lang: ru
translationOf: openai-cookbook
---

# Как запустить gpt-oss локально с Ollama

Хотите запустить [**OpenAI gpt-oss**](https://openai.com/open-models) на собственном оборудовании? Это руководство расскажет, как с помощью [Ollama](https://ollama.ai) установить **gpt-oss-20b** или **gpt-oss-120b** локально, чтобы общаться с моделью офлайн, использовать её через API и даже подключать к Agents SDK.

Обратите внимание, что это руководство предназначено для потребительского оборудования, например, для запуска модели на ПК или Mac. Для серверных приложений с выделенными GPU, такими как NVIDIA H100, [ознакомьтесь с нашим руководством по vLLM](https://cookbook.openai.com/articles/gpt-oss/run-vllm).

## Выбор модели

Ollama поддерживает оба размера модели gpt-oss:

- **`gpt-oss-20b`**
  - Модель меньшего размера
  - Лучше использовать с **≥16 ГБ VRAM** или **унифицированной памятью**
  - Идеально подходит для топовых потребительских GPU или Mac на Apple Silicon
- **`gpt-oss-120b`**
  - Наша большая полноразмерная модель
  - Лучше использовать с **≥60 ГБ VRAM** или **унифицированной памятью**
  - Идеально для нескольких GPU или мощной рабочей станции

**Пару замечаний:**

- Эти модели поставляются уже **квантованными под MXFP4** и в настоящее время не поддерживают другие виды квантования
- Вы _можете_ разгружать вычисления на CPU, если не хватает VRAM, но это заметно замедлит работу.

## Быстрая установка

1. **Установите Ollama** → [Скачать здесь](https://ollama.com/download)
2. **Загрузите нужную модель:**

&lt;&lt;&lt;CODE_0&gt;>>

## Общение с gpt-oss

Готовы поговорить с моделью? Вы можете начать чат в приложении или из терминала:

&lt;&lt;&lt;CODE_1&gt;>>

Ollama автоматически применяет **чат-шаблон**, имитирующий [формат OpenAI harmony](https://cookbook.openai.com/articles/openai-harmony). Напишите сообщение и начните разговор.

## Использование API

Ollama предоставляет API, совместимое с **Chat Completions**, поэтому вы можете использовать OpenAI SDK почти без изменений. Вот пример на Python:

&lt;&lt;&lt;CODE_2&gt;>>

Если вы уже работали с OpenAI SDK, это покажется знакомым.

В качестве альтернативы, вы можете использовать SDK Ollama напрямую: [Python](https://github.com/ollama/ollama-python) или [JavaScript](https://github.com/ollama/ollama-js).

## Использование инструментов (вызов функций)

Ollama может:

- Вызывать функции
- Использовать **встроенный браузерный инструмент** (в приложении)

Пример вызова функции через Chat Completions:

&lt;&lt;&lt;CODE_3&gt;>>

Поскольку модели могут вызывать инструменты в рамках цепочки рассуждений (Chain-of-Thought, CoT), важно возвращать логику рассуждений, полученную от API, в последующий вызов инструмента, где вы предоставляете ответ, пока модель не придёт к окончательному выводу.

## Обходы для Responses API

Ollama пока не поддерживает **Responses API** нативно.

Если хотите использовать Responses API, можно воспользоваться [**прокси `Responses.js` от Hugging Face**](https://github.com/huggingface/responses.js), который конвертирует Chat Completions в Responses API.

Для базовых сценариев можно также [**запустить наш пример Python-сервера с Ollama как бэкендом.**](https://github.com/openai/gpt-oss?tab=readme-ov-file#responses-api) Этот сервер — базовый пример и не содержит

&lt;&lt;&lt;CODE_4&gt;>>

## Интеграция с Agents SDK

Хотите использовать gpt-oss с OpenAI **Agents SDK**?

Оба Agents SDK позволяют переопределить базовый клиент OpenAI так, чтобы он обращался к Ollama через Chat Completions или к вашему прокси Responses.js для локальных моделей. Кроме того, можно использовать встроенный функционал для подключения Agents SDK к сторонним моделям.

- **Python:** Используйте [LiteLLM](https://openai.github.io/openai-agents-python/models/litellm/), чтобы проксировать к Ollama через LiteLLM
- **TypeScript:** Используйте [AI SDK](https://openai.github.io/openai-agents-js/extensions/ai-sdk/) с [адаптером ollama](https://ai-sdk.dev/providers/community-providers/ollama)

Вот пример использования Agents SDK на Python с помощью LiteLLM:

&lt;&lt;&lt;CODE_5&gt;>>