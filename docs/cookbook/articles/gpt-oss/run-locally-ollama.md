---
lang: ru
translationOf: openai-cookbook
---

# Как запустить gpt-oss локально с Ollama

Хотите запустить [**OpenAI gpt-oss**](https://openai.com/open-models) на собственном оборудовании? Это руководство покажет, как использовать [Ollama](https://ollama.ai) для настройки **gpt-oss-20b** или **gpt-oss-120b** локально, чтобы общаться с моделью офлайн, использовать её через API и даже подключать к Agents SDK.

Обратите внимание, что это руководство предназначено для потребительского оборудования, например, для запуска модели на ПК или Mac. Для серверных приложений с выделенными GPU, такими как NVIDIA H100, [ознакомьтесь с нашим руководством по vLLM](https://cookbook.openai.com/articles/gpt-oss/run-vllm).

## Выберите модель

Ollama поддерживает обе версии gpt-oss:

- **&lt;&lt;&lt;INL_0>>>**
  - Меньшая модель
  - Лучше всего подходит при **≥16GB видеопамяти (VRAM)** или **унифицированной памяти**
  - Идеальна для высококлассных потребительских GPU или Apple Silicon Mac
- **&lt;&lt;&lt;INL_1>>>**
  - Наша большая полноразмерная модель
  - Лучше всего подходит при **≥60GB видеопамяти (VRAM)** или **унифицированной памяти**
  - Отлично подходит для многопроцессорных GPU или мощных рабочих станций

**Несколько замечаний:**

- Эти модели поставляются **квантизированными в формате MXFP4** «из коробки» и сейчас не поддерживаются другие варианты квантизации
- Вы _можете_ выгружать вычисления на CPU, если не хватает VRAM, но производительность при этом будет ниже.

## Быстрая установка

1. **Установите Ollama** → [Скачайте здесь](https://ollama.com/download)
2. **Загрузите нужную модель:**

&lt;&lt;&lt;CODE_0>>>

## Общение с gpt-oss

Готовы поговорить с моделью? Вы можете начать чат в приложении или в терминале:

&lt;&lt;&lt;CODE_1>>>

Ollama применяет **шаблон чата**, имитирующий [формат OpenAI Harmony](https://cookbook.openai.com/articles/openai-harmony). Просто введите сообщение и начните разговор.

## Использование API

Ollama предоставляет **API, совместимое с Chat Completions**, так что вы можете использовать OpenAI SDK с минимумом изменений. Вот пример на Python:

&lt;&lt;&lt;CODE_2>>>

Если вы ранее пользовались OpenAI SDK, это покажется вам знакомым.

Кроме того, вы можете использовать SDK Ollama напрямую в [Python](https://github.com/ollama/ollama-python) или [JavaScript](https://github.com/ollama/ollama-js).

## Использование инструментов (вызов функций)

Ollama умеет:

- Вызывать функции
- Использовать **встроенный браузерный инструмент** (в приложении)

Пример вызова функции через Chat Completions:

&lt;&lt;&lt;CODE_3>>>

Поскольку модели могут вызывать инструменты в рамках рассуждений (chain-of-thought, CoT), важно вернуть логику, полученную от API, обратно в следующий вызов функции, где вы предоставляете ответ, пока модель не придёт к окончательному выводу.

## Обходы для Responses API

Пока Ollama не поддерживает **Responses API** нативно.

Если хотите использовать Responses API, можно воспользоваться [**прокси Hugging Face &lt;&lt;&lt;INL_2>>>**](https://github.com/huggingface/responses.js), которое конвертирует Chat Completions в Responses API.

Для базовых случаев также можно [**запустить наш пример Python-сервера с Ollama в качестве бекенда.**](https://github.com/openai/gpt-oss?tab=readme-ov-file#responses-api) Этот сервер является базовым примером и не имеет

&lt;&lt;&lt;CODE_4>>>

## Интеграция с Agents SDK

Хотите использовать gpt-oss с OpenAI **Agents SDK**?

Оба Agents SDK позволяют переопределять базовый клиент OpenAI, указывая на Ollama через Chat Completions или ваш прокси Responses.js для локальных моделей. Альтернативно, можно воспользоваться встроенными возможностями указать Agents SDK на сторонние модели.

- **Python:** Используйте [LiteLLM](https://openai.github.io/openai-agents-python/models/litellm/) как прокси для Ollama через LiteLLM
- **TypeScript:** Используйте [AI SDK](https://openai.github.io/openai-agents-js/extensions/ai-sdk/) с [адаптером ollama](https://ai-sdk.dev/providers/community-providers/ollama)

Пример на Python для Agents SDK с использованием LiteLLM:

&lt;&lt;&lt;CODE_5>>>