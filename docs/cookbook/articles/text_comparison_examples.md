---
lang: ru
translationOf: openai-cookbook
---

# Примеры сравнения текстов

[Точка доступа embeddings OpenAI API](https://beta.openai.com/docs/guides/embeddings) может использоваться для измерения сходства или близости между текстами.

Используя понимание текста GPT-3, эти embeddings [достигли передовых результатов](https://arxiv.org/abs/2201.10005) на бенчмарках в задачах обучения без учителя и переноса знаний.

Embeddings могут применяться для семантического поиска, рекомендаций, кластерного анализа, обнаружения практически дублирующихся текстов и многого другого.

Для дополнительной информации ознакомьтесь с анонсами в блоге OpenAI:

- [Введение текстовых и кодовых embeddings (январь 2022)](https://openai.com/blog/introducing-text-and-code-embeddings/)
- [Новая и улучшенная модель embeddings (декабрь 2022)](https://openai.com/blog/new-and-improved-embedding-model/)

Для сравнения с другими моделями embeddings смотрите [Таблицу лидеров Massive Text Embedding Benchmark (MTEB)](https://huggingface.co/spaces/mteb/leaderboard).

## Семантический поиск

Embeddings можно использовать для поиска как самостоятельно, так и в составе более сложных систем.

Самый простой способ применения embeddings для поиска таков:

- Перед поиском (предварительный расчет):
  - Разбейте корпус текстов на фрагменты меньше максимального лимита токенов (8,191 токен для &lt;&lt;&lt;INL_0>>>)
  - Получите embeddings для каждого фрагмента текста
  - Сохраните эти embeddings в собственной базе данных или через провайдеров векторного поиска, таких как [Pinecone](https://www.pinecone.io), [Weaviate](https://weaviate.io) или [Qdrant](https://qdrant.tech)
- Во время поиска (вычисление онлайн):
  - Получите embedding для поискового запроса
  - Найдите ближайшие embeddings в вашей базе данных
  - Верните топ результатов

Пример использования embeddings для поиска показан в файле [Semantic_text_search_using_embeddings.ipynb](https://github.com/openai/openai-cookbook/blob/main/examples/Semantic_text_search_using_embeddings.ipynb).

В более продвинутых системах поиска косинусное сходство embeddings может использоваться как одна из множества характеристик для ранжирования результатов.

## Ответы на вопросы

Лучший способ получить надежно честные ответы от GPT-3 — дать ему исходные документы, в которых он сможет найти правильные ответы. Используя описанную выше процедуру семантического поиска, вы можете недорого искать релевантную информацию в корпусе документов и передавать её GPT-3 через prompt для ответа на вопрос. Это продемонстрировано в [Question_answering_using_embeddings.ipynb](https://github.com/openai/openai-cookbook/blob/main/examples/Question_answering_using_embeddings.ipynb).

## Рекомендации

Рекомендации очень похожи на поиск, за исключением того, что вместо свободного текстового запроса входными данными являются элементы множества.

Пример использования embeddings для рекомендаций приведён в [Recommendation_using_embeddings.ipynb](https://github.com/openai/openai-cookbook/blob/main/examples/Recommendation_using_embeddings.ipynb).

Как и в поиске, оценки косинусного сходства можно использовать как самостоятельно для ранжирования элементов, так и как признаки в более сложных алгоритмах ранжирования.

## Настройка Embeddings

Хотя веса модели embeddings OpenAI нельзя дообучать, вы всё же можете использовать обучающие данные для адаптации embeddings под ваше приложение.

В [Customizing_embeddings.ipynb](https://github.com/openai/openai-cookbook/blob/main/examples/Customizing_embeddings.ipynb) показан пример метода настройки embeddings с помощью обучающих данных. Идея метода в том, чтобы обучить пользовательскую матрицу, которая умножается на векторы embeddings для получения новых, настроенных embeddings. При наличии качественных обучающих данных эта матрица поможет выделить признаки, важные для ваших меток. Можно рассматривать умножение на матрицу как (а) модификацию embeddings или (б) модификацию функции расстояния для измерения дистанций между embeddings.