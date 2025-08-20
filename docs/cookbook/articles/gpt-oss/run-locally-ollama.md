---
lang: ru
translationOf: openai-cookbook
---

# Как запустить gpt-oss локально с Ollama

Хотите запустить [**OpenAI gpt-oss**](https://openai.com/open-models) на собственном оборудовании? В этом руководстве объясняется, как использовать [Ollama](https://ollama.ai) для настройки **gpt-oss-20b** или **gpt-oss-120b** локально, чтобы общаться с моделью офлайн, использовать её через API и даже подключать к Agents SDK.

Обратите внимание, что это руководство предназначено для потребительского оборудования, например, для запуска модели на ПК или Mac. Для серверных приложений с выделенными GPU, например NVIDIA H100, [ознакомьтесь с нашим руководством по vLLM](https://cookbook.openai.com/articles/gpt-oss/run-vllm).

## Выберите модель

Ollama поддерживает оба размера модели gpt-oss:

- **&lt;&lt;&lt;INL_0>>>**
  - Меньшая модель
  - Лучше использовать с **≥16 ГБ видеопамяти** или **объединённой памятью**
  - Отлично подходит для топовых потребительских GPU или Mac на Apple Silicon
- **&lt;&lt;&lt;INL_1>>>**
  - Наша большая полноразмерная модель
  - Лучше с **≥60 ГБ видеопамяти** или **объединённой памятью**
  - Идеальна для много-GPU систем или мощных рабочих станций

**Пара замечаний:**

- Эти модели из коробки идут **квантизированными в MXFP4**, других вариантов квантизации пока нет
- Вы _можете_ выгрузить часть вычислений на CPU при недостатке видеопамяти, но производительность при этом снизится.

## Быстрая настройка

1. **Установите Ollama** → [Скачать здесь](https://ollama.com/download)
2. **Загрузите нужную модель:**

&lt;&lt;&lt;CODE_0>>>

## Общение с gpt-oss

Готовы поговорить с моделью? Можете запустить чат в приложении или в терминале:

&lt;&lt;&lt;CODE_1>>>

Ollama по умолчанию применяет **чат-шаблон**, имитирующий [формат OpenAI harmony](https://cookbook.openai.com/articles/openai-harmony). Введите сообщение и начните диалог.

## Использование API

Ollama предоставляет **API, совместимое с Chat Completions**, так что вы можете использовать OpenAI SDK без существенных изменений. Вот пример на Python:

&lt;&lt;&lt;CODE_2>>>

Если вы уже работали с OpenAI SDK, это покажется вам знакомым.

Также вы можете напрямую использовать SDK Ollama на [Python](https://github.com/ollama/ollama-python) или [JavaScript](https://github.com/ollama/ollama-js).

## Использование инструментов (function calling)

Ollama умеет:

- Вызывать функции
- Использовать **встроенный браузерный инструмент** (в приложении)

Пример вызова функции через Chat Completions:

&lt;&lt;&lt;CODE_3>>>

Поскольку модели могут вызывать инструменты в рамках цепочки рассуждений (CoT), важно возвращать вывод API из этапа рассуждения в последующий вызов инструмента для предоставления ответа до тех пор, пока модель не достигнет окончательного результата.

## Обходные пути с Responses API

Пока Ollama **не поддерживает Responses API** нативно.

Если вам нужно использовать Responses API, вы можете воспользоваться [**прокси Hugging Face для &lt;&lt;&lt;INL_2>>>**](https://github.com/huggingface/responses.js), который преобразует Chat Completions в Responses API.

Для базовых сценариев можно [**запустить наш пример сервера на Python с Ollama как бэкендом.**](https://github.com/openai/gpt-oss?tab=readme-ov-file#responses-api) Этот сервер — простой пример и не содержит

&lt;&lt;&lt;CODE_4>>>

## Интеграция с Agents SDK

Хотите использовать gpt-oss с OpenAI **Agents SDK**?

Оба Agents SDK позволяют переопределить базовый клиент OpenAI с указанием Ollama через Chat Completions или вашего прокси Responses.js для локальных моделей. Также можно использовать встроенные возможности для подключения Agents SDK к сторонним моделям.

- **Python:** Используйте [LiteLLM](https://openai.github.io/openai-agents-python/models/litellm/), который проксирует запросы к Ollama через LiteLLM
- **TypeScript:** Используйте [AI SDK](https://openai.github.io/openai-agents-js/extensions/ai-sdk/) с [адаптером ollama](https://ai-sdk.dev/providers/community-providers/ollama)

Пример на Python с Agents SDK и LiteLLM:

&lt;&lt;&lt;CODE_5>>>