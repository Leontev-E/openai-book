mkdir scripts - Force
@"
    import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { globby } from 'globby';
import yaml from 'js-yaml';
import ora from 'ora';
import { blue, gray, green, yellow } from 'kleur/colors';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const SRC_DIRS = ['upstream/articles', 'upstream/examples'];
const OUT_DIR = 'docs/cookbook';
const STATIC_IMG_DST = 'static/cookbook-images';
const CACHE_DIR = path.join('scripts', 'cache');

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
ensureDir(OUT_DIR); ensureDir(STATIC_IMG_DST); ensureDir(CACHE_DIR);

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

function copyAndRewriteImages(md, relFrom) {
    return md.replace(/!\[([^\]]*)\]\((\.{1,2}\/[^\)\s]+)\)/g, (m, alt, rel) => {
        const abs = path.resolve(relFrom, rel);
        if (!fs.existsSync(abs)) return m;
        const fileName = path.basename(abs);
        const dst = path.join(STATIC_IMG_DST, fileName);
        try { fs.copyFileSync(abs, dst); } catch { }
        return `![${alt}](/cookbook-images/${fileName})`;
    });
}

async function translatePreservingCode(md) {
    if (!client) return md; // нет ключа — вернём как есть

    const codeBlocks = [];
    const protectedMd = md.replace(/```[\s\S]*?```/g, blk => {
        const key = `<<<CODE_${codeBlocks.length}>>>`;
        codeBlocks.push(blk);
        return key;
    });

    const system = `Ты — профессиональный технический переводчик (EN→RU).
- Сохраняй структуру Markdown/MDX и форматирование.
- НЕ переводить код, имена файлов, команды.
- Сохраняй ссылки и якори.`;

    const user = `Переведи на русский (EN→RU) следующий текст Markdown/MDX.
Не изменяй код и синтаксис MDX. Текст ниже:
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

async function processFile(srcPath) {
    const raw = fs.readFileSync(srcPath, 'utf8');
    const relFrom = path.dirname(srcPath);
    const { data: fm, content } = matter(raw);

    const key = sha256(raw);
    const cacheFile = path.join(CACHE_DIR, `${key}.mdx`);
    if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, 'utf8');

    const translated = await translatePreservingCode(content);
    const body = copyAndRewriteImages(translated, relFrom);
    const newFm = { ...fm, lang: 'ru', translationOf: 'openai-cookbook' };
    const fmStr = '---\\n' + yaml.dump(newFm) + '---\\n\\n';
    const result = fmStr + body;

    fs.writeFileSync(cacheFile, result, 'utf8');
    return result;
}

(async function main() {
    const spinner = ora('Scanning sources…').start();
    const patterns = SRC_DIRS.map(d => `${d}/**/*.{md,mdx}`);
    const files = await globby(patterns, { gitignore: true });
    spinner.succeed(`Found ${files.length} files`);

    let ok = 0;
    for (const f of files) {
        const rel = f.replace(/^upstream\\/ /, '');
        const outPath = path.join(OUT_DIR, rel);
        ensureDir(path.dirname(outPath));
        const text = await processFile(f);
        fs.writeFileSync(outPath, text, 'utf8');
        process.stdout.write(gray(`✔ ${rel}\\n`));
        ok++;
    }
    console.log(green(`\\nDone. Generated ${ok} files in ${OUT_DIR}\\n`));
})().catch(e => {
    console.error(yellow('Translation failed:'), e);
    process.exit(1);
});
"@ | Set-Content -Encoding utf8 scripts\translate.mjs
