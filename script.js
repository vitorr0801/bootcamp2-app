const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";

const ESPORTES = [
  { label: "Futebol", valor: "Soccer" },
  { label: "Basquete", valor: "Basketball" },
  { label: "Hóquei no gelo", valor: "Ice Hockey" },
  { label: "Beisebol", valor: "Baseball" },
  { label: "Futebol Americano", valor: "American Football" },
];

// Tradução dos nomes de país mais comuns (português -> inglês), já que
// a TheSportsDB só reconhece o nome do país em inglês. As chaves são
// normalizadas (sem acento, minúsculas) para a busca ser mais tolerante.
const PAISES_PT_PARA_EN = {
  "inglaterra": "England",
  "escocia": "Scotland",
  "pais de gales": "Wales",
  "irlanda do norte": "Northern Ireland",
  "irlanda": "Republic of Ireland",
  "brasil": "Brazil",
  "espanha": "Spain",
  "italia": "Italy",
  "alemanha": "Germany",
  "franca": "France",
  "portugal": "Portugal",
  "holanda": "Netherlands",
  "paises baixos": "Netherlands",
  "mexico": "Mexico",
  "argentina": "Argentina",
  "estados unidos": "United States",
  "eua": "United States",
  "suecia": "Sweden",
  "belgica": "Belgium",
  "turquia": "Turkey",
  "russia": "Russia",
  "china": "China",
  "japao": "Japan",
  "australia": "Australia",
  "canada": "Canada",
  "chile": "Chile",
  "colombia": "Colombia",
  "uruguai": "Uruguay",
  "paraguai": "Paraguay",
  "peru": "Peru",
  "grecia": "Greece",
  "suica": "Switzerland",
  "austria": "Austria",
  "dinamarca": "Denmark",
  "noruega": "Norway",
  "polonia": "Poland",
  "croacia": "Croatia",
  "servia": "Serbia",
  "ucrania": "Ukraine",
  "egito": "Egypt",
  "marrocos": "Morocco",
  "arabia saudita": "Saudi Arabia",
  "catar": "Qatar",
  "coreia do sul": "South Korea",
  "india": "India",
};

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function traduzirPais(paisDigitado) {
  const chave = normalizarTexto(paisDigitado);
  // Se não tiver no dicionário, tentamos usar o que foi digitado mesmo
  // (pode ser que a pessoa já tenha digitado em inglês, ou um país que
  // não está na nossa lista de traduções).
  return PAISES_PT_PARA_EN[chave] || paisDigitado;
}

// A API às vezes corta a lista de ligas antes de chegar na liga mais
// famosa de um país (ex: o Brasil tem dezenas de campeonatos estaduais
// que vêm antes da Série A). Para não deixar a liga principal invisível,
// mantemos aqui um "reforço" com o nome oficial das ligas mais
// conhecidas, adicionado manualmente caso a API não a traga.
const LIGA_PRINCIPAL = {
  "Soccer|Brazil": "Brazilian Serie A",
  "Soccer|England": "English Premier League",
  "Soccer|Spain": "Spanish La Liga",
  "Soccer|Italy": "Italian Serie A",
  "Soccer|Germany": "German Bundesliga",
  "Soccer|France": "French Ligue 1",
  "Soccer|Portugal": "Portuguese Primeira Liga",
  "Soccer|Netherlands": "Dutch Eredivisie",
  "Soccer|Mexico": "Mexican Primera Division",
  "Soccer|Sweden": "Swedish Allsvenskan",
  "Soccer|Argentina": "Argentinian Primera Division",
  "Soccer|United States": "American Major League Soccer",
  "Basketball|United States": "NBA",
  "Ice Hockey|United States": "NHL",
  "Baseball|United States": "MLB",
  "American Football|United States": "NFL",
};

const area = document.getElementById("resultado");
const form = document.getElementById("form-busca");
const campoBusca = document.getElementById("campo-busca");
const chips = document.querySelectorAll(".chip");
const selectEsporte = document.getElementById("select-esporte");
const campoPais = document.getElementById("campo-pais");
const botaoBuscarLigas = document.getElementById("botao-buscar-ligas");
const areaSelectLiga = document.getElementById("area-select-liga");
const campoLiga = document.getElementById("campo-liga");
const botaoVerTimes = document.getElementById("botao-ver-times");
const listaLigas = document.getElementById("lista-ligas");
const areaFiltroTimes = document.getElementById("area-filtro-times");
const campoFiltroTimes = document.getElementById("campo-filtro-times");

// Apelidos populares que não aparecem como substring dentro do nome
// oficial da liga (ex: "brasileirão" não está contido em "Brazilian
// Serie A"). Usado como uma camada extra de tolerância na busca.
const APELIDOS_LIGA = {
  "brasileirao": "Brazilian Serie A",
  "brasileirao serie a": "Brazilian Serie A",
  "premierada": "English Premier League",
  "premiere league": "English Premier League",
  "liga espanhola": "Spanish La Liga",
  "campeonato italiano": "Italian Serie A",
  "campeonato alemao": "German Bundesliga",
  "campeonato frances": "French Ligue 1",
  "liga inglesa": "English Premier League",
  "liga sueca": "Swedish Allsvenskan",
};

// Adjetivo em inglês usado pela TheSportsDB para nomear ligas de cada
// país (ex: "Brazilian Serie B", "English Division 2"). Usado para
// reconstruir automaticamente nomes de ligas por padrão (Série X,
// Divisão X), sem precisar cadastrar cada liga na mão.
const PAIS_PARA_ADJETIVO = {
  "England": "English",
  "Scotland": "Scottish",
  "Wales": "Welsh",
  "Republic of Ireland": "Irish",
  "Brazil": "Brazilian",
  "Spain": "Spanish",
  "Italy": "Italian",
  "Germany": "German",
  "France": "French",
  "Portugal": "Portuguese",
  "Netherlands": "Dutch",
  "Mexico": "Mexican",
  "Argentina": "Argentinian",
  "United States": "American",
  "Sweden": "Swedish",
  "Belgium": "Belgian",
  "Turkey": "Turkish",
  "Russia": "Russian",
  "China": "Chinese",
  "Japan": "Japanese",
  "Australia": "Australian",
  "Canada": "Canadian",
  "Chile": "Chilean",
  "Colombia": "Colombian",
  "Uruguay": "Uruguayan",
  "Paraguay": "Paraguayan",
  "Peru": "Peruvian",
  "Greece": "Greek",
  "Switzerland": "Swiss",
  "Austria": "Austrian",
  "Denmark": "Danish",
  "Norway": "Norwegian",
  "Poland": "Polish",
  "Croatia": "Croatian",
  "Serbia": "Serbian",
  "Ukraine": "Ukrainian",
  "Egypt": "Egyptian",
  "Morocco": "Moroccan",
  "Saudi Arabia": "Saudi",
  "Qatar": "Qatari",
  "South Korea": "South Korean",
  "India": "Indian",
};

// Lembra o esporte/país da última busca de ligas, pra poder reconstruir
// nomes de liga por padrão (ver gerarCandidatosPorPadrao).
let ultimoEsporteBuscado = "";
let ultimoPaisBuscado = "";

// Mapa "rótulo mostrado" -> "nome oficial da liga", pra recuperar o
// valor certo depois que o usuário digita/escolhe uma sugestão do
// datalist (o rótulo pode ter o "★" na frente, o valor real não).
let mapaLigasAtual = {};

// Guarda os objetos completos das ligas da última busca (não só os
// rótulos), pra permitir um match parcial tolerante — ex: digitar
// "premier league" encontra "English Premier League" nessa lista.
let ligasAtuais = [];

// Guarda os últimos times carregados (por nome ou por liga), pra
// filtrar pelo nome sem precisar fazer uma nova chamada à API.
let ultimosTimesCarregados = [];

// Guarda o nome oficial da liga selecionada no momento, pra conferir
// se um time buscado individualmente realmente pertence a ela.
let ligaAtualSelecionada = "";

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

  carregarTimes(dados.teams);
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
      `Não encontramos ligas de "${escaparHTML(pais)}" para esse esporte. Verifique se digitou o nome do país corretamente.`
    );
    return;
  }

  // Garante que a liga mais famosa daquele país/esporte apareça, mesmo
  // se a API tiver cortado ela da lista (ver comentário em LIGA_PRINCIPAL).
  const nomeLigaPrincipal = LIGA_PRINCIPAL[`${esporte}|${pais}`];
  const jaEstaNaLista = ligas.some(
    (l) => normalizarTexto(l.strLeague) === normalizarTexto(nomeLigaPrincipal || "")
  );

  if (nomeLigaPrincipal && !jaEstaNaLista) {
    ligas.unshift({ strLeague: nomeLigaPrincipal, principal: true });
  }

  ultimoEsporteBuscado = esporte;
  ultimoPaisBuscado = pais;

  popularListaLigas(ligas);
  area.innerHTML = `<p class="estado-inicial">Encontramos ${ligas.length} liga(s). Digite ou escolha uma acima para ver os times.</p>`;
}

function popularListaLigas(ligas) {
  mapaLigasAtual = {};
  ligasAtuais = ligas;

  listaLigas.innerHTML = ligas
    .map((l) => {
      const rotulo = l.principal ? `★ ${l.strLeague}` : l.strLeague;
      mapaLigasAtual[rotulo] = l.strLeague;
      return `<option value="${escaparHTML(rotulo)}"></option>`;
    })
    .join("");

  areaSelectLiga.hidden = false;
  campoLiga.value = "";
  campoLiga.focus();
}

async function buscarPorLiga(ligaNome) {
  ligaAtualSelecionada = ligaNome;
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

  carregarTimes(dados.teams);
}

// ---------- Estados da tela ----------

function mostrarCarregando() {
  areaFiltroTimes.hidden = true;
  area.innerHTML = `<p class="estado-carregando">Buscando nas arquibancadas...</p>`;
}

function mostrarVazio(mensagem) {
  areaFiltroTimes.hidden = true;
  area.innerHTML = `<p class="estado-vazio">${mensagem}</p>`;
}

function mostrarErro() {
  areaFiltroTimes.hidden = true;
  area.innerHTML = `
    <p class="estado-erro">
      Não conseguimos falar com a API agora. Verifique sua conexão
      e tente novamente em instantes.
    </p>
  `;
}

// Guarda a lista carregada e mostra o campo de filtro por nome quando
// há mais de 1 time — filtrar 1 resultado só não faz sentido.
function carregarTimes(times) {
  ultimosTimesCarregados = times;
  campoFiltroTimes.value = "";
  areaFiltroTimes.hidden = times.length <= 1;

  renderizarTimes(times);

  // A API gratuita da TheSportsDB limita esse endpoint a no máximo 10
  // times por liga (é uma restrição documentada do plano free, não um
  // bug nosso). Quando batemos exatamente nesse número, avisamos que a
  // lista pode estar incompleta, pra não parecer que o time "sumiu".
  if (times.length === 10) {
    area.insertAdjacentHTML(
      "afterbegin",
      `<p class="aviso-limite">A API gratuita mostra no máximo 10 times por liga. Se o time que você procura não estiver aqui, use o campo abaixo para buscar por nome — ele pode existir mesmo assim.</p>`
    );
  }
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
  campoPais.placeholder = "País em português: Brasil, Inglaterra...";
  botaoBuscarLigas.disabled = false;
});

function dispararBuscaDeLigas() {
  const esporte = selectEsporte.value;
  const paisDigitado = campoPais.value.trim();
  if (!esporte || !paisDigitado) return;

  const paisEmIngles = traduzirPais(paisDigitado);
  buscarLigas(esporte, paisEmIngles);
}

botaoBuscarLigas.addEventListener("click", dispararBuscaDeLigas);

campoPais.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    evento.preventDefault();
    dispararBuscaDeLigas();
  }
});

const ORDINAIS_PARA_NUMERO = {
  primeira: "1",
  segunda: "2",
  terceira: "3",
  quarta: "4",
};

function gerarCandidatoPorPadrao(textoNormalizado) {
  const adjetivo = PAIS_PARA_ADJETIVO[ultimoPaisBuscado];
  if (!adjetivo) return null;

  // Reconhece "serie a/b/c/d" (com ou sem acento, já normalizado).
  const matchSerie = textoNormalizado.match(/^serie ([a-d])$/);
  if (matchSerie) {
    return `${adjetivo} Serie ${matchSerie[1].toUpperCase()}`;
  }

  // Reconhece "divisao 1/2/3/4", "division 1/2/3/4", ou por extenso
  // ("segunda divisao", "primeira divisao").
  const matchDivisaoNumero = textoNormalizado.match(/^(?:divisao|division) (\d)$/);
  if (matchDivisaoNumero) {
    return `${adjetivo} Division ${matchDivisaoNumero[1]}`;
  }

  const matchDivisaoOrdinal = textoNormalizado.match(/^(primeira|segunda|terceira|quarta) divisao$/);
  if (matchDivisaoOrdinal) {
    return `${adjetivo} Division ${ORDINAIS_PARA_NUMERO[matchDivisaoOrdinal[1]]}`;
  }

  return null;
}

function encontrarLigaPeloTexto(textoDigitado) {
  // Camada 1: match exato com um rótulo do datalist (o usuário
  // escolheu uma sugestão diretamente).
  const exato = mapaLigasAtual[textoDigitado];
  if (exato) return exato;

  const textoNormalizado = normalizarTexto(textoDigitado);

  // Camada 2: o texto digitado aparece dentro do nome de alguma liga
  // já carregada para esse país/esporte (ex: "premier league" dentro
  // de "English Premier League"). Como a lista já está filtrada por
  // país e esporte, essa busca tende a ser bem precisa.
  const porSubstring = ligasAtuais.find((l) =>
    normalizarTexto(l.strLeague).includes(textoNormalizado)
  );
  if (porSubstring) return porSubstring.strLeague;

  // Camada 3: apelidos populares que não aparecem como substring do
  // nome oficial (ex: "brasileirão" -> "Brazilian Serie A").
  const apelido = APELIDOS_LIGA[textoNormalizado];
  if (apelido) return apelido;

  // Camada 4: reconstrói o nome por padrão a partir do país buscado
  // (ex: "série b" no Brasil -> "Brazilian Serie B"), cobrindo
  // divisões/séries que a API pode ter cortado da lista.
  const porPadrao = gerarCandidatoPorPadrao(textoNormalizado);
  if (porPadrao) return porPadrao;

  // Camada 5: nenhuma das anteriores bateu — tenta exatamente o que
  // foi digitado, caso seja um nome de liga real fora da nossa lista.
  return textoDigitado;
}

function dispararBuscaDeTimes() {
  const textoDigitado = campoLiga.value.trim();
  if (!textoDigitado) return;

  buscarPorLiga(encontrarLigaPeloTexto(textoDigitado));
}

botaoVerTimes.addEventListener("click", dispararBuscaDeTimes);

campoLiga.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    evento.preventDefault();
    dispararBuscaDeTimes();
  }
});

campoFiltroTimes.addEventListener("input", () => {
  const termo = normalizarTexto(campoFiltroTimes.value);

  const filtrados = termo
    ? ultimosTimesCarregados.filter((t) => normalizarTexto(t.strTeam || "").includes(termo))
    : ultimosTimesCarregados;

  if (filtrados.length === 0 && termo) {
    area.innerHTML = `
      <div class="estado-vazio">
        <p>Nenhum time carregado bate com "${escaparHTML(campoFiltroTimes.value)}" — mas ele pode existir na liga mesmo assim (lembra que só carregamos até 10 times).</p>
        <button type="button" class="search__button botao-buscar-time-liga" data-termo="${escaparHTML(campoFiltroTimes.value)}">
          Buscar "${escaparHTML(campoFiltroTimes.value)}" direto
        </button>
      </div>
    `;
    return;
  }

  renderizarTimes(filtrados);
});

area.addEventListener("click", (evento) => {
  const botao = evento.target.closest(".botao-buscar-time-liga");
  if (botao) buscarTimeNaLigaAtual(botao.dataset.termo);
});

async function buscarTimeNaLigaAtual(nomeTime) {
  mostrarCarregando();

  let resposta;
  try {
    resposta = await fetch(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(nomeTime)}`);
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
    mostrarVazio(`Não encontramos nenhum time chamado "${escaparHTML(nomeTime)}".`);
    return;
  }

  const time = dados.teams[0];

  if (normalizarTexto(time.strLeague || "") !== normalizarTexto(ligaAtualSelecionada)) {
    mostrarVazio(
      `Encontramos "${escaparHTML(time.strTeam)}", mas ele joga em "${escaparHTML(time.strLeague || "outra liga")}", não na liga selecionada.`
    );
    return;
  }

  // Adiciona esse time à lista carregada (se ainda não estiver nela),
  // pra continuar aparecendo caso o usuário limpe o filtro depois.
  const jaEstaNaLista = ultimosTimesCarregados.some((t) => t.idTeam === time.idTeam);
  if (!jaEstaNaLista) {
    ultimosTimesCarregados = [...ultimosTimesCarregados, time];
  }

  renderizarTimes([time]);
}

popularSelectEsportes();