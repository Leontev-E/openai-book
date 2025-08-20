---
lang: ru
translationOf: openai-cookbook
---

# Как запустить gpt-oss локально с Ollama

Хотите запустить [**OpenAI gpt-oss**](https://openai.com/open-models) на своём оборудовании? В этом руководстве показано, как использовать [Ollama](https://ollama.ai) для настройки **gpt-oss-20b** или **gpt-oss-120b** локально, чтобы общаться с моделью офлайн, использовать её через API и даже подключить к Agents SDK.

Обратите внимание, что это руководство предназначено для потребительского оборудования, например, для запуска модели на ПК или Mac. Для серверных приложений с выделенными GPU вроде NVIDIA H100, [ознакомьтесь с нашим руководством по vLLM](https://cookbook.openai.com/articles/gpt-oss/run-vllm).

## Выберите модель

Ollama поддерживает оба размера модели gpt-oss:

- **`gpt-oss-20b`**
  - Меньшая модель
  - Лучше всего при **≥16 ГБ VRAM** или **объединённой памяти**
  - Идеально для высококлассных потребительских GPU или Mac на Apple Silicon
- **`gpt-oss-120b`**
  - Наша большая полноразмерная модель
  - Лучше всего при **≥60 ГБ VRAM** или **объединённой памяти**
  - Идеально для мульти-GPU или мощных рабочих станций

**Пару замечаний:**

- Эти модели поставляются **MXFP4 квантизированными** из коробки, и пока нет другой квантизации
- Вы _можете_ выгружать нагрузку на CPU при нехватке VRAM, но модель будет работать медленнее.

## Быстрая настройка

1. **Установите Ollama** → [Скачать здесь](https://ollama.com/download)
2. **Загрузите нужную модель:**

&lt;&lt;&lt;FENCE_0>>>

## Общение с gpt-oss

Готовы поговорить с моделью? Вы можете открыть чат в приложении или в терминале:

&lt;&lt;&lt;FENCE_1>>>

Ollama по умолчанию использует **чат-шаблон**, имитирующий [OpenAI harmony формат](https://cookbook.openai.com/articles/openai-harmony). Напечатайте сообщение и начните беседу.

## Использование API

Ollama предоставляет **совместимый с Chat Completions API**, поэтому вы можете использовать OpenAI SDK с минимальными изменениями. Вот пример на Python:

&lt;&lt;&lt;FENCE_2>>>

Если вы уже использовали OpenAI SDK, это будет сразу понятно.

Альтернативно, вы можете использовать Ollama SDK для [Python](https://github.com/ollama/ollama-python) или [JavaScript](https://github.com/ollama/ollama-js) напрямую.

## Использование инструментов (вызов функций)

Ollama может:

- Вызывать функции
- Использовать **встроенный браузерный инструмент** (в приложении)

Пример вызова функции через Chat Completions:

&lt;&lt;&lt;FENCE_3>>>

Поскольку модели могут выполнять вызов инструментов как часть chain-of-thought (CoT), важно возвращать логику, возвращаемую API, обратно в последующие вызовы инструментов, где вы предоставляете ответ, пока модель не получит окончательный ответ.

## Обходные пути для Responses API

Ollama пока не поддерживает **Responses API** нативно.

Если вы хотите использовать Responses API, можно использовать [**прокси Hugging Face `Responses.js`**](https://github.com/huggingface/responses.js) для конвертации Chat Completions в Responses API.

Для базовых случаев вы можете также [**запустить наш пример Python-сервера с Ollama в качестве backend.**](https://github.com/openai/gpt-oss?tab=readme-ov-file#responses-api) Этот сервер является базовым примером и не имеет

&lt;&lt;&lt;FENCE_4>>>

## Интеграция с Agents SDK

Хотите использовать gpt-oss с OpenAI **Agents SDK**?

Обе версии Agents SDK позволяют переопределить базовый клиент OpenAI, чтобы использовать Ollama через Chat Completions или ваш Responses.js прокси для локальных моделей. Кроме того, вы можете использовать встроенный функционал для подключения Agents SDK к сторонним моделям.

- **Python:** используйте [LiteLLM](https://openai.github.io/openai-agents-python/models/litellm/) как прокси к Ollama через LiteLLM
- **TypeScript:** используйте [AI SDK](https://openai.github.io/openai-agents-js/extensions/ai-sdk/) с [адаптером ollama](https://ai-sdk.dev/providers/community-providers/ollama)

Вот пример использования Agents SDK на Python с LiteLLM:

&lt;&lt;&lt;FENCE_5>>>