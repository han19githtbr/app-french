# FN3 Nativos — PWA Setup

## Estrutura de ficheiros a adicionar ao projeto

```
APP_FRENC/
├── index.html          ← substitua pelo novo (pwa/index.html)
├── manifest.json       ← NOVO
├── sw.js               ← NOVO
├── css/
│   └── style.css
├── js/
│   └── index.js
├── database/
│   └── data.json
├── image/              ← NOVA PASTA (ícones PWA)
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── maskable-192x192.png
│   └── maskable-512x512.png
└── logo_b64.txt
```

## O que foi adicionado

### manifest.json
- Nome, descrição e cores do app
- Ícones em todos os tamanhos (Android, iOS, Windows)
- Ícones maskable (Android adaptativo)
- Shortcuts para "Gerar" e "Quiz" no menu longo-toque
- display: standalone (sem barra do browser)

### sw.js (Service Worker)
- Cache-First para CSS/JS/HTML → app carrega offline
- Network-First para data.json e logo → dados sempre atualizados
- Atualização automática com notificação ao utilizador

### index.html (atualizado)
- Meta tags PWA para Android, iOS e Windows
- Banner de instalação automático (aparece após 3s)
- Barra de aviso quando offline
- Registo do service worker
- Detecção de nova versão disponível

## Como testar

1. Faça deploy em HTTPS (obrigatório para PWA)
2. Abra no Chrome/Edge → ícone de instalar na barra de endereço
3. No Safari iOS → Partilhar → Adicionar ao ecrã inicial
4. Desative a rede para testar modo offline

## Notas importantes

- O SW só funciona em **HTTPS** ou `localhost`
- Para atualizar o cache, mude `CACHE_NAME = 'fn3-v2'` no sw.js
- O banner de instalação só aparece se o app ainda não estiver instalado
