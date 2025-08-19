// scripts/translate.mjs
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

/* ---------- Защита кода ---------- */

// Вырезает fenced-блоки ```lang ... ``` и заменяет на <<<CODE_i>>>
function protectFencedCode(text) {
    const blocks = [];
    const fenced = /```([a-zA-Z0-9_.+\-]*)[ \t]*\n([\s\S]*?)\n```/g; // нежадный
    const masked = text.replace(fenced, (_m, lang = '', body) => {
        const i = blocks.length;
        blocks.push({ lang: (lang || '').trim(), body });
        return `<<<CODE_${i}>>>`;
    });
    return { masked, blocks };
}
function restoreFencedCode(text, blocks) {
    return text.replace(/<<<CODE_(\d+)>>>/g, (_m, n) => {
        const i = Number(n);
        const b = blocks[i];
        if (!b) return _m;
        const lang = b.lang ? b.lang : '';
        const code = (b.body ?? '').replace(/\s+$/, '');
        return `\`\`\`${lang}\n${code}\n\`\`\``;
    });
}

// Вырезает инлайн-код `...` и заменяет на <<<INL_i>>>
function protectInlineCode(text) {
    const blocks = [];
    const masked = text.replace(/`([^`\n]+?)`/g, (_m, body) => {
        const i = blocks.length;
        blocks.push(body);
        return `<<<INL_${i}>>>`;
    });
    return { masked, blocks };
}
function restoreInlineCode(text, blocks) {
    return text.replace(/<<<INL_(\d+)>>>/g, (_m, n) => {
        const i = Number(n);
        const body = blocks[i];
        if (body == null) return _m;
        return '`' + body + '`';
    });
}

/* ---------- Переписывание картинок ---------- */
/**
 * Переписываем ссылки на изображения:
 *  - относительные ./ и ../ → копируем в /static/cookbook-images/ с префиксом-хэшем
 *  - пути вида static/images/... и docs/images/... → копируем в /static/cookbook-images/<тот_же_подпуть>
 *  - HTML <img src="..."> тоже поддерживается
 */
function rewriteImageLinks(md, relFrom) {
    function copyAndMap(srcPathRaw) {
        if (!srcPathRaw) return null;

        // убрать <...> и кавычки, ведущие/хвостовые пробелы
        let u = srcPathRaw.trim().replace(/^<|>$/g, '').replace(/^["']|["']$/g, '');

        // если абсолютная http(s) — не трогаем
        if (/^https?:\/\//i.test(u)) return u;

        // убрать ведущие ./ или /
        const cleaned = u.replace(/^(?:\.\/|\/)/, '');

        // если путь начинается с static/images или docs/images — сохраним подпапку
        const m = cleaned.match(/^(?:static|docs)\/images\/(.+)/i);
        if (m) {
            const afterImages = m[1]; // напр. dalle_3/dalle_3_improved_prompts.png
            const candidates = [
                path.resolve('upstream/images', afterImages),
                path.resolve('upstream/static/images', afterImages),
            ];
            const abs = candidates.find(p => fs.existsSync(p));
            if (!abs) return null;

            const dstRel = afterImages.replace(/\\/g, '/'); // нормализованный подпуть
            const dstAbs = path.join(STATIC_IMG_DST, dstRel);
            ensureDir(path.dirname(dstAbs));
            try { fs.copyFileSync(abs, dstAbs); } catch { }
            return `/cookbook-images/${dstRel}`;
        }

        // иначе считаем относительным путём рядом с исходником
        const absRel = path.resolve(relFrom, u);
        if (!fs.existsSync(absRel)) return null;

        const base = path.basename(absRel);
        const suffix = sha256(absRel).slice(0, 8);
        const dstName = `${suffix}_${base}`;
        const dstAbs = path.join(STATIC_IMG_DST, dstName);
        try { fs.copyFileSync(absRel, dstAbs); } catch { }
        return `/cookbook-images/${dstName}`;
    }

    let out = md;

    // Markdown: ![alt](./rel.png "title")
    out = out.replace(
        /!\[([^\]]*)\]\(((?<url>\.{1,2}\/[^)\s>]+))(?<title>\s+"[^"]*"|\s+'[^']*')?\)/g,
        (m, alt, _url, _title, groups) => {
            const mapped = copyAndMap(groups?.url || _url);
            return mapped ? `![${alt}](${mapped}${groups?.title || ''})` : m;
        }
    );

    // Markdown: ![alt](static/images/... | docs/images/...)
    out = out.replace(
        /!\[([^\]]*)\]\(((?<url>(?:\/|\.{0,2}\/)?(?:(?:static|docs)\/images\/[^)\s>]+|<[^)]+>)))(?<title>\s+"[^"]*"|\s+'[^']*')?\)/gi,
        (m, alt, _url, _title, groups) => {
            const mapped = copyAndMap(groups?.url || _url);
            return mapped ? `![${alt}](${mapped}${groups?.title || ''})` : m;
        }
    );

    // HTML <img src="./...">
    out = out.replace(
        /<img\s+([^>]*?)src=["']((?:\.{1,2}\/)[^"']+)["']([^>]*)>/gi,
        (m, pre, rel, post) => {
            const mapped = copyAndMap(rel);
            return mapped ? `<img ${pre}src="${mapped}"${post}>` : m;
        }
    );

    // HTML <img src="/static|static|docs/images/...">
    out = out.replace(
        /<img\s+([^>]*?)src=["']((?:\/|\.{0,2}\/)?(?:static|docs)\/images\/[^"']+)["']([^>]*)>/gi,
        (m, pre, rel, post) => {
            const mapped = copyAndMap(rel);
            return mapped ? `<img ${pre}src="${mapped}"${post}>` : m;
        }
    );

    return out;
}

/* ---------- Переписывание ссылок на ноутбуки ---------- */
/**
 * ../examples/XYZ.ipynb → https://github.com/openai/openai-cookbook/blob/main/examples/XYZ.ipynb
 */
function rewriteNotebookLinks(md) {
    const GH = 'https://github.com/openai/openai-cookbook/blob/main/examples/';
    // [text](../examples/....ipynb)
    let out = md.replace(
        /\]\(\.{2}\/examples\/([^)\s#]+?\.ipynb)(#[^)]+)?\)/gi,
        (m, rel, hash = '') => `](${GH}${rel}${hash || ''})`
    );
    // [text](../../examples/....ipynb)
    out = out.replace(
        /\]\(\.{2,}\/examples\/([^)\s#]+?\.ipynb)(#[^)]+)?\)/gi,
        (m, rel, hash = '') => `](${GH}${rel}${hash || ''})`
    );
    return out;
}

/* ---------- Санитайзер под MDX v2 ---------- */
/**
 * - самозакрывающиеся <br/> <hr/>
 * - <https://...> → [https://...](https://...)
 * - экранирование чуждых JSX-тегов/плейсхолдеров
 * - аккуратно, без изменений внутри кода (мы его уже спрятали раньше)
 */
function sanitizeMDX(text) {
    // защитим fenced-код и инлайн-код (доп. страховка)
    const f = protectFencedCode(text);
    const i = protectInlineCode(f.masked);
    let t = i.masked;

    // 1) <br>, <hr>
    t = t.replace(/<br\s*>/gi, '<br />');
    t = t.replace(/<hr\s*>/gi, '<hr />');

    // 2) автоссылки <https://...>
    t = t.replace(/<((https?:\/\/)[^>\s]+)>/gi, (_m, url) => `[${url}](${url})`);

    // 3) пустые <>, и подозрительные с '/'
    t = t.replace(/<>/g, '&lt;&gt;');
    t = t.replace(/<([^ >]+\/[^>]+)>/g, (_m, inner) => `&lt;${inner}&gt;`);

    // 4) <число...>
    t = t.replace(/<\d[^>]*>/g, m => m.replace('<', '&lt;').replace('>', '&gt;'));

    // 5) общий фильтр: экранируем всё, что не является допустимым HTML-тегом
    const allowed = '(a|br|hr|img|p|div|span|strong|em|code|pre|ul|ol|li|table|thead|tbody|tr|td|th|sup|sub|blockquote|details|summary|h[1-6])';
    t = t.replace(new RegExp(`<(?!(?:/${allowed}|${allowed})\\b)`, 'gi'), '&lt;');

    // вернуть инлайн-код и fenced-код
    t = restoreInlineCode(t, i.blocks);
    t = restoreFencedCode(t, f.blocks);
    return t;
}

/* ---------- Перевод ---------- */
async function translateMarkdownPreservingCode(md) {
    if (!client || SKIP_TRANSLATE) return md;

    // 1) спрячем код (fenced + inline)
    const f = protectFencedCode(md);
    const i = protectInlineCode(f.masked);

    // 2) система перевода
    const system = `Ты — профессиональный технический переводчик (EN→RU).
- Сохраняй структуру Markdown/MDX и форматирование.
- НЕ переводить кодовые блоки, команды, пути, имена пакетов и инлайн-код в \`backticks\`.
- Сохраняй ссылки и якори, не ломай относительные пути.`;

    const user = `Переведи на русский следующий Markdown/MDX (кодовые блоки и инлайн-код помечены плейсхолдерами и переводить их НЕ нужно):
${i.masked}`;

    const resp = await client.responses.create({
        model: 'gpt-4.1-mini',
        input: [
            { role: 'system', content: system },
            { role: 'user', content: user },
        ],
    });

    let out = resp.output_text || i.masked;

    // 3) вернём инлайн-код, затем fenced-код
    out = restoreInlineCode(out, i.blocks);
    out = restoreFencedCode(out, f.blocks);

    return out;
}

/* ---------- Обработка одного файла ---------- */
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

    // лимит размера (если задан) — большие публикуем без перевода (но с переписью картинок/ссылок/санитайзом)
    let body = content;
    if (MAX_FILE_KB > 0 && stat.size > MAX_FILE_KB * 1024) {
        body = rewriteImageLinks(body, relFrom);
        body = rewriteNotebookLinks(body);
    } else {
        const translated = await translateMarkdownPreservingCode(body);
        body = rewriteImageLinks(translated, relFrom);
        body = rewriteNotebookLinks(body);
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
    // отключаем gitignore (чтобы видеть upstream/), учитываем EXCLUDE
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
