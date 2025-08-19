---
lang: ru
translationOf: openai-cookbook
---

# Как запустить gpt-oss локально с Ollama

Хотите запустить [**OpenAI gpt-oss**](https://openai.com/open-models) на своем собственном железе? Это руководство покажет, как использовать [Ollama](https://ollama.ai) для локального запуска **gpt-oss-20b** или **gpt-oss-120b**, чтобы общаться с моделью офлайн, использовать её через API и даже подключать к Agents SDK.

Обратите внимание, что это руководство предназначено для пользовательского оборудования, например, запуска модели на ПК или Mac. Для серверных приложений с выделенными GPU, такими как NVIDIA H100, [ознакомьтесь с нашим руководством по vLLM](https://cookbook.openai.com/articles/gpt-oss/run-vllm).

## Выберите модель

Ollama поддерживает обе версии модели gpt-oss:

- **&lt;&lt;&lt;INL_0>>>**
  - Меньшая модель
  - Лучшее использование при **≥16 ГБ VRAM** или **объединённой памяти**
  - Отлично подходит для высокопроизводительных потребительских GPU или Mac на Apple Silicon
- **&lt;&lt;&lt;INL_1>>>**
  - Полноразмерная большая модель
  - Лучшее использование при **≥60 ГБ VRAM** или **объединённой памяти**
  - Идеальна для мульти-GPU конфигураций или мощных рабочих станций

**Пара примечаний:**

- Эти модели поставляются с **MXFP4 квантованием** из коробки, других вариантов квантования на данный момент нет
- Вы _можете_ выгружать вычисления на ЦПУ, если не хватает VRAM, но ожидайте более низкой скорости работы.

## Быстрая настройка

1. **Установите Ollama** → [Скачать здесь](https://ollama.com/download)
2. **Загрузите нужную модель:**

&lt;&lt;&lt;CODE_0>>>

## Общение с gpt-oss

Готовы поговорить с моделью? Запустите чат в приложении или терминале:

&lt;&lt;&lt;CODE_1>>>

Ollama применяет **чат-шаблон** по умолчанию, имитирующий [формат OpenAI harmony](https://cookbook.openai.com/articles/openai-harmony). Введите сообщение и начните разговор.

## Использование API

Ollama предоставляет API, совместимый с **Chat Completions**, поэтому вы можете использовать OpenAI SDK практически без изменений. Пример на Python:

&lt;&lt;&lt;CODE_2>>>

Если вы уже работали с OpenAI SDK, всё будет выглядеть очень знакомо.

Также вы можете напрямую использовать Ollama SDK для [Python](https://github.com/ollama/ollama-python) или [JavaScript](https://github.com/ollama/ollama-js).

## Использование инструментов (вызов функций)

Ollama умеет:

- Вызывать функции
- Использовать **встроенный браузерный инструмент** (в приложении)

Пример вызова функции через Chat Completions:

&lt;&lt;&lt;CODE_3>>>

Поскольку модели могут вызывать инструменты в процессе рассуждений (chain-of-thought, CoT), важно возвращать рассуждения, полученные от API, обратно в следующий вызов функции, где предоставляется ответ, чтобы модель могла прийти к окончательному решению.

## Обходные пути для Responses API

Ollama пока **не поддерживает Responses API** нативно.

Если вы хотите использовать Responses API, можно применить [**прокси Hugging Face’s &lt;&lt;&lt;INL_2>>>**](https://github.com/huggingface/responses.js), преобразующий Chat Completions в Responses API.

Для базовых сценариев также можно [**запустить наш пример Python-сервера с Ollama в качестве бэкенда.**](https://github.com/openai/gpt-oss?tab=readme-ov-file#responses-api) Этот сервер — простой пример сервера и не имеет

&lt;&lt;&lt;CODE_4>>>

## Интеграция с Agents SDK

Хотите использовать gpt-oss с OpenAI **Agents SDK**?

Обе версии Agents SDK позволяют переопределить базовый клиент OpenAI, чтобы направлять запросы в Ollama через Chat Completions или через ваш Responses.js прокси для локальных моделей. Кроме того, встроенный функционал позволяет направлять Agents SDK на сторонние модели.

- **Python:** используйте [LiteLLM](https://openai.github.io/openai-agents-python/models/litellm/), который проксирует запросы в Ollama через LiteLLM
- **TypeScript:** используйте [AI SDK](https://openai.github.io/openai-agents-js/extensions/ai-sdk/) с [адаптером для ollama](https://ai-sdk.dev/providers/community-providers/ollama)

Пример использования Agents SDK на Python с LiteLLM:

&lt;&lt;&lt;CODE_5>>>