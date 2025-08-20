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

/* === CONFIG === */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Где лежат ОРИГИНАЛЫ (EN) и куда писать RU
const SRC_DIRS = ['content/en/articles'];
const OUT_DIR = 'docs/cookbook';

// Откуда брать картинки и куда их класть
const IMG_SRC_DIRS = [
    'content/en/images',
    'content/en/static-images',
];
const IMG_DST_DIR = 'static/cookbook-images';

// Настройки
const SKIP_TRANSLATE = process.env.SKIP_TRANSLATE === '1';   // для отладки
const MAX_TRANSLATE = parseInt(process.env.MAX_TRANSLATE || '0', 10); // 0 = без лимита
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '3', 10);
const MAX_FILE_KB = parseInt(process.env.MAX_FILE_KB || '0', 10); // 0 = не ограничивать
const EXCLUDE = (process.env.EXCLUDE_GLOBS || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

ensureDir(OUT_DIR);
ensureDir(IMG_DST_DIR);
ensureDir('scripts/cache');

/* === UTILS === */
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

function readFileSafe(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function copyFileSafe(src, dst) {
    ensureDir(path.dirname(dst));
    try { fs.copyFileSync(src, dst); } catch { }
}

function findExistingImage(relFrom, rawUrl) {
    if (!rawUrl) return null;
    const url = rawUrl.trim().replace(/^<|>$/g, '').replace(/^["']|["']$/g, '');
    const cleaned = url.replace(/^(?:\.\/|\/)/, ''); // ./a/b.png -> a/b.png

    // Возможные места, где лежит исходная картинка
    const candidates = [
        path.resolve(relFrom, url), // рядом с файлом
        ...IMG_SRC_DIRS.map(base => path.resolve(base, cleaned.replace(/^(?:static|docs)\/images\//, ''))),
    ];
    const abs = candidates.find(p => fs.existsSync(p));
    if (!abs) return null;

    const fileName = path.basename(abs);
    const dst = path.join(IMG_DST_DIR, fileName);
    copyFileSafe(abs, dst);
    return `/cookbook-images/${fileName}`;
}

// Переписать ссылки на картинки (Markdown и <img>) с копированием в static/cookbook-images
function rewriteImageLinks(md, relFrom) {
    let out = md;

    out = out.replace(
        /!\[([^\]]*)\]\(((?<url>\.{1,2}\/[^)\s>]+|(?:\/|\.{0,2}\/)?(?:static|docs)\/images\/[^)\s>]+|<[^)]+>))(?<title>\s+"[^"]*"|\s+'[^']*')?\)/gi,
        (m, alt, _url, _title, groups) => {
            const mapped = findExistingImage(relFrom, groups?.url || _url);
            return mapped ? `![${alt}](${mapped}${groups?.title || ''})` : m;
        }
    );

    out = out.replace(
        /<img\s+([^>]*?)src=["']((?:\.{1,2}\/|\/)?(?:static|docs)\/images\/[^"']+|(?:\.{1,2}\/)[^"']+)["']([^>]*)>/gi,
        (m, pre, src, post) => {
            const mapped = findExistingImage(relFrom, src);
            return mapped ? `<img ${pre}src="${mapped}"${post}>` : m;
        }
    );

    return out;
}

// Санитайз под MDX v2 (только опасные случаи)
function sanitizeMDX(text) {
    const codeBlocks = [];
    let t = text.replace(/```[\s\S]*?```/g, block => {
        const key = `<<<FENCE_${codeBlocks.length}>>>`;
        codeBlocks.push(block);
        return key;
    });

    // самозакрывающиеся
    t = t.replace(/<br\s*>/gi, '<br />');
    t = t.replace(/<hr\s*>/gi, '<hr />');

    // автоссылки <https://...> -> [https://...](https://...)
    t = t.replace(/<((https?:\/\/)[^>\s]+)>/gi, (m, url) => `[${url}](${url})`);

    // экранируем любые "<" вне разрешённых HTML-тегов
    t = t.replace(/<(?!\/?(?:a|br|hr|img|p|div|span|strong|em|code|pre|ul|ol|li|table|thead|tbody|tr|td|th|sup|sub|blockquote|details|summary|h[1-6])\b)/gi, '&lt;');
    t = t.replace(/<\/(?=>)/g, '&lt;/');

    codeBlocks.forEach((blk, i) => { t = t.replaceAll(`<<<FENCE_${i}>>>`, blk); });
    return t;
}

/* === PROTECT / RESTORE === */
// Защищаем:
//  - fenced code ``` ... ```
//  - inline code `...`
//  - <code>...</code> и <pre>...</pre>
function protectSegments(md) {
    const fences = [];
    let tmp = md.replace(/```[\s\S]*?```/g, m => {
        const i = fences.length; fences.push(m);
        return `<<<FENCE_${i}>>>`;
    });

    const htmlCodes = [];
    tmp = tmp.replace(/<(code|pre)>([\s\S]*?)<\/\1>/gi, m => {
        const i = htmlCodes.length; htmlCodes.push(m);
        return `<<<HTMLCODE_${i}>>>`;
    });

    const inlines = [];
    // теперь безопасно выцеплять `...` — внутри fenced уже нет бэктиков
    tmp = tmp.replace(/`([^`\n]+)`/g, (m) => {
        const i = inlines.length; inlines.push(m);
        return `<<<INLINE_${i}>>>`;
    });

    return { tmp, fences, inlines, htmlCodes };
}

function restoreSegments(text, bags) {
    let out = text;
    bags.inlines.forEach((v, i) => { out = out.replaceAll(`<<<INLINE_${i}>>>`, v); });
    bags.htmlCodes.forEach((v, i) => { out = out.replaceAll(`<<<HTMLCODE_${i}>>>`, v); });
    bags.fences.forEach((v, i) => { out = out.replaceAll(`<<<FENCE_${i}>>>`, v); });
    // На всякий — выметаем любые уцелевшие INL/CODE плейсхолдеры
    out = out.replace(/<<<(?:INL|CODE)_(\d+)>>>/g, '');
    return out;
}

/* === OPENAI TRANSLATE === */
async function translateTextOnly(md) {
    if (!client || SKIP_TRANSLATE) return md;

    const { tmp, fences, inlines, htmlCodes } = protectSegments(md);

    const system = `Ты — опытный технический переводчик (EN→RU).
Сохраняй структуру Markdown/MDX, заголовки, списки, таблицы.
СОВЕРШЕННО НЕ ТРОГАЙ токены вида <<<FENCE_#>>>, <<<INLINE_#>>>, <<<HTMLCODE_#>>> — это код/разметка.
Не изменяй ссылки и URLы. Переводи только текст между ними.`;
    const user = `Переведи на русский только текстовую часть следующего Markdown/MDX. 
Не изменяй и не удаляй токены-защиты и разметку.

${tmp}`;

    const resp = await client.responses.create({
        model: 'gpt-4.1-mini',
        input: [
            { role: 'system', content: system },
            { role: 'user', content: user },
        ],
    });

    let out = resp.output_text || tmp;
    out = restoreSegments(out, { fences, inlines, htmlCodes });
    return out;
}

/* === PROCESS ONE FILE === */
async function processFile(srcPath) {
    const raw = fs.readFileSync(srcPath, 'utf8');
    const stat = fs.statSync(srcPath);
    const relFrom = path.dirname(srcPath);
    const { data: fm = {}, content = '' } = matter(raw);

    // кеш по содержимому
    const key = sha256(raw);
    const cacheFile = path.join('scripts', 'cache', `${key}.mdx`);
    if (fs.existsSync(cacheFile)) {
        return fs.readFileSync(cacheFile, 'utf8');
    }

    // большой файл? можно не переводить (опция)
    let body = content;
    if (MAX_FILE_KB > 0 && stat.size > MAX_FILE_KB * 1024) {
        body = rewriteImageLinks(body, relFrom);
    } else {
        const translated = await translateTextOnly(body);
        body = rewriteImageLinks(translated, relFrom);
    }

    const sanitized = sanitizeMDX(body);
    const newFm = { ...fm, lang: 'ru', translationOf: 'openai-cookbook' };
    const fmStr = '---\n' + yaml.dump(newFm) + '---\n\n';
    const result = fmStr + sanitized;

    fs.writeFileSync(cacheFile, result, 'utf8');
    return result;
}

/* === MAIN === */
(async () => {
    const spinner = ora('Scanning originals…').start();
    const patterns = SRC_DIRS.map(d => `${d}/**/*.{md,mdx}`);
    const all = await globby(patterns, { gitignore: false, ignore: EXCLUDE });
    spinner.succeed(`Found ${all.length} files`);

    const list = MAX_TRANSLATE > 0 ? all.slice(0, MAX_TRANSLATE) : all;
    const limit = pLimit(CONCURRENCY);
    let ok = 0;

    await Promise.all(list.map(f => limit(async () => {
        const rel = f.replace(/^content\/en\//, '');
        const outPath = path.join(OUT_DIR, rel);
        ensureDir(path.dirname(outPath));
        const text = await processFile(f);
        fs.writeFileSync(outPath, text, 'utf8');
        process.stdout.write(gray(`✔ ${rel}\n`));
        ok++;
    })));

    console.log(green(`\nDone. Generated ${ok} files in ${OUT_DIR}\n`));
})().catch(e => {
    console.error(yellow('Translation failed:'), e);
    process.exit(1);
});
