import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import SearchBar from "@theme/SearchBar";

export default function Home() {
  return (
    <Layout
      title="Русская энциклопедия ChatGPT"
      description="OpenAI Cookbook на русском — статьи, гайды и лучшие практики для работы с моделями OpenAI"
    >
      <main>
        {/* HERO */}
        <section className="homeHero">
          <div className="container">
            <h1 className="homeHero__title">
              OpenAI Cookbook <span className="homeHero__badge">RU</span>
            </h1>
            <p className="homeHero__subtitle">
              Большая энциклопедия по ChatGPT и API OpenAI: примеры, лучшие
              практики, готовые рецепты.
            </p>

            <div className="homeHero__search">
              <SearchBar />
            </div>

            <div className="homeHero__cta">
              <Link
                className="button button--primary button--lg"
                to="/docs/cookbook/"
              >
                Начать читать
              </Link>
              <Link
                className="button button--secondary button--lg"
                to="/about-license"
              >
                Об источнике
              </Link>
            </div>
          </div>
        </section>

        {/* РАЗДЕЛЫ / КАРТОЧКИ */}
        <section className="section section--padded">
          <div className="container">
            <h2 className="section__title">Популярные разделы</h2>
            <div className="cards">
              <Card
                title="Быстрый старт"
                desc="Как работать с LLM: основы, подходы и подводные камни."
                to="/docs/cookbook/articles/how_to_work_with_large_language_models"
                emoji="🚀"
              />
              <Card
                title="Генерация и верификация"
                desc="Сырые цепочки рассуждений, проверка реализаций."
                to="/docs/cookbook/articles/gpt-oss/handle-raw-cot"
                emoji="🧪"
              />
              <Card
                title="Локальные модели (vLLM)"
                desc="Запуск vLLM и работа с ускорителями."
                to="/docs/cookbook/articles/gpt-oss/run-vllm"
                emoji="💻"
              />
              <Card
                title="Transformers"
                desc="Примеры запуска и тонкости использования Transformers."
                to="/docs/cookbook/articles/gpt-oss/run-transformers"
                emoji="🧠"
              />
              <Card
                title="Ollama"
                desc="Локально и просто: управление моделями через Ollama."
                to="/docs/cookbook/articles/gpt-oss/run-locally-ollama"
                emoji="🧰"
              />
              <Card
                title="Качество документации"
                desc="Что делает документацию хорошей — теория и практика."
                to="/docs/cookbook/articles/what_makes_documentation_good"
                emoji="📚"
              />
            </div>
          </div>
        </section>

        {/* ССЫЛКИ / ПРОДОЛЖЕНИЕ */}
        <section className="section section--soft">
          <div className="container row">
            <div className="col col--6">
              <div className="panel">
                <h3>Все статьи</h3>
                <p>
                  Полный список материалов доступен в разделе «Книга рецептов».
                </p>
                <Link className="button button--primary" to="/docs/cookbook/">
                  Перейти к списку
                </Link>
              </div>
            </div>
            <div className="col col--6">
              <div className="panel">
                <h3>Лицензия и источник</h3>
                <p>
                  Мы синхронизируемся с открытым репозиторием OpenAI Cookbook.
                </p>
                <Link className="button button--secondary" to="/about-license">
                  Подробнее
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

function Card({
  title,
  desc,
  to,
  emoji,
}: {
  title: string;
  desc: string;
  to: string;
  emoji?: string;
}) {
  return (
    <Link to={to} className="cardLink">
      <article className="card card--hover">
        <div className="card__body">
          <div className="card__emoji" aria-hidden>
            {emoji || "📄"}
          </div>
          <h3 className="card__title">{title}</h3>
          <p className="card__desc">{desc}</p>
        </div>
        <div className="card__footer">
          <span className="card__more">Читать →</span>
        </div>
      </article>
    </Link>
  );
}
