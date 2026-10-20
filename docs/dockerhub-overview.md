# Escalação — Explorador de Times

Aplicação web (HTML + CSS + JavaScript puros, servida por **Nginx**) para explorar times de futebol, basquete, hóquei no gelo, beisebol e futebol americano. Os dados dos times vêm da API pública [TheSportsDB](https://www.thesportsdb.com/) e os **times favoritos (e suas anotações) ficam salvos num banco PostgreSQL (Supabase)**, então continuam lá depois de fechar o navegador.

## Como rodar

```bash
docker run -d -p 8080:80 vitorceub/bootcamp2-app:1.1
```

Depois é só abrir **http://localhost:8080** no navegador.

> O container precisa de acesso à internet, porque o navegador consulta a TheSportsDB e o Supabase.

Para parar e remover:

```bash
docker ps
docker stop <id-ou-nome>
docker rm <id-ou-nome>
```

## Tags disponíveis

| Tag      | Descrição                                                     |
|----------|---------------------------------------------------------------|
| `1.0`    | Primeira versão funcional: busca de times + favoritos (criar, listar, excluir) |
| `1.1`    | Adiciona anotação pessoal em cada favorito (atualizar)        |
| `latest` | Aponta para a versão mais recente                             |

## Links

- **Código-fonte (GitHub):** https://github.com/vitorr0801/bootcamp2-app
- **Aplicação online (GitHub Pages):** https://vitorr0801.github.io/bootcamp2-app/

## Sobre a imagem

- Base: `nginx:alpine` (enxuta)
- Porta exposta: `80`
- Contém apenas `index.html`, `style.css` e `script.js`