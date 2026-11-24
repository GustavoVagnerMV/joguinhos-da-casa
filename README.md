# 🎈 Joguinhos da Casa

Jogos educativos para crianças de **4 a 7 anos**, feitos para jogar no celular e no tablet direto pelo navegador.

## 🎮 Jogos

### 📚 Aprender
| Jogo | O que treina |
|---|---|
| 🧩 [Quebra-Cabeça Mágico](quebra-cabeca-magico/) | Montagem, coordenação motora |
| 🔢 [Conta Comigo](conta-comigo/) | Contar de 1 a 10 |
| 🔤 [ABC dos Bichos](abc-dos-bichos/) | Letras e alfabetização |

### 🎨 Mundo Cartoon
| Jogo | O que treina |
|---|---|
| 👾 [Monstrinho Comilão](monstrinho-comilao/) | Cores |
| 🐸 [Caminho do Sapinho](caminho-do-sapinho/) | Lógica (girar peças) |
| 🎭 [Teatro das Sombras](teatro-das-sombras/) | Formas e percepção visual |
| 🤖 [Fábrica de Robôs](fabrica-de-robos/) | Montagem, formas e cores |
| 🚂 [Trem dos Padrões](trem-dos-padroes/) | Sequências e padrões |
| 🔤 [Monte a Palavra](monte-a-palavra/) | Leitura e escrita (montar a palavra da figura) |
| 🕵️ [Detetive do Intruso](detetive-do-intruso/) | Raciocínio lógico e categorias |

## ✨ Recursos
- Voz natural gravada (neural) em **português** ou **inglês**, igual em qualquer aparelho ou navegador
- Botão 🇧🇷/🇺🇸 no menu e na tela inicial de cada jogo troca voz **e** textos (no ABC, as palavras também mudam)
- Feito para toque: botões grandes, arrastar com o dedo
- Sem erro punitivo — só incentivo para tentar de novo
- Cada jogo é um único `index.html`, sem dependências

## 🔊 Como as vozes funcionam
Todas as falas ficam gravadas em `comum/voz/pt/` e `comum/voz/en/` (MP3). Cada jogo lista suas falas
num bloco `/*FALAS*/ ... /*FIM-FALAS*/`. Depois de mudar ou criar uma fala, regrave com:

```
cd ferramentas
npm install
node gerar-vozes.mjs
```

O script só gera o que for novo e apaga áudios que não são mais usados.
Se faltar algum áudio, o jogo usa a voz do aparelho, mas só se ela for do idioma escolhido.

## 📱 Dica
No tablet, abra o site e use **"Adicionar à tela inicial"** para virar um ícone de app.
