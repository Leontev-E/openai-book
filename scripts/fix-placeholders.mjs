// scripts/fix-placeholders.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RU_ROOT = path.resolve(process.cwd(), 'docs', 'cookbook');
const UPSTREAM_ROOT = path.resolve(process.cwd(), 'upstream'); // upstream/articles/...

// Те HTML-теги, которые MDX может спокойно есть (не трогаем)
const ALLOWED = new Set([
    'a', 'br', 'hr', 'img', 'p', 'div', 'span', 'strong', 'em', 'code', 'pre',
    'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'sup', 'sub',
    'blockquote', 'details', 'summary', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
]);

function htmlEscape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function readOrNull(p) {
    try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function listRuFiles(dir) {
    const out = [];
    (function walk(d) {
        for (const name of fs.readdirSync(d)) {
            const p = path.join(d, name);
            const st = fs.statSync(p);
            if (st.isDirectory()) walk(p);
            else if (/\.(md|mdx)$/i.test(name)) out.push(p);
        }
    })(dir);
    return out;
}

function extractCodeBlocks(md) {
    const blocks = [];
    const re = /```[\s\S]*?```/g;
    let m;
    while ((m = re.exec(md)) !== null) blocks.push(m[0]);
    return blocks;
}

// Достаём «опасные» inline-теги из оригинала в порядке появления
function extractInlineUnsafe(md) {
    const toks = [];
    const re = /<[^>]+>/g;
    let m;
    while ((m = re.exec(md)) !== null) {
        const tag = m[0];
        const nm = (tag.match(/^<\/?\s*([a-zA-Z][\w:-]*)/) || [, ''])[1].toLowerCase();
        // если это "обычный" допустимый тег — пропускаем
        if (ALLOWED.has(nm)) continue;
        // иначе сохраняем весь фрагмент, как он есть (потом экранируем)
        toks.push(tag);
    }
    return toks;
}

function normalizePlaceholders(text) {
    // Превратим HTML-экранированные плейсхолдеры в обычные, чтобы легче заменить
    return text
        .replace(/&lt;&lt;&lt;(CODE|INL)_(\d+)&gt;>>/g, '<<<$1_$2>>>')
        .replace(/<<<(CODE|INL)\s*_(\d+)>>>/g, '<<<$1_$2>>>'); // на всякий — убираем возможные пробелы
}

function mapRuToUpstreamPath(ruFile) {
    // docs/cookbook/articles/... -> upstream/articles/...
    const rel = path.relative(RU_ROOT, ruFile).replace(/\\/g, '/');
    return path.join(UPSTREAM_ROOT, rel); // там точно такая же структура под articles/
}

let fixedFiles = 0;
let fixedCodes = 0;
let fixedInls = 0;

for (const ruFile of listRuFiles(RU_ROOT)) {
    let ru = readOrNull(ruFile);
    if (!ru) continue;

    // Быстрый тест — есть ли плейсхолдеры
    if (!/<<<(?:CODE|INL)_\d+>>>|&lt;&lt;&lt;(?:CODE|INL)_\d+&gt;>>/.test(ru)) continue;

    const upstreamFile = mapRuToUpstreamPath(ruFile);
    const upstream = readOrNull(upstreamFile);
    if (!upstream) {
        console.warn(`[WARN] Upstream not found for ${ruFile} -> ${upstreamFile}`);
        continue;
    }

    ru = normalizePlaceholders(ru);

    // 1) CODE блоки
    const codePh = [...ru.matchAll(/<<<CODE_(\d+)>>>/g)].map(m => parseInt(m[1], 10));
    if (codePh.length) {
        const codeBlocks = extractCodeBlocks(upstream);
        // заменяем по индексу
        for (const i of codePh) {
            if (codeBlocks[i] !== undefined) {
                ru = ru.replaceAll(`<<<CODE_${i}>>>`, codeBlocks[i]);
                fixedCodes++;
            } else {
                console.warn(`[WARN] Missing upstream code block #${i} for ${ruFile}`);
            }
        }
    }

    // 2) INL фрагменты (опасные теги) — вставляем ЭКРАНИРОВАННЫЕ
    const inlPh = [...ru.matchAll(/<<<INL_(\d+)>>>/g)].map(m => parseInt(m[1], 10));
    if (inlPh.length) {
        const inlTokens = extractInlineUnsafe(upstream);
        for (const i of inlPh) {
            if (inlTokens[i] !== undefined) {
                ru = ru.replaceAll(`<<<INL_${i}>>>`, htmlEscape(inlTokens[i]));
                fixedInls++;
            } else {
                console.warn(`[WARN] Missing upstream inline token #${i} for ${ruFile}`);
            }
        }
    }

    fs.writeFileSync(ruFile, ru, 'utf8');
    fixedFiles++;
    console.log(`✔ fixed ${path.relative(process.cwd(), ruFile)}`);
}

console.log(`\nDone. Fixed files: ${fixedFiles}, code blocks: ${fixedCodes}, inline tokens: ${fixedInls}\n`);
