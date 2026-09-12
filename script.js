const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";

const ESPORTES = [
  { label: "Futebol", valor: "Soccer" },
  { label: "Basquete", valor: "Basketball" },
  { label: "Hóquei no gelo", valor: "Ice Hockey" },
  { label: "Beisebol", valor: "Baseball" },
  { label: "Futebol Americano", valor: "American Football" },
];

const area = document.getElementById("resultado");
const form = document.getElementById("form-busca");
const campoBusca = document.getElementById("campo-busca");
const chips = document.querySelectorAll(".chip");
const selectEsporte = document.getElementById("select-esporte");
const campoPais = document.getElementById("campo-pais");
const botaoBuscarLigas = document.getElementById("botao-buscar-ligas");
const areaSelectLiga = document.getElementById("area-select-liga");
const selectLiga = document.getElementById("select-liga");

// ---------- Busca direta por nome exato de time ----------

async function buscarPorNome(termo) {
  mostrarCarregando();

  let resposta;
  try {
    resposta = await fetch(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(termo)}`);
  } catch (erro) {
    mostrarErro();
    return;
  }

  if (!resposta.ok) {
    mostrarErro();
    return;
  }

  let dados;
  try {
    dados = await resposta.json();
  } catch (erro) {
    mostrarErro();
    return;
  }

  // A TheSportsDB responde 200 OK mesmo quando não encontra nada,
  // retornando "teams": null. Por isso tratamos esse caso separado
  // de um erro real de rede/API.
  if (!dados.teams) {
    mostrarVazio(`Nenhum time encontrado para "${escaparHTML(termo)}". Tente outro nome, como "Barcelona" ou "Lakers".`);
    return;
  }

  renderizarTimes(dados.teams);
}

// ---------- Explorar por esporte + país -> ligas ----------

function popularSelectEsportes() {
  selectEsporte.innerHTML =
    `<option value="">Escolha um esporte</option>` +
    ESPORTES.map((e) => `<option value="${e.valor}">${e.label}</option>`).join("");
}

async function buscarLigas(esporte, pais) {
  areaSelectLiga.hidden = true;
  mostrarCarregando();

  let resposta;
  try {
    resposta = await fetch(
      `${BASE_URL}/search_all_leagues.php?c=${encodeURIComponent(pais)}&s=${encodeURIComponent(esporte)}`
    );
  } catch (erro) {
    mostrarErro();
    return;
  }

  if (!resposta.ok) {
    mostrarErro();
    return;
  }

  let dados;
  try {
    dados = await resposta.json();
  } catch (erro) {
    mostrarErro();
    return;
  }

  const ligas = dados.countries;

  if (!ligas || ligas.length === 0) {
    mostrarVazio(
      `Não encontramos ligas de ${escaparHTML(pais)} para esse esporte. Tente o nome do país em inglês (ex: "England", "Brazil", "Sweden").`
    );
    return;
  }

  popularSelectLigas(ligas);
  area.innerHTML = `<p class="estado-inicial">Encontramos ${ligas.length} liga(s). Escolha uma no select acima para ver os times.</p>`;
}

function popularSelectLigas(ligas) {
  selectLiga.innerHTML =
    `<option value="">Escolha uma liga</option>` +
    ligas
      .map((l) => `<option value="${escaparHTML(l.strLeague)}">${escaparHTML(l.strLeague)}</option>`)
      .join("");
  areaSelectLiga.hidden = false;
}

async function buscarPorLiga(ligaNome) {
  mostrarCarregando();

  let resposta;
  try {
    resposta = await fetch(`${BASE_URL}/search_all_teams.php?l=${encodeURIComponent(ligaNome)}`);
  } catch (erro) {
    mostrarErro();
    return;
  }

  if (!resposta.ok) {
    mostrarErro();
    return;
  }

  let dados;
  try {
    dados = await resposta.json();
  } catch (erro) {
    mostrarErro();
    return;
  }

  if (!dados.teams) {
    mostrarVazio(`Não encontramos times cadastrados para "${escaparHTML(ligaNome)}" no momento.`);
    return;
  }

  renderizarTimes(dados.teams);
}

// ---------- Estados da tela ----------

function mostrarCarregando() {
  area.innerHTML = `<p class="estado-carregando">Buscando nas arquibancadas...</p>`;
}

function mostrarVazio(mensagem) {
  area.innerHTML = `<p class="estado-vazio">${mensagem}</p>`;
}

function mostrarErro() {
  area.innerHTML = `
    <p class="estado-erro">
      Não conseguimos falar com a API agora. Verifique sua conexão
      e tente novamente em instantes.
    </p>
  `;
}

function renderizarTimes(times) {
  area.innerHTML = times.map(criarCardHTML).join("");
}

function criarCardHTML(time) {
  const escudo = time.strTeamBadge || "https://via.placeholder.com/84?text=%3F";
  const nome = escaparHTML(time.strTeam || "Time sem nome");
  const liga = escaparHTML(time.strLeague || "Liga não informada");
  const estadio = escaparHTML(time.strStadium || "Não informado");
  const pais = escaparHTML(time.strCountry || "Não informado");
  const fundacao = escaparHTML(time.intFormedYear || "—");
  const esporte = escaparHTML(time.strSport || "Não informado");

  return `
    <article class="card">
      <div class="card__faixa"></div>
      <div class="card__corpo">
        <img class="card__escudo" src="${escudo}" alt="Escudo do ${nome}" loading="lazy">
        <h2 class="card__nome">${nome}</h2>
        <p class="card__liga">${liga}</p>
        <div class="card__stats">
          <div class="card__stat">
            <span class="card__stat-label">Esporte</span>
            <span class="card__stat-valor">${esporte}</span>
          </div>
          <div class="card__stat">
            <span class="card__stat-label">Estádio</span>
            <span class="card__stat-valor">${estadio}</span>
          </div>
          <div class="card__stat">
            <span class="card__stat-label">País</span>
            <span class="card__stat-valor">${pais}</span>
          </div>
          <div class="card__stat">
            <span class="card__stat-label">Fundado em</span>
            <span class="card__stat-valor">${fundacao}</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

function escaparHTML(valor) {
  const div = document.createElement("div");
  div.textContent = String(valor);
  return div.innerHTML;
}

// ---------- Eventos ----------

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const termo = campoBusca.value.trim();
  if (termo) buscarPorNome(termo);
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const termo = chip.dataset.time;
    campoBusca.value = termo;
    buscarPorNome(termo);
  });
});

selectEsporte.addEventListener("change", () => {
  const esporte = selectEsporte.value;
  areaSelectLiga.hidden = true;

  if (!esporte) {
    campoPais.disabled = true;
    campoPais.value = "";
    campoPais.placeholder = "Escolha um esporte primeiro";
    botaoBuscarLigas.disabled = true;
    return;
  }

  campoPais.disabled = false;
  campoPais.value = "";
  campoPais.placeholder = "País em inglês: England, Brazil...";
  botaoBuscarLigas.disabled = false;
});

function dispararBuscaDeLigas() {
  const esporte = selectEsporte.value;
  const pais = campoPais.value.trim();
  if (esporte && pais) buscarLigas(esporte, pais);
}

botaoBuscarLigas.addEventListener("click", dispararBuscaDeLigas);

campoPais.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    evento.preventDefault();
    dispararBuscaDeLigas();
  }
});

selectLiga.addEventListener("change", () => {
  const liga = selectLiga.value;
  if (liga) buscarPorLiga(liga);
});

popularSelectEsportes();