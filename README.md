# Escalação — Explorador de Times

## Autor
Vitor Reis Rodrigues de Souza — RA: 22308730

## Descrição
Aplicação web que permite explorar times de futebol, basquete, hóquei no gelo, beisebol e futebol americano ao redor do mundo — seja buscando um clube pelo nome exato, seja navegando por esporte, país e liga. Útil para quem quer descobrir rapidamente dados como escudo, estádio, país e ano de fundação de qualquer time, sem precisar pesquisar manualmente em vários sites diferentes.

## API utilizada
- **TheSportsDB** — https://www.thesportsdb.com/documentation
- Endpoints consumidos:
  - `searchteams.php?t=` — busca um time pelo nome exato
  - `search_all_leagues.php?c=&s=` — lista as ligas de um país/esporte
  - `search_all_teams.php?l=` — lista os times de uma liga específica

## Funcionalidades
- Busca de um time pelo nome exato, com sugestões rápidas em formato de "chips" (Real Madrid, Lakers, Manchester United, Cruzeiro)
- Exploração guiada por **esporte → país → liga**, trazendo os times daquela liga em cards com escudo, esporte, estádio, país e ano de fundação
- Lista curada das ligas mais famosas de cada país (Premier League, Championship, La Liga, Bundesliga, Brasileirão Série A/B/C/D, entre outras), sempre disponível mesmo quando a busca dinâmica da API não as traz
- Filtro por nome dentro dos times já carregados de uma liga, com opção de buscar um time específico direto na API caso ele não apareça na lista (a API gratuita limita a 10 times por liga)
- Tratamento de erro em todas as buscas: mensagens amigáveis para "nenhum resultado encontrado" e para falhas de rede/API fora do ar, sem quebrar a tela

## Como executar localmente
1. Clone: `git clone https://github.com/vitorr0801/bootcamp2-app.git`
2. Abra o arquivo `index.html` no navegador

## Links
- **Aplicação no ar (GitHub Pages):** https://vitorr0801.github.io/bootcamp2-app/
- **Repositório:** https://github.com/vitorr0801/bootcamp2-app