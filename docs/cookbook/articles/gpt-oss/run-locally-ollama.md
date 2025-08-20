---
lang: ru
translationOf: openai-cookbook
---

# Как запустить gpt-oss локально с Ollama

Хотите запустить [**OpenAI gpt-oss**](https://openai.com/open-models) на собственном оборудовании? Это руководство покажет, как использовать [Ollama](https://ollama.ai) для установки **gpt-oss-20b** или **gpt-oss-120b** локально, чтобы общаться с ним офлайн, использовать через API и даже подключать его к Agents SDK.

Обратите внимание, что это руководство предназначено для потребительского оборудования, например, запуск модели на ПК или Mac. Для серверных приложений с выделенными GPU, такими как NVIDIA H100, [ознакомьтесь с нашим руководством по vLLM](https://cookbook.openai.com/articles/gpt-oss/run-vllm).

## Выберите вашу модель

Ollama поддерживает оба размера модели gpt-oss:

- **&lt;&lt;&lt;INL_0>>>**
  - Меньшая модель
  - Оптимально при **≥16 ГБ VRAM** или **объединённой памяти**
  - Отлично подходит для высококлассных потребительских GPU или Apple Silicon Mac
- **&lt;&lt;&lt;INL_1>>>**
  - Наше полноразмерное крупное решение
  - Рекомендуется при **≥60 ГБ VRAM** или **объединённой памяти**
  - Подходит для мульти-GPU или мощных рабочих станций

**Пара важных замечаний:**

- Эти модели поставляются в формате **MXFP4 quantized** из коробки, на данный момент нет других вариантов квантизации
- Вы _можете_ выгружать вычисления на CPU при недостатке VRAM, но ожидайте более низкую скорость работы.

## Быстрая настройка

1. **Установите Ollama** → [Скачать здесь](https://ollama.com/download)
2. **Загрузите нужную модель:**

&lt;&lt;&lt;CODE_0>>>

## Общение с gpt-oss

Готовы поговорить с моделью? Вы можете начать чат в приложении или в терминале:

&lt;&lt;&lt;CODE_1>>>

Ollama применяет **шаблон чата** из коробки, который имитирует [формат OpenAI harmony](https://cookbook.openai.com/articles/openai-harmony). Введите ваше сообщение и начните разговор.

## Использование API

Ollama предоставляет **API, совместимый с Chat Completions**, поэтому вы можете использовать OpenAI SDK без существенных изменений. Вот пример на Python:

&lt;&lt;&lt;CODE_2>>>

Если вы уже работали с OpenAI SDK, это покажется вам знакомым.

Кроме того, вы можете напрямую использовать Ollama SDK на [Python](https://github.com/ollama/ollama-python) или [JavaScript](https://github.com/ollama/ollama-js).

## Использование инструментов (вызов функций)

Ollama может:

- Вызывать функции
- Использовать **встроенный браузер** (в приложении)

Пример вызова функции через Chat Completions:

&lt;&lt;&lt;CODE_3>>>

Поскольку модели могут выполнять вызов инструментов как часть цепочки рассуждений (chain-of-thought, CoT), важно возвращать полученное от API рассуждение в последующий вызов инструмента, где вы предоставляете ответ, пока модель не придёт к итоговому выводу.

## Обходы для Responses API

Ollama пока не поддерживает **Responses API** нативно.

Если вы хотите использовать Responses API, можно воспользоваться [**прокси &lt;&lt;&lt;INL_2>>> от Hugging Face**](https://github.com/huggingface/responses.js), который конвертирует Chat Completions в Responses API.

Для базовых сценариев вы также можете [**запустить наш пример Python-сервера с Ollama в качестве бэкенда.**](https://github.com/openai/gpt-oss?tab=readme-ov-file#responses-api) Этот сервер представляет собой упрощённый пример и не содержит

&lt;&lt;&lt;CODE_4>>>

## Интеграция с Agents SDK

Хотите использовать gpt-oss с OpenAI **Agents SDK**?

Обе версии Agents SDK позволяют переопределить базовый клиент OpenAI, указав Ollama для Chat Completions или ваш Responses.js прокси для локальных моделей. В качестве альтернативы можно использовать встроенные возможности для подключения Agents SDK к моделям сторонних разработчиков.

- **Python:** Используйте [LiteLLM](https://openai.github.io/openai-agents-python/models/litellm/) для проксирования к Ollama через LiteLLM
- **TypeScript:** Используйте [AI SDK](https://openai.github.io/openai-agents-js/extensions/ai-sdk/) с [адаптером ollama](https://ai-sdk.dev/providers/community-providers/ollama)

Вот пример использования Python Agents SDK с LiteLLM:

&lt;&lt;&lt;CODE_5>>>