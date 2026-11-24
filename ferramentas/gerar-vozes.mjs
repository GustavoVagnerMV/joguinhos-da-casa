// Gera os áudios de todas as falas dos jogos com vozes neurais.
// Uso:  cd ferramentas && npm install && node gerar-vozes.mjs
//
// Cada jogo declara suas falas num bloco /*FALAS*/ ... /*FIM-FALAS*/ que contém
// os dados do jogo e uma função falas() retornando textos (ou [texto, estilo]).
// O bloco roda 2 vezes (pt e en). Só gera arquivos que ainda não existem e
// apaga os que não são mais usados.
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "comum", "voz");

const VOZES = {
  pt: { "": ["pt-BR-FranciscaNeural", { rate: "-4%", pitch: "+4%" }],
        monstro: ["pt-BR-FranciscaNeural", { rate: "+4%", pitch: "+22%" }],
        robo: ["pt-BR-AntonioNeural", { rate: "-8%", pitch: "-18%" }] },
  en: { "": ["en-US-JennyNeural", { rate: "-6%", pitch: "+4%" }],
        monstro: ["en-US-JennyNeural", { rate: "+2%", pitch: "+22%" }],
        robo: ["en-US-GuyNeural", { rate: "-8%", pitch: "-18%" }] },
};

// mesmo hash de comum/voz.js
function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); }

function coletar() {
  const jobs = new Map();
  const jogos = fs.readdirSync(ROOT).filter(d => fs.existsSync(path.join(ROOT, d, "index.html")));
  for (const jogo of jogos) {
    const html = fs.readFileSync(path.join(ROOT, jogo, "index.html"), "utf8");
    const m = html.match(/\/\*FALAS\*\/([\s\S]*?)\/\*FIM-FALAS\*\//);
    if (!m) continue;
    for (const lang of ["pt", "en"]) {
      const sandbox = { L: (pt, en) => (lang === "en" ? en : pt), LANG: lang };
      const lista = vm.runInNewContext(m[1] + "\n;falas()", sandbox);
      let n = 0;
      for (const item of lista) {
        const [text, style = ""] = Array.isArray(item) ? item : [item];
        if (!text) throw new Error(`${jogo}: fala vazia`);
        const id = hash(lang + "|" + style + "|" + text);
        if (!jobs.has(lang + id)) { jobs.set(lang + id, { lang, style, text, id, jogo }); n++; }
      }
      console.log(`${jogo} [${lang}]: ${lista.length} falas (${n} novas no total)`);
    }
  }
  return [...jobs.values()];
}

async function sintetizar(job, dir) {
  const [voz, prosodia] = VOZES[job.lang][job.style];
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    const tts = new MsEdgeTTS();
    try {
      await tts.setMetadata(voz, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioFilePath } = await tts.toFile(dir, job.text, prosodia);
      if (fs.statSync(audioFilePath).size < 1000) throw new Error("áudio vazio");
      fs.renameSync(audioFilePath, path.join(OUT, job.lang, job.id + ".mp3"));
      return;
    } catch (e) {
      if (tentativa === 4) throw new Error(`Falhou "${job.text}": ${e.message}`);
      await new Promise(r => setTimeout(r, 1500 * tentativa));
    } finally { try { tts.close(); } catch {} }
  }
}

const jobs = coletar();
for (const l of ["pt", "en"]) fs.mkdirSync(path.join(OUT, l), { recursive: true });

// apaga áudios que nenhum jogo usa mais
const validos = new Set(jobs.map(j => j.lang + "/" + j.id + ".mp3"));
let apagados = 0;
for (const l of ["pt", "en"]) for (const f of fs.readdirSync(path.join(OUT, l)))
  if (!validos.has(l + "/" + f)) { fs.unlinkSync(path.join(OUT, l, f)); apagados++; }

const faltando = jobs.filter(j => !fs.existsSync(path.join(OUT, j.lang, j.id + ".mp3")));
console.log(`\nTotal: ${jobs.length} falas | já prontas: ${jobs.length - faltando.length} | a gerar: ${faltando.length} | apagadas: ${apagados}`);

const WORKERS = 6;
let feitos = 0, erros = [];
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const dir = path.join(OUT, `.tmp${w}`); fs.mkdirSync(dir, { recursive: true });
  while (faltando.length) {
    const job = faltando.shift();
    try { await sintetizar(job, dir); } catch (e) { erros.push(e.message); }
    if (++feitos % 50 === 0) console.log(`  ${feitos} geradas...`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}));
console.log(`\nPronto! ${feitos - erros.length} geradas, ${erros.length} erros.`);
erros.forEach(e => console.log("  ERRO:", e));
process.exit(erros.length ? 1 : 0);
