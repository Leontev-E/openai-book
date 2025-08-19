---
lang: ru
translationOf: openai-cookbook
---

# Как запустить gpt-oss локально с Ollama

Хотите запустить [**OpenAI gpt-oss**](https://openai.com/open-models) на собственном оборудовании? В этом руководстве мы расскажем, как использовать [Ollama](https://ollama.ai), чтобы локально установить **gpt-oss-20b** или **gpt-oss-120b**, общаться с моделью офлайн, использовать через API и даже подключить её к Agents SDK.

Обратите внимание, что это руководство предназначено для потребительского оборудования, например, запуска модели на ПК или Mac. Для серверных приложений с выделенными GPU, такими как NVIDIA H100, [ознакомьтесь с нашим руководством по vLLM](https://cookbook.openai.com/articles/gpt-oss/run-vllm).

## Выбор модели

Ollama поддерживает обе версии модели gpt-oss:

- **`gpt-oss-20b`**
  - Модель меньшего размера
  - Лучше всего с **≥16GB VRAM** или **объединённой памятью**
  - Идеально подходит для высококлассных потребительских GPU или Apple Silicon Mac
- **`gpt-oss-120b`**
  - Наша большая полноформатная модель
  - Лучше всего с **≥60GB VRAM** или **объединённой памятью**
  - Идеально для настройки с несколькими GPU или мощной рабочей станцией

**Несколько замечаний:**

- Эти модели поставляются с **MXFP4-квантованием** «из коробки», в настоящее время других типов квантования нет
- Вы _можете_ выгружать вычисления на CPU при нехватке VRAM, но ожидать более низкую скорость работы.

## Быстрая настройка

1. **Установите Ollama** → [Скачать здесь](https://ollama.com/download)
2. **Загрузите нужную модель:**

&lt;&lt;&lt;CODE_0&gt;>>

## Общение с gpt-oss

Готовы поговорить с моделью? Можно запустить чат в приложении или в терминале:

&lt;&lt;&lt;CODE_1&gt;>>

Ollama применяет **чатовый шаблон**, имитирующий [формат OpenAI harmony](https://cookbook.openai.com/articles/openai-harmony). Введите ваше сообщение и начните разговор.

## Использование API

Ollama предоставляет **API, совместимый с Chat Completions**, поэтому вы можете использовать OpenAI SDK без существенных изменений. Вот пример на Python:

&lt;&lt;&lt;CODE_2&gt;>>

Если вы уже использовали OpenAI SDK, это будет понятно сразу.

В качестве альтернативы вы можете использовать SDK Ollama на [Python](https://github.com/ollama/ollama-python) или [JavaScript](https://github.com/ollama/ollama-js) напрямую.

## Использование инструментов (вызов функций)

Ollama может:

- Вызывать функции
- Использовать **встроенный браузерный инструмент** (в приложении)

Пример вызова функции через Chat Completions:

&lt;&lt;&lt;CODE_3&gt;>>

Поскольку модели могут выполнять вызов инструментов как часть цепочки рассуждений (chain-of-thought, CoT), важно возвращать логику, полученную от API, в последующий вызов функции, где вы предоставляете ответ, пока модель не достигнет окончательного результата.

## Обходы для Responses API

Ollama пока **не поддерживает Responses API** нативно.

Если вы хотите использовать Responses API, можете применить [**прокси `Responses.js` от Hugging Face**](https://github.com/huggingface/responses.js) для преобразования Chat Completions в Responses API.

Для базовых случаев также можно [**запустить пример нашего Python-сервера с Ollama в качестве бэкенда.**](https://github.com/openai/gpt-oss?tab=readme-ov-file#responses-api) Этот сервер является простым примером и не включает

&lt;&lt;&lt;CODE_4&gt;>>

## Интеграция с Agents SDK

Хотите использовать gpt-oss с OpenAI **Agents SDK**?

Agents SDK позволяет переопределить базовый OpenAI клиент, чтобы направлять запросы на Ollama через Chat Completions или ваш прокси Responses.js для локальных моделей. Также можно использовать встроенные возможности для подключения Agents SDK к сторонним моделям.

- **Python:** используйте [LiteLLM](https://openai.github.io/openai-agents-python/models/litellm/), который проксирует запросы к Ollama через LiteLLM
- **TypeScript:** используйте [AI SDK](https://openai.github.io/openai-agents-js/extensions/ai-sdk/) с [адаптером ollama](https://ai-sdk.dev/providers/community-providers/ollama)

Пример использования Agents SDK на Python с LiteLLM:

&lt;&lt;&lt;CODE_5&gt;>>