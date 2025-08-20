// src/pages/cookbook/index.tsx
import React, { useEffect } from "react";

export default function CookbookRedirect() {
  useEffect(() => {
    // сюда ставим конечный URL каталога в /static
    window.location.replace("/articles/articles/");
  }, []);

  // можно отрисовать заглушку на долю секунды
  return (
    <div style={{ padding: 24 }}>Перенаправляю на оригинальный Cookbook…</div>
  );
}
