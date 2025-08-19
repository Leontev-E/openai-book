import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { globby } from 'globby';
import yaml from 'js-yaml';
import ora from 'ora';
import { gray, green, yellow } from 'kleur/colors';
import OpenAI from 'openai';
import pLimit from 'p-limit';

/* ====== ПАРАМЕТРЫ И ОКРУЖЕНИЕ ====== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const SKIP_TRANSLATE = process.env.SKIP_TRANSLATE === '1';
const MAX_TRANSLATE = parseInt(process.env.MAX_TRANSLATE || '0', 10); // 0 = без лимита
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '3', 10);
const MAX_FILE_KB = parseInt(process.env.MAX_FILE_KB || '0', 10);     // 0 = не ограничивать
const EXCLUDE = (process.env.EXCLUDE_GLOBS || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const SRC_DIRS = ['upstream/articles'];
const OUT_DIR = 'docs/cookbook';
const STATIC_IMG_DST = 'static/cookbook-images';
const CACHE_DIR = path.join('scripts', 'cache');

/* ====== УТИЛИТЫ ====== */

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDir(OUT_DIR);
ensureDir(STATIC_IMG_DST);
ensureDir(CACHE_DIR);

function sha256(s) {
    return crypto.createHash('sha256').update(s).digest('hex');
}

/**
 * Переписываем ссылки на изображения:
 *  - относительные ./ и ../ → копируем в /static/cookbook-images/
 *  - пути вида static/images/... и docs/images/... → ищем в upstream/<images|static/images>/
 */
function rewriteImageLinks(md, relFrom) {
    function copyAndMap(srcPath) {
        // убираем ./ или / в начале
        const cleaned = srcPath.replace(/^(?:\.\/|\/)/, '');
        // если это static/images/... или docs/images/..., отделим хвост после images/
        const afterImages = cleaned.replace(/^(?:static|docs)\/images\//, '');
        // кандидаты, откуда копировать
        const candidates = [
            path.resolve(relFrom, srcPath),                        // относительный путь рядом с файлом
            path.resolve('upstream/images', afterImages),          // upstream/images/...
            path.resolve('upstream/static/images', afterImages),   // upstream/static/images/...
        ];
        const abs = candidates.find(p => fs.existsSync(p));
        if (!abs) return null;

        ensureDir(STATIC_IMG_DST);
        const fileName = path.basename(abs);
        const dst = path.join(STATIC_IMG_DST, fileName);
        try { fs.copyFileSync(abs, dst); } catch { }
        return `/cookbook-images/${fileName}`;
    }

    let out = md;

    // 1) Markdown: относительные ./ и ../
    out = out.replace(
        /!\[([^\]]*)\]\(((?:\.{1,2}\/)[^\)\s]+)\)/g,
        (m, alt, rel) => {
            const mapped = copyAndMap(rel);
            return mapped ? `![${alt}](${mapped})` : m;
        }
    );

    // 2) Markdown: static/images/... или docs/images/...
    out = out.replace(
        /!\[([^\]]*)\]\(((?:\.{0,2}\/)?(?:static|docs)\/images\/[^\)\s]+)\)/gi,
        (m, alt, rel) => {
            const mapped = copyAndMap(rel);
            return mapped ? `![${alt}](${mapped})` : m;
        }
    );

    // 3) HTML <img ... src="...">: относительные ./ и ../
    out = out.replace(
        /<img\s+([^>]*?)src=["']((?:\.{1,2}\/)[^"']+)["']([^>]*)>/gi,
        (m, pre, rel, post) => {
            const mapped = copyAndMap(rel);
            return mapped ? `<img ${pre}src="${mapped}"${post}>` : m;
        }
    );

    // 4) HTML <img ... src="static/images/..."> и docs/images/...
    out = out.replace(
        /<img\s+([^>]*?)src=["']((?:\.{0,2}\/)?(?:static|docs)\/images\/[^"']+)["']([^>]*)>/gi,
        (m, pre, rel, post) => {
            const mapped = copyAndMap(rel);
            return mapped ? `<img ${pre}src="${mapped}"${post}>` : m;
        }
    );

    return out;
}

/**
 * Санитайзер под MDX v2:
 *  - самозакрывающиеся теги <br>/<hr>
 *  - автоссылки <https://...> → [https://...](https://...)
 *  - экранирование подозрительных <placeholders> (<name>, <token> и т.п.)
 *  - экранирование <> и <число...>
 *  - не трогаем кодовые блоки
 */
function sanitizeMDX(text) {
    // защитим кодовые блоки
    const codeBlocks = [];
    let t = text.replace(/```[\s\S]*?```/g, block => {
        const key = `<<<CODE_${codeBlocks.length}>>>`;
        codeBlocks.push(block);
        return key;
    });

    // 1) <br>, <hr>
    t = t.replace(/<br\s*>/gi, '<br />');
    t = t.replace(/<hr\s*>/gi, '<hr />');

    // 2) <&nbsp;> и подобные сущности в угловых
    t = t.replace(/<&([a-z]+;)>/gi, (m, ent) => `&lt;&${ent}&gt;`);

    // 3) автоссылки <https://...>
    t = t.replace(/<((https?:\/\/)[^>\s]+)>/gi, (m, url) => `[${url}](${url})`);

    // 4) фрагменты вида <.../...> (внутри слэш) → не JSX
    t = t.replace(/<([^ >]+\/[^>]+)>/g, (m, inner) => `&lt;${inner}&gt;`);

    // 5) пустые <>
    t = t.replace(/<>/g, '&lt;&gt;');

    // 6) <число...>
    t = t.replace(/<\d[^>]*>/g, m => m.replace('<', '&lt;').replace('>', '&gt;'));

    // 7) экранируем нестандартные теги-плейсхолдеры
    const allowed = new Set([
        'a', 'br', 'hr', 'img', 'p', 'div', 'span', 'strong', 'em', 'code', 'pre',
        'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'sup', 'sub',
        'blockquote', 'details', 'summary', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ]);

    // открывающие
    t = t.replace(/<([a-z][a-z0-9_-]*)(\s[^>]*)?>/gi, (m, name) => {
        return allowed.has(name.toLowerCase()) ? m : m.replace('<', '&lt;').replace('>', '&gt;');
    });
    // закрывающие
    t = t.replace(/<\/([a-z][a-z0-9_-]*)>/gi, (m, name) => {
        return allowed.has(name.toLowerCase()) ? m : m.replace('<', '&lt;').replace('>', '&gt;');
    });

    // 9) финальный ловец: любой `<`, который НЕ начинает допустимый HTML-тег — экранируем
    // оставляем только: a|br|hr|img|p|div|span|strong|em|code|pre|ul|ol|li|table|thead|tbody|tr|td|th|sup|sub|blockquote|details|summary|h1..h6
    t = t.replace(/<(?!\/?(?:a|br|hr|img|p|div|span|strong|em|code|pre|ul|ol|li|table|thead|tbody|tr|td|th|sup|sub|blockquote|details|summary|h[1-6])\b)/gi, '&lt;');

    // 10) одиночное закрытие без имени: </> → &lt;/>
    t = t.replace(/<\/(?=>)/g, '&lt;/');

    // вернём код
    codeBlocks.forEach((blk, i) => { t = t.replaceAll(`<<<CODE_${i}>>>`, blk); });
    return t;
}

/**
 * Переводим, сохраняя кодовые блоки (или пропускаем перевод)
 */
async function translateMarkdownPreservingCode(md) {
    if (!client || SKIP_TRANSLATE) return md;

    const codeBlocks = [];
    const protectedMd = md.replace(/```[\s\S]*?```/g, block => {
        const key = `<<<CODE_${codeBlocks.length}>>>`;
        codeBlocks.push(block);
        return key;
    });

    const system = `Ты — профессиональный технический переводчик (EN→RU).
- Сохраняй структуру Markdown/MDX и форматирование.
- НЕ переводить кодовые блоки, команды, пути, имена пакетов.
- Сохраняй ссылки и якори.`;

    const user = `Переведи на русский следующий Markdown/MDX, строго сохраняя разметку и не трогая кодовые блоки:
${protectedMd}`;

    const resp = await client.responses.create({
        model: 'gpt-4.1-mini',
        input: [
            { role: 'system', content: system },
            { role: 'user', content: user },
        ],
    });

    let out = resp.output_text || protectedMd;
    codeBlocks.forEach((code, i) => { out = out.replaceAll(`<<<CODE_${i}>>>`, code); });
    return out;
}

/**
 * Обработка одного файла: кэш → (перевод|копия) → картинки → санитайз → фронтматтер
 */
async function processOneFile(srcPath) {
    const stat = fs.statSync(srcPath);
    const raw = fs.readFileSync(srcPath, 'utf8');
    const relFrom = path.dirname(srcPath);
    const { data: fm = {}, content = '' } = matter(raw);

    const key = sha256(raw);
    const cacheFile = path.join(CACHE_DIR, `${key}.mdx`);
    if (fs.existsSync(cacheFile)) {
        return { rel: srcPath, text: fs.readFileSync(cacheFile, 'utf8') };
    }

    // лимит размера (если задан) — большие сначала публикуем как есть, без перевода
    let body = content;
    if (MAX_FILE_KB > 0 && stat.size > MAX_FILE_KB * 1024) {
        body = rewriteImageLinks(body, relFrom);
    } else {
        const translated = await translateMarkdownPreservingCode(body);
        body = rewriteImageLinks(translated, relFrom);
    }

    // санитайз под MDX v2
    const sanitized = sanitizeMDX(body);

    // фронтматтер
    const newFm = { ...fm, lang: 'ru', translationOf: 'openai-cookbook' };
    const fmStr = '---\n' + yaml.dump(newFm) + '---\n\n';
    const result = fmStr + sanitized;

    fs.writeFileSync(cacheFile, result, 'utf8');
    return { rel: srcPath, text: result };
}

/* ====== MAIN ====== */

(async () => {
    const spinner = ora('Scanning sources…').start();

    const patterns = SRC_DIRS.map(d => `${d}/**/*.{md,mdx}`);
    // Важно: отключаем учёт .gitignore, чтобы видеть upstream/, и поддерживаем исключения
    const allFiles = await globby(patterns, { gitignore: false, ignore: EXCLUDE });

    spinner.succeed(`Found ${allFiles.length} files`);

    const files = (MAX_TRANSLATE > 0) ? allFiles.slice(0, MAX_TRANSLATE) : allFiles;

    const limit = pLimit(CONCURRENCY);
    let ok = 0;

    await Promise.all(
        files.map(f => limit(async () => {
            const rel = f.replace(/^upstream\//, '');
            const outPath = path.join(OUT_DIR, rel);
            ensureDir(path.dirname(outPath));
            const { text } = await processOneFile(f);
            fs.writeFileSync(outPath, text, 'utf8');
            process.stdout.write(gray(`✔ ${rel}\n`));
            ok++;
        }))
    );

    console.log(green(`\nDone. Generated ${ok} files in ${OUT_DIR}\n`));
})().catch(e => {
    console.error(yellow('Translation failed:'), e);
    process.exit(1);
});
