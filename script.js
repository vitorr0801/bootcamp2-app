const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3/searchteams.php";

const area = document.getElementById("resultado");
const form = document.getElementById("form-busca");
const campoBusca = document.getElementById("campo-busca");
const chips = document.querySelectorAll(".chip");

async function buscarTimes(termo) {
  mostrarCarregando();

  let resposta;
  try {
    resposta = await fetch(`${BASE_URL}?t=${encodeURIComponent(termo)}`);
  } catch (erro) {
    // Erro de rede: sem internet, API fora do ar, CORS bloqueado, etc.
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
    mostrarVazio(termo);
    return;
  }

  mostrarTimes(dados.teams);
}

function mostrarCarregando() {
  area.innerHTML = `<p class="estado-carregando">Buscando nas arquibancadas...</p>`;
}

function mostrarVazio(termo) {
  area.innerHTML = `
    <p class="estado-vazio">
      Nenhum time encontrado para "<strong>${escaparHTML(termo)}</strong>".
      Tente outro nome, como "Barcelona" ou "Lakers".
    </p>
  `;
}

function mostrarErro() {
  area.innerHTML = `
    <p class="estado-erro">
      Não conseguimos falar com a API agora. Verifique sua conexão
      e tente novamente em instantes.
    </p>
  `;
}

function mostrarTimes(times) {
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

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const termo = campoBusca.value.trim();
  if (termo) buscarTimes(termo);
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const termo = chip.dataset.time;
    campoBusca.value = termo;
    buscarTimes(termo);
  });
});