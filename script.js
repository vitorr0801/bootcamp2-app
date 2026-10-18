const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";

// ---------- Configuração do Supabase (persistência dos favoritos) ----------

// Copie estes dois valores em: Supabase > Project Settings > API.
// A chave "anon public" (ou "publishable") foi feita para uso no frontend,
// então pode ficar aqui. NUNCA use a chave "service_role"/"secret" neste arquivo.
const SUPABASE_URL = "https://lsnjpguiqjulyjfwfikw.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbmpwZ3VpcWp1bHlqZndmaWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNzk2MzAsImV4cCI6MjEwNzg1NTYzMH0.L65RCAsq7e7HHjF6fDImr51Zzywp8It_MMk_RK6yajI";

const TABELA_FAVORITOS = "favoritos";

// Placeholder embutido (SVG em data URI) usado quando o time não tem
// escudo cadastrado — evita depender de um serviço externo que pode
// falhar ou ficar fora do ar.
const ESCUDO_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84"><rect width="84" height="84" rx="42" fill="#16233A"/><text x="50%" y="55%" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#93A1B8">?</text></svg>`
  );

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
    .replace(/[̀-ͯ]/g, "")
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

// A busca dinâmica de ligas da API às vezes corta as ligas mais famosas
// de um país antes que elas apareçam (ex: o Brasil tem dezenas de
// campeonatos estaduais que vêm antes da Série A). Para não deixar as
// ligas mais conhecidas invisíveis, mantemos aqui uma lista "curada"
// por país/esporte, que é sempre adicionada ao topo do select, mesmo
// que a API não a traga.
const LIGAS_FAMOSAS = {
  "Soccer|England": [
    "English Premier League",
    "English League Championship",
    "English League One",
    "English League Two",
  ],
  "Soccer|Spain": ["Spanish La Liga", "Spanish Adelante"],
  "Soccer|Italy": ["Italian Serie A", "Italian Serie B"],
  "Soccer|Germany": ["German Bundesliga", "German 2. Bundesliga"],
  "Soccer|France": ["French Ligue 1", "French Ligue 2"],
  "Soccer|Brazil": ["Brazilian Serie A", "Brazilian Serie B", "Brazilian Serie C", "Brazilian Serie D"],
  "Soccer|Portugal": ["Portuguese Primeira Liga"],
  "Soccer|Netherlands": ["Dutch Eredivisie"],
  "Soccer|Mexico": ["Mexican Primera Division"],
  "Soccer|Sweden": ["Swedish Allsvenskan", "Swedish Superettan"],
  "Soccer|Argentina": ["Argentinian Primera Division"],
  "Soccer|United States": ["American Major League Soccer"],
  "Basketball|United States": ["NBA"],
  "Ice Hockey|United States": ["NHL"],
  "Baseball|United States": ["MLB"],
  "American Football|United States": ["NFL"],
};

const area = document.getElementById("resultado");
const form = document.getElementById("form-busca");
const campoBusca = document.getElementById("campo-busca");
const chips = document.querySelectorAll(".chip");
const selectEsporte = document.getElementById("select-esporte");
const campoPais = document.getElementById("campo-pais");
const botaoBuscarLigas = document.getElementById("botao-buscar-ligas");
const areaSelectLiga = document.getElementById("area-select-liga");
const selectLiga = document.getElementById("select-liga");
const areaFiltroTimes = document.getElementById("area-filtro-times");
const campoFiltroTimes = document.getElementById("campo-filtro-times");
const listaFavoritos = document.getElementById("lista-favoritos");
const contadorFavoritos = document.getElementById("contador-favoritos");
const toast = document.getElementById("toast");

// Guarda os últimos times carregados (por nome ou por liga), pra
// filtrar pelo nome sem precisar fazer uma nova chamada à API.
let ultimosTimesCarregados = [];

// Guarda o nome oficial da liga selecionada no momento, pra conferir
// se um time buscado individualmente realmente pertence a ela.
let ligaAtualSelecionada = "";

// Todo time já exibido na tela, por id. Serve para o botão "Favoritar"
// descobrir quais dados salvar a partir do id que está no botão.
const timesPorId = new Map();

// ---------- Ajudante central de requisições ----------

// Concentra o padrão repetido em toda chamada à API: pedir, tratar
// falha de rede, checar se a resposta veio OK, e converter pra JSON.
// Retorna os dados em caso de sucesso, ou `null` se algo deu errado
// (nesse caso, quem chamou deve mostrar o estado de erro).
async function buscarJSON(url) {
  let resposta;
  try {
    resposta = await fetch(url);
  } catch (erro) {
    return null;
  }

  if (!resposta.ok) return null;

  try {
    return await resposta.json();
  } catch (erro) {
    return null;
  }
}

// ---------- Busca direta por nome exato de time ----------

async function buscarPorNome(termo) {
  mostrarCarregando();

  const dados = await buscarJSON(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(termo)}`);

  if (!dados) {
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

  const dados = await buscarJSON(
    `${BASE_URL}/search_all_leagues.php?c=${encodeURIComponent(pais)}&s=${encodeURIComponent(esporte)}`
  );

  if (!dados) {
    mostrarErro();
    return;
  }

  const ligasDaApi = dados.countries || [];
  const nomesFamosos = LIGAS_FAMOSAS[`${esporte}|${pais}`] || [];

  // Junta as ligas famosas (curadas por nós) com as que a API trouxe,
  // sem duplicar. As famosas vêm primeiro e marcadas com "★", já que
  // são as que a maioria das pessoas procura.
  const nomesJaNaApi = new Set(ligasDaApi.map((l) => normalizarTexto(l.strLeague)));

  const ligasFamosas = nomesFamosos
    .filter((nome) => !nomesJaNaApi.has(normalizarTexto(nome)))
    .map((nome) => ({ strLeague: nome, famosa: true }));

  const ligas = [
    ...ligasFamosas,
    ...ligasDaApi.map((l) => ({ strLeague: l.strLeague, famosa: nomesFamosos.some((n) => normalizarTexto(n) === normalizarTexto(l.strLeague)) })),
  ];

  if (ligas.length === 0) {
    mostrarVazio(
      `Não encontramos ligas de "${escaparHTML(pais)}" para esse esporte. Verifique se digitou o nome do país corretamente.`
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
      .map((l) => {
        const rotulo = l.famosa ? `★ ${l.strLeague}` : l.strLeague;
        return `<option value="${escaparHTML(l.strLeague)}">${escaparHTML(rotulo)}</option>`;
      })
      .join("");

  areaSelectLiga.hidden = false;
}

async function buscarPorLiga(ligaNome) {
  ligaAtualSelecionada = ligaNome;
  mostrarCarregando();

  const dados = await buscarJSON(`${BASE_URL}/search_all_teams.php?l=${encodeURIComponent(ligaNome)}`);

  if (!dados) {
    mostrarErro();
    return;
  }

  if (!dados.teams) {
    mostrarVazio(`Não encontramos times cadastrados para "${escaparHTML(ligaNome)}" no momento.`);
    return;
  }

  carregarTimes(dados.teams);
}

// ---------- Buscar um time específico dentro da liga selecionada ----------

async function buscarTimeNaLigaAtual(nomeTime) {
  mostrarCarregando();

  const dados = await buscarJSON(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(nomeTime)}`);

  if (!dados) {
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
  times.forEach((time) => {
    if (time.idTeam) timesPorId.set(String(time.idTeam), time);
  });

  area.innerHTML = times.map((time) => criarCardHTML(time, criarBotaoFavoritarHTML(time))).join("");
  atualizarBotoesFavoritar();
}

// `acoesHTML` é o rodapé do card: nos resultados da busca vai o botão
// "Favoritar"; na seção de favoritos vai o botão "Excluir".
function criarCardHTML(time, acoesHTML = "") {
  const escudo = escaparHTML(time.strBadge || ESCUDO_PLACEHOLDER);
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
        <img class="card__escudo" src="${escudo}" alt="Escudo do ${nome}" loading="lazy" onerror="this.onerror=null; this.src='${ESCUDO_PLACEHOLDER}';">
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
        ${acoesHTML ? `<div class="card__acoes">${acoesHTML}</div>` : ""}
      </div>
    </article>
  `;
}

// Escapa também aspas, porque o texto é usado dentro de atributos HTML
// (alt, src, data-*). Os dados vêm da API e do banco, então nunca são
// inseridos na página sem passar por aqui.
function escaparHTML(valor) {
  const div = document.createElement("div");
  div.textContent = String(valor);
  return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ---------- Favoritos (persistência com Supabase) ----------

// Cria o cliente do Supabase. Se a configuração estiver incompleta ou a
// biblioteca não tiver carregado, devolve `null` e uma explicação — assim
// a busca de times continua funcionando e só os favoritos avisam o motivo.
function criarClienteSupabase() {
  const configurado =
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("SEU-PROJETO") &&
    !SUPABASE_ANON_KEY.includes("SUA_CHAVE");

  if (!configurado) {
    return {
      cliente: null,
      motivo: "O banco de dados ainda não foi configurado (faltam a URL e a chave do Supabase no script.js).",
    };
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    return {
      cliente: null,
      motivo: "Não foi possível carregar a biblioteca do Supabase. Verifique sua conexão com a internet.",
    };
  }

  return { cliente: window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY), motivo: "" };
}

const { cliente: clienteSupabase, motivo: motivoBancoIndisponivel } = criarClienteSupabase();

// Linhas da tabela `favoritos` que já foram carregadas do banco.
let favoritos = [];

function timeParaRegistro(time) {
  const ano = Number.parseInt(time.intFormedYear, 10);

  return {
    id_time: String(time.idTeam),
    nome_time: time.strTeam || "Time sem nome",
    escudo_url: time.strBadge || null,
    liga: time.strLeague || null,
    esporte: time.strSport || null,
    pais: time.strCountry || null,
    estadio: time.strStadium || null,
    ano_fundacao: Number.isFinite(ano) && ano > 0 ? ano : null,
  };
}

// Converte uma linha do banco para o mesmo formato que a API devolve,
// pra reaproveitar o `criarCardHTML` nos favoritos.
function linhaParaTime(linha) {
  return {
    idTeam: linha.id_time,
    strTeam: linha.nome_time,
    strBadge: linha.escudo_url,
    strLeague: linha.liga,
    strSport: linha.esporte,
    strCountry: linha.pais,
    strStadium: linha.estadio,
    intFormedYear: linha.ano_fundacao,
  };
}

function encontrarFavoritoPorIdTime(idTime) {
  return favoritos.find((f) => String(f.id_time) === String(idTime));
}

let temporizadorToast;

function mostrarToast(mensagem, tipo = "info") {
  toast.textContent = mensagem;
  toast.className = `toast toast--${tipo}`;
  toast.hidden = false;

  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => {
    toast.hidden = true;
  }, 5000);
}

function mensagemDeErroDoBanco(erro) {
  // 42501 = violação de política RLS (a tabela não permite essa operação
  // para a chave anon). É o erro mais comum ao configurar o Supabase.
  if (erro && (erro.code === "42501" || /row-level security/i.test(erro.message || ""))) {
    return "O banco recusou a operação. Confira as políticas (RLS) da tabela favoritos no Supabase.";
  }
  return "Não foi possível falar com o banco de dados. Tente novamente em instantes.";
}

async function carregarFavoritos() {
  if (!clienteSupabase) {
    contadorFavoritos.textContent = "—";
    listaFavoritos.innerHTML = `<p class="estado-erro">${escaparHTML(motivoBancoIndisponivel)}</p>`;
    return;
  }

  try {
    const { data, error } = await clienteSupabase
      .from(TABELA_FAVORITOS)
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) throw error;

    favoritos = data || [];
    renderizarFavoritos();
  } catch (erro) {
    console.error("Erro ao listar favoritos:", erro);
    contadorFavoritos.textContent = "—";
    listaFavoritos.innerHTML = `<p class="estado-erro">${escaparHTML(mensagemDeErroDoBanco(erro))}</p>`;
  }
}

function renderizarFavoritos() {
  contadorFavoritos.textContent = String(favoritos.length);

  if (favoritos.length === 0) {
    listaFavoritos.innerHTML = `
      <p class="estado-vazio">
        Você ainda não favoritou nenhum time. Busque um time e clique em
        "☆ Favoritar" para guardá-lo aqui.
      </p>
    `;
  } else {
    listaFavoritos.innerHTML = favoritos
      .map((linha) => {
        const botaoExcluir = `
          <button type="button" class="botao-excluir-favorito" data-id="${escaparHTML(linha.id)}">
            Excluir
          </button>
        `;
        return criarCardHTML(linhaParaTime(linha), botaoExcluir);
      })
      .join("");
  }

  atualizarBotoesFavoritar();
}

function criarBotaoFavoritarHTML(time) {
  if (!time.idTeam) return "";

  return `
    <button type="button" class="botao-favoritar" data-id-time="${escaparHTML(time.idTeam)}" aria-pressed="false">
      ☆ Favoritar
    </button>
  `;
}

// Sincroniza todos os botões "Favoritar" da tela com a lista de favoritos
// (marcado = já está salvo no banco).
function atualizarBotoesFavoritar() {
  document.querySelectorAll(".botao-favoritar").forEach((botao) => {
    const favorito = Boolean(encontrarFavoritoPorIdTime(botao.dataset.idTime));
    botao.setAttribute("aria-pressed", String(favorito));
    botao.classList.toggle("is-ativo", favorito);
    botao.textContent = favorito ? "★ Favoritado" : "☆ Favoritar";
    botao.title = favorito ? "Clique para remover dos favoritos" : "Salvar nos favoritos";
  });
}

// CREATE — salva o time no banco.
async function salvarFavorito(time) {
  const { data, error } = await clienteSupabase
    .from(TABELA_FAVORITOS)
    .insert(timeParaRegistro(time))
    .select()
    .single();

  if (error) {
    // 23505 = violação de unicidade: o time já está salvo (por exemplo,
    // favoritado em outra aba). Só recarregamos a lista.
    if (error.code === "23505") {
      mostrarToast("Esse time já estava nos favoritos.", "info");
      await carregarFavoritos();
      return;
    }
    throw error;
  }

  favoritos = [data, ...favoritos];
  renderizarFavoritos();
  mostrarToast(`${time.strTeam} foi para os favoritos.`, "sucesso");
}

// DELETE — remove o registro do banco.
async function removerFavorito(id) {
  // O `.select()` devolve as linhas apagadas. Com RLS mal configurada o
  // Supabase não dá erro: simplesmente não apaga nada. Conferir o retorno
  // evita dizer que excluiu quando na verdade não excluiu.
  const { data, error } = await clienteSupabase
    .from(TABELA_FAVORITOS)
    .delete()
    .eq("id", id)
    .select();

  if (error) throw error;

  if (!data || data.length === 0) {
    await carregarFavoritos();
    mostrarToast("Não foi possível excluir esse favorito. Confira as políticas (RLS) da tabela no Supabase.", "erro");
    return;
  }

  favoritos = favoritos.filter((f) => String(f.id) !== String(id));
  renderizarFavoritos();
  mostrarToast("Favorito removido.", "info");
}

async function alternarFavorito(botao) {
  if (!clienteSupabase) {
    mostrarToast(motivoBancoIndisponivel, "erro");
    return;
  }

  const idTime = botao.dataset.idTime;
  const time = timesPorId.get(String(idTime));
  if (!time) return;

  botao.disabled = true;

  try {
    const existente = encontrarFavoritoPorIdTime(idTime);
    if (existente) {
      await removerFavorito(existente.id);
    } else {
      await salvarFavorito(time);
    }
  } catch (erro) {
    console.error("Erro ao atualizar favorito:", erro);
    mostrarToast(mensagemDeErroDoBanco(erro), "erro");
  } finally {
    botao.disabled = false;
  }
}

async function excluirFavoritoDaLista(botao) {
  if (!clienteSupabase) return;

  botao.disabled = true;

  try {
    await removerFavorito(botao.dataset.id);
  } catch (erro) {
    console.error("Erro ao excluir favorito:", erro);
    mostrarToast(mensagemDeErroDoBanco(erro), "erro");
    botao.disabled = false;
  }
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

selectLiga.addEventListener("change", () => {
  const liga = selectLiga.value;
  if (liga) buscarPorLiga(liga);
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
  const botaoFavoritar = evento.target.closest(".botao-favoritar");
  if (botaoFavoritar) {
    alternarFavorito(botaoFavoritar);
    return;
  }

  const botaoBuscarTime = evento.target.closest(".botao-buscar-time-liga");
  if (botaoBuscarTime) buscarTimeNaLigaAtual(botaoBuscarTime.dataset.termo);
});

listaFavoritos.addEventListener("click", (evento) => {
  const botaoExcluir = evento.target.closest(".botao-excluir-favorito");
  if (botaoExcluir) excluirFavoritoDaLista(botaoExcluir);
});

popularSelectEsportes();
carregarFavoritos();