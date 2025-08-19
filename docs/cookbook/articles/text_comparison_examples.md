---
lang: ru
translationOf: openai-cookbook
---

# Примеры сравнения текста

[Точка входа embeddings OpenAI API](https://beta.openai.com/docs/guides/embeddings) может использоваться для измерения степени связности или сходства между фрагментами текста.

Используя понимание текста GPT-3, эти embeddings [достигли передовых результатов](https://arxiv.org/abs/2201.10005) на тестовых наборах в задачах обучения без учителя и обучения переносу.

Embeddings можно использовать для семантического поиска, рекомендаций, кластерного анализа, обнаружения почти-дубликатов и многих других задач.

Для дополнительной информации прочитайте объявления в блоге OpenAI:

- [Введение Text and Code Embeddings (январь 2022)](https://openai.com/blog/introducing-text-and-code-embeddings/)
- [Новая и усовершенствованная модель embedding (декабрь 2022)](https://openai.com/blog/new-and-improved-embedding-model/)

Для сравнения с другими моделями embeddings смотрите [таблицу лидеров Massive Text Embedding Benchmark (MTEB)](https://huggingface.co/spaces/mteb/leaderboard)

## Семантический поиск

Embeddings могут использоваться для поиска как самостоятельно, так и в составе более крупной системы.

Самый простой способ использования embeddings для поиска следующий:

- Перед поиском (предварительный расчёт):
  - Разбейте корпус текста на части меньше лимита токенов (8,191 токен для &lt;&lt;&lt;INL_0>>>)
  - Создайте embedding для каждой части текста
  - Сохраните эти embeddings в собственной базе данных или у векторного поискового провайдера, например, [Pinecone](https://www.pinecone.io), [Weaviate](https://weaviate.io) или [Qdrant](https://qdrant.tech)
- Во время поиска (в реальном времени):
  - Создайте embedding для поискового запроса
  - Найдите наиболее близкие embeddings в вашей базе данных
  - Верните лучшие результаты

Пример использования embeddings для поиска показан в [Semantic_text_search_using_embeddings.ipynb](https://github.com/openai/openai-cookbook/blob/main/examples/Semantic_text_search_using_embeddings.ipynb).

В более продвинутых системах поиска косинусное сходство между embeddings может использоваться как одна из множества признаков для ранжирования результатов.

## Ответы на вопросы

Лучший способ получить надежно честные ответы от GPT-3 — предоставить ему исходные документы, в которых он может найти правильные ответы. Используя описанную выше процедуру семантического поиска, можно недорого искать нужную информацию в корпусе документов и затем передавать эту информацию GPT-3 через prompt для ответа на вопрос. Пример этого показан в [Question_answering_using_embeddings.ipynb](https://github.com/openai/openai-cookbook/blob/main/examples/Question_answering_using_embeddings.ipynb).

## Рекомендации

Рекомендации очень похожи на поиск, за исключением того, что вместо свободного текстового запроса входными данными выступают элементы набора.

Пример использования embeddings для рекомендаций показан в [Recommendation_using_embeddings.ipynb](https://github.com/openai/openai-cookbook/blob/main/examples/Recommendation_using_embeddings.ipynb).

Как и для поиска, эти оценки косинусного сходства могут использоваться либо самостоятельно для ранжирования элементов, либо как признаки в более сложных алгоритмах ранжирования.

## Настройка embeddings

Хотя веса модели embeddings OpenAI нельзя дообучать, вы всё равно можете использовать обучающие данные для настройки embeddings под ваше приложение.

В [Customizing_embeddings.ipynb](https://github.com/openai/openai-cookbook/blob/main/examples/Customizing_embeddings.ipynb) приведён пример метода настройки ваших embeddings с использованием обучающих данных. Суть метода — обучить собственную матрицу для умножения векторных embeddings с целью получения новых, кастомизированных embeddings. При наличии качественных обучающих данных эта матрица поможет выделить признаки, релевантные вашим меткам. Умножение на матрицу можно считать (a) модификацией embeddings или (b) модификацией функции расстояния, используемой для измерения расстояний между embeddings.