# 🔊 Visual Sound Design (Descontinuado)

> [!IMPORTANT]
> **ESTE PROJETO NÃO ESTÁ MAIS EM USO OU MANUTENÇÃO.**
> O aplicativo foi descontinuado neste repositório e agora se chama **RPGSA** on https://github.com/nilobonca/RPGSA.

---

## 📌 Sobre o Projeto

O **Visual Sound Design** (também registrado internamente como *rpg-sound-util*) foi concebido como uma ferramenta de design de som visual e áudio posicional/espacial para sessões de RPG de Mesa (TTRPG).

A proposta do aplicativo é permitir que o Mestre de jogo (DM/GM) crie paisagens sonoras (soundscapes) dinâmicas, posicionando emissores de áudio e ouvintes em um canvas 2D interativo sobre mapas de jogo, além de gerenciar trilhas de fundo e efeitos sonoros.

---

## ⚡ Principais Funcionalidades

- **🎨 Canvas 2D Interativo:** Interface baseada em Konva para posicionar, arrastar e configurar fontes sonoras e ouvintes no mapa.
- **🔊 Áudio Espacializado:** Cálculo de atenuação por distância, cálculo de ganho e panning estereofônico com base na posição do ouvinte em relação às fontes de som.
- **🎵 Trilha Sonora & Soundboard:** Reprodutor de áudio global, soundboards configuráveis para efeitos sonoros rápidos e upload em lote de arquivos de áudio.
- **🌐 Sincronização e P2P:** Conectividade P2P via PeerJS para transmissão e sincronização de áudio com os jogadores em tempo real.
- **🗂️ Gerenciamento de Camadas e Pins:** Controle flexível de camadas do mapa, tipos de pins, menus de contexto e histórico de ações.
- **💾 Importação / Exportação:** Salva e carrega projetos completos de soundscapes (arquivos de configuração / ZIP).

---

## 🛠️ Tecnologias Utilizadas

- **Framework Front-end:** [Next.js](https://nextjs.org/) & [React](https://react.dev/)
- **Linguagem:** TypeScript
- **Renderização Visual:** [Konva.js](https://konvajs.org/) (`react-konva`)
- **Áudio & WebRTC:** Web Audio API & [PeerJS](https://peerjs.com/)
- **Gerenciamento de Estado:** Zustand
- **Estilização & UI:** Tailwind CSS, Radix UI & Lucide React

---

## 🔄 Status do Projeto & Novo App (RPGSA)

Este repositório **não está mais sendo utilizado** para desenvolvimento de novas funcionalidades. O projeto foi reformulado e continuará sob o novo nome **RPGSA** on https://github.com/nilobonca/RPGSA.
