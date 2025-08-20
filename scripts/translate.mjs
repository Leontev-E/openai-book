// scripts/translate.mjs
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { globby } from 'globby';
import yaml from 'js-yaml';
import ora from 'ora';
import { gray, green, yellow, red } from 'kleur/colors';
import OpenAI from 'openai';
import pLimit from 'p-limit';

/* ================== CONFIG ================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Откуда брать ОРИГИНАЛЫ (EN) и куда писать RU
const SRC_DIRS = ['content/en/articles'];
const OUT_DIR = 'docs/cookbook';

// Откуда брать картинки и куда их класть
const IMG_SRC_DIRS = [
    'content/en/images',
    'content/en/static-images',
];
const IMG_DST_DIR = 'static/cookbook-images';

// Параметры
const SKIP_TRANSLATE = process.env.SKIP_TRANSLATE === '1';
const MAX_TRANSLATE = parseInt(process.env.MAX_TRANSLATE || '0', 10); // 0 = без лимита
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '3', 10);
const MAX_FILE_KB = parseInt(process.env.MAX_FILE_KB || '0', 10); // 0 = не ограничивать
const EXCLUDE = (process.env.EXCLUDE_GLOBS || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

// Директории
ensureDir(OUT_DIR);
ensureDir(IMG_DST_DIR);
ensureDir('scripts/cache');

/* ================== UTILS ================== */

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function sha256(s) {
    return crypto.createHash('sha256').update(s).digest('hex');
}
function copyFileSafe(src, dst) {
    ensureDir(path.dirname(dst));
    try { fs.copyFileSync(src, dst); } catch { /* noop */ }
}

/** Найти и скопировать картинку в IMG_DST_DIR. Возвращает веб-путь /cookbook-images/.. */
function findExistingImage(relFrom, rawUrl) {
    if (!rawUrl) return null;

    // убираем <...> и кавычки
    const url = rawUrl.trim()
        .replace(/^<|>$/g, '')
        .replace(/^["']|["']$/g, '');

    // убрать ведущие ./ или /
    const cleaned = url.replace(/^(?:\.\/|\/)/, '');

    // вынуть хвост после images/
    const afterImages = cleaned.replace(/^(?:static|docs)\//, '');

    // кандидаты: рядом с файлом, и под IMG_SRC_DIRS (включая images/* и static/images/*)
    const candidates = [
        path.resolve(relFrom, url), // рядом
        ...IMG_SRC_DIRS.map(base => path.resolve(base, cleaned)),
        ...IMG_SRC_DIRS.map(base => path.resolve(base, afterImages)),
    ];

    const abs = candidates.find(p => fs.existsSync(p));
    if (!abs) return null;

    // избегаем коллизий имён: короткий хэш пути + basename
    const base = path.basename(abs);
    const short = sha256(abs).slice(0, 10);
    const dst = path.join(IMG_DST_DIR, `${short}_${base}`);
    copyFileSafe(abs, dst);
    return `/cookbook-images/${short}_${base}`;
}

/** Переписать ссылки на картинки (Markdown + <img>) с копированием в static/cookbook-images */
function rewriteImageLinks(md, relFrom) {
    let out = md;

    // Markdown: ![alt](...)
    //  URL допускает:
    //   - ./foo.png, ../foo.png
    //   - images/foo.png (и /images/foo.png)
    //   - static/images/... и docs/images/...
    //   - <...> обёртки
    const mdImgRe = /!\[([^\]]*)\]\(((?<url>(?:<[^)]+>)|(?:(?:\.{1,2}\/|\/)?(?:images\/[^)\s>]+))|(?:(?:\.{1,2}\/|\/)?(?:static|docs)\/images\/[^)\s>]+)|(?:\.{1,2}\/[^)\s>]+)))(?<title>\s+"[^"]*"|\s+'[^']*')?\)/gi;
    out = out.replace(mdImgRe, (m, alt, _url, _title, groups) => {
        const mapped = findExistingImage(relFrom, groups?.url || _url);
        return mapped ? `![${alt}](${mapped}${groups?.title || ''})` : m;
    });

    // HTML <img src="...">
    const htmlImgRe = /<img\s+([^>]*?)src=["']((?:<[^"']+>)|(?:(?:\.{1,2}\/|\/)?images\/[^"']+)|(?:(?:\.{1,2}\/|\/)?(?:static|docs)\/images\/[^"']+)|(?:\.{1,2}\/[^"']+))["']([^>]*)>/gi;
    out = out.replace(htmlImgRe, (m, pre, src, post) => {
        const mapped = findExistingImage(relFrom, src);
        return mapped ? `<img ${pre}src="${mapped}"${post}>` : m;
    });

    return out;
}

/** Мини-санитайз под MDX v2: самозакрывающиеся теги, автоссылки, небезопасные <...> */
function sanitizeMDX(text) {
    const fences = [];
    let t = text.replace(/```[\s\S]*?```/g, block => {
        const key = `<<<FENCE_${fences.length}>>>`;
        fences.push(block);
        return key;
    });

    // самозакрывающиеся
    t = t.replace(/<br\s*>/gi, '<br />');
    t = t.replace(/<hr\s*>/gi, '<hr />');

    // автоссылки <https://...> -> [https://...](https://...)
    t = t.replace(/<((https?:\/\/)[^>\s]+)>/gi, (m, url) => `[${url}](${url})`);

    // экранируем любые "<" вне белого списка
    t = t.replace(/<(?!\/?(?:a|br|hr|img|p|div|span|strong|em|code|pre|ul|ol|li|table|thead|tbody|tr|td|th|sup|sub|blockquote|details|summary|h[1-6])\b)/gi, '&lt;');
    // одиночные закрывающие без имени
    t = t.replace(/<\/(?=>)/g, '&lt;/');

    fences.forEach((blk, i) => { t = t.replaceAll(`<<<FENCE_${i}>>>`, blk); });
    return t;
}

/** Чистим артефакты прошлых запусков: <<<CODE_n>>>, <<<INL_n>>> и их HTML-экранированные формы */
function stripLegacyPlaceholders(s) {
    // &lt;&lt;&lt;CODE_12&gt;&gt;&gt; или <<<CODE_12>>>
    return s
        .replace(/(?:&lt;){3}(?:CODE|INL)_\d+(?:&gt;){3}/gi, '')
        .replace(/<<<(?:CODE|INL)_\d+>>>/gi, '');
}

/* ============== PROTECT / RESTORE ============== */
/** Защищаем код и инлайн-код, чтобы Модель НЕ трогала их текст. */
function protectSegments(md) {
    // сперва чистим старые плейсхолдеры (на всякий)
    let tmp = stripLegacyPlaceholders(md);

    const fences = [];
    tmp = tmp.replace(/```[\s\S]*?```/g, m => {
        const i = fences.length; fences.push(m);
        return `<<<FENCE_${i}>>>`;
    });

    const htmlCodes = [];
    tmp = tmp.replace(/<(code|pre)>([\s\S]*?)<\/\1>/gi, m => {
        const i = htmlCodes.length; htmlCodes.push(m);
        return `<<<HTMLCODE_${i}>>>`;
    });

    const inlines = [];
    // после вырезания fenced можно смело матить `...`
    tmp = tmp.replace(/`([^`\n]+)`/g, m => {
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
    // подчищаем любые уцелевшие артефакты
    out = out.replace(/<<<(?:INL|CODE)_(\d+)>>>/g, '');
    return out;
}

/* ============== OPENAI TRANSLATE ============== */
async function translateTextOnly(md) {
    if (!client || SKIP_TRANSLATE) return md;

    const { tmp, fences, inlines, htmlCodes } = protectSegments(md);

    const system = `Ты — опытный технический переводчик (EN→RU).
Сохраняй структуру Markdown/MDX: заголовки, списки, таблицы, цитаты.
НИКОГДА не изменяй токены <<<FENCE_#>>>, <<<INLINE_#>>>, <<<HTMLCODE_#>>> — это код/разметка.
Не меняй ссылки, якори и URL. Переводи только обычный текст.`;

    const user = `Переведи на русский ЯЗЫКОВОЙ текст следующего Markdown/MDX.
Разметку и токены защиты оставь без изменений.

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

/* ============== PROCESS ONE FILE ============== */
async function processFile(srcPath) {
    const raw = fs.readFileSync(srcPath, 'utf8');
    const stat = fs.statSync(srcPath);
    const relFrom = path.dirname(srcPath);
    const { data: fm = {}, content = '' } = matter(raw);

    // кэш по содержимому исходника
    const key = sha256(raw);
    const cacheFile = path.join('scripts', 'cache', `${key}.mdx`);
    if (fs.existsSync(cacheFile)) {
        return fs.readFileSync(cacheFile, 'utf8');
    }

    let body = content;
    if (MAX_FILE_KB > 0 && stat.size > MAX_FILE_KB * 1024) {
        // большой файл — без перевода
        body = rewriteImageLinks(body, relFrom);
    } else {
        const translated = await translateTextOnly(body);
        body = rewriteImageLinks(translated, relFrom);
    }

    const sanitized = sanitizeMDX(body);

    // фронтматтер
    const newFm = { ...fm, lang: 'ru', translationOf: 'openai-cookbook' };
    const fmStr = '---\n' + yaml.dump(newFm) + '---\n\n';
    const result = fmStr + sanitized;

    fs.writeFileSync(cacheFile, result, 'utf8');
    return result;
}

/* ================== MAIN ================== */
(async () => {
    const spinner = ora('Scanning originals…').start();
    const patterns = SRC_DIRS.map(d => `${d}/**/*.{md,mdx}`);
    const all = await globby(patterns, { gitignore: false, ignore: EXCLUDE });
    spinner.succeed(`Found ${all.length} files`);

    const list = MAX_TRANSLATE > 0 ? all.slice(0, MAX_TRANSLATE) : all;
    const limit = pLimit(CONCURRENCY);
    let ok = 0, fail = 0;

    await Promise.all(list.map(f =>
        limit(async () => {
            try {
                const rel = f.replace(/^content\/en\//, '');
                const outPath = path.join(OUT_DIR, rel);
                ensureDir(path.dirname(outPath));
                const text = await processFile(f);
                fs.writeFileSync(outPath, text, 'utf8');
                process.stdout.write(gray(`✔ ${rel}\n`));
                ok++;
            } catch (e) {
                process.stderr.write(red(`✖ ${f}\n${e?.stack || e}\n`));
                fail++;
            }
        })
    ));

    console.log(green(`\nDone. Generated ${ok} files in ${OUT_DIR}${fail ? ` (${fail} failed)` : ''}\n`));
})().catch(e => {
    console.error(yellow('Translation failed:'), e);
    process.exit(1);
});
