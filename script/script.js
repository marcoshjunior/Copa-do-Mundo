// URL que retorna 32 seleções
const API_URL =
  "https://development-internship-api.geopostenergy.com/WorldCup/GetAllTeams";
// URL para enviar o resultado final
const POST_URL =
  "https://development-internship-api.geopostenergy.com/WorldCup/FinalResult";
// Meu usuário GIT
const GIT_USER = "marcos";

// Função Principal
async function iniciarSimulacao() {
  // Limpa a tela antes de começar
  document.getElementById("output").innerHTML = "";

  // 1. Busca os times da API
  const times = await buscarTimes();

  // Validação: precisa ter exatamente 32 times
  if (!times || times.length !== 32) {
    console.error("Erro: quantidade de times inválida");
    return;
  }

  // Mostra os times no console (debug)
  console.group("Times recebidos");
  console.table(times.map((t) => ({ nome: t.nome, id: t.token })));
  console.groupEnd();

  // 2. Criar grupos (A até H)
  const grupos = criarGrupos(times);

  // 3. Mostrar grupos na tela
  exibirGrupos(grupos);

  // 4. Simular jogos da fase de grupos
  const jogosGrupos = simularFaseDeGrupos(grupos);

  // 5. Exibir jogos
  exibirJogosGrupos(jogosGrupos);

  // 6. Mostrar tabela com pontos e saldo
  exibirTabelaGrupos(grupos);
  mostrarTabela(grupos); // versão console

  // 7. Classificar os dois melhores de cada grupo
  const classificados = classificarTimes(grupos);

  // 8. Simular mata-mata até a final
  const resultado = simularMataMata(classificados);

  // Mostrar mata-mata na tela
  exibirMataMata(resultado.fases);

  // 9. Mostrar campeão
  console.log("Campeão", resultado.campeao);

  // Validação final antes de enviar
  if (!resultado.final) {
    console.error("Erro na final!");
    return;
  }

  console.log("===== FINAL =====");
  console.log(resultado.final);

  enviarResultadoFinal(resultado.final);
}

// Buscar Times
async function buscarTimes() {
  // Faz a requisição HTTP GET para API
  const response = await fetch(API_URL, {
    headers: {
      // API exige header obrigatorio
      "git-user": GIT_USER,
    },
  });

  // Converte os times para JSON
  const data = await response.json();

  // Garante que veio um array
  if (!Array.isArray(data)) {
    console.error("Formato inesperado da API");
    return [];
  }
  return data; // Retorna os times
}

// Embaralhar Times
function embaralhar(array) {
  // Verifica se o array existe
  if (!array) {
    console.error("ERRO: array está undefined!");
    return;
  }
  // Inicia no final do array e vai até o começo
  // 31, 30, 29
  // Cada passo trava um elemento no final
  for (let i = array.length - 1; i > 0; i--) {
    // Math.random numero entre 0 e 0.999
    // * (i + 1) ajusta o intervalo
    // Math.floor arredonda para baixo
    // j pode ser qualquer posição de 0 e i
    const j = Math.floor(Math.random() * (i + 1));
    // Troca o elemento da posição i com o da j
    // Sintaxe: [a, b] = [b, a]
    // Ex: array[5] troca com array[2]
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Criar Grupos
function criarGrupos(times) {
  embaralhar(times); // Embaralha os times primeiro

  // Objeto que armazena os grupos
  // A: [time1, time2, time3, time4],
  // B: [time5, time6, time7, time8],
  const grupos = {};

  // String com as letras dos grupos
  const letras = "ABCDEFGH";

  // Loop que cria 8 grupos (0 ate 7)
  for (let i = 0; i < 8; i++) {
    // Para cada grupo: 4 times do array
    grupos[letras[i]] = times
      // slice pega um pedaço do array para fazer o grupo de 4
      // i = 0 → pega do 0 ao 3 (Grupo A)
      // i = 1 → pega do 4 ao 7 (Grupo B)
      .slice(i * 4, i * 4 + 4)
      // Transforma cada time em novo objeto
      // Adaptando ao formato vindo da API
      .map((time) => ({
        id: time.token, // id único de cada time
        name: time.nome, // Nome do time
        pontos: 0, // Ponto inicial
        saldo: 0, // Saldo de gols inivial
      }));
  }
  return grupos; // Retorna 8 grupos organizados
}

// Exibir Grupos
function exibirGrupos(grupos) {
  // Onde tudo será exibido
  const output = document.getElementById("output");
  // Adciona um h2 na div
  output.innerHTML += "<h2>Grupos</h2>";

  // Percorre todos os grupos (A, B... H)
  for (let grupo in grupos) {
    // cria uma div para cada grupo
    const div = document.createElement("div");
    // adciona uma classe CSS na div
    div.classList.add("grupo");
    // monta o conteudo dentro da div
    div.innerHTML =
      // titulo do grupo
      // grupos[grupo] é o array de times do grupo
      // .map pervorre cara time e transforma em p
      `<h3>Grupo ${grupo}</h3>
      <ul class="lista-times">
        ${grupos[grupo]
          .map((t) => `<li>${t.name}</li>`)
          // junta tudo em uma única string sem virgulas
          .join("")}
      </ul>
      `;
    // adciona essa div dentro do output
    output.appendChild(div);
  }
}

// Exibir grupos no console por tabela
function mostrarTabela(grupos) {
  console.log("\n===== TABELA DOS GRUPOS =====");

  // Percorre os grupos
  for (let grupo in grupos) {
    console.log(`\nGrupo ${grupo}`);

    // [] Cria uma copia do array de times
    // .sort ordena os times com base em regras de classificação
    const ordenado = [...grupos[grupo]].sort((a, b) => {
      // mais pontos vem primeiro
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      // se empatar em pontos, usa saldo de gols
      if (b.saldo !== a.saldo) return b.saldo - a.saldo;
      // se empatar, faz um sorteio aleatorio
      return Math.random() - 0.5;
    });
    // Mostra dados em forma de tabela
    console.table(
      // Transforma cada time em objeto (define colunas da tabela)
      ordenado.map((t) => ({
        // Nome da coluna e valor
        Time: t.name,
        Pontos: t.pontos,
        Saldo: t.saldo,
      })),
    );
  }
}

// Simular Jogo
function simularJogo(timeA, timeB) {
  // Gera gols aleatórios para time A e B de 0 a 4
  const golsA = Math.floor(Math.random() * 5);
  const golsB = Math.floor(Math.random() * 5);

  // Atualiza o saldo de gols do time A e B
  // Ex: fez 3 e tomou 1, saldo: +2
  timeA.saldo += golsA - golsB;
  timeB.saldo += golsB - golsA;

  // Se time A fez mais, venceu +3 pontos
  if (golsA > golsB) timeA.pontos += 3;
  // Se time B fez mais, venceu +3 pontos
  else if (golsB > golsA) timeB.pontos += 3;
  // Se empatar cada um ganha 1 ponto
  else {
    timeA.pontos += 1;
    timeB.pontos += 1;
  }

  return { golsA, golsB }; // retorna o resultado do jogo (gols)
}

// Fase de Grupos
function simularFaseDeGrupos(grupos) {
  // Vai guardar todos os jogos de cada grupo
  // A: [jogo1, jogo2, ...],
  // B: [jogo1, jogo2, ...]
  let jogosPorGrupo = {};

  // Percorre cada grupo
  for (let grupo in grupos) {
    // pega os times daquele grupo
    const times = grupos[grupo];
    // array vazia para armazenar os jogos do mesmo grupo
    jogosPorGrupo[grupo] = [];

    // Primeiro loop, escolhe o primeiro time
    for (let i = 0; i < times.length; i++) {
      // Segundo loop, escolhe o adversario
      // j = i + 1 evita repetir jogos e contra ele mesmo
      for (let j = i + 1; j < times.length; j++) {
        // Simula o jogo entre os 2 e atualiza pontos e saldo da tabela
        const resultado = simularJogo(times[i], times[j]);
        // Guarda o resultado do jogo no objeto
        jogosPorGrupo[grupo].push({
          // nome dos times
          timeA: times[i].name,
          timeB: times[j].name,
          // placar
          golsA: resultado.golsA,
          golsB: resultado.golsB,
        });
        // Mostra o resultado no console
        console.log(
          `${times[i].name} ${resultado.golsA} x ${resultado.golsB} ${times[j].name}`,
        );
      }
    }
  }
  return jogosPorGrupo; // Retorna todos os jogos organizados por grupo
}

// Exibir jogos dos grupos
function exibirJogosGrupos(jogosPorGrupo) {
  // div os tudo sera exibido
  const output = document.getElementById("output");
  // adciona um titudo a página
  output.innerHTML += "<h2>Jogos da Fase de Grupos</h2>";

  // Percorre cada grupo
  for (let grupo in jogosPorGrupo) {
    // div que representa o grupo
    const div = document.createElement("div");
    // coloca o titulo do grupo
    div.innerHTML = `<h3>Grupo ${grupo}</h3>`;
    // percorre todos os jogos daquele grupo
    jogosPorGrupo[grupo].forEach((jogo) => {
      // para cada jogo, adciona uma linha com o placar
      div.innerHTML += `
        <div class="jogo">
          <span class="time">${jogo.timeA}</span>
          <span class="placar">${jogo.golsA} x ${jogo.golsB}</span>
          <span class="time">${jogo.timeB}</span>
        </div>
      `;
    });
    // adciona essa div com todos od jogos do grupo na tela
    output.appendChild(div);
  }
}

// Exibe a fase de grupos com os jogos já realizados no HTML
function exibirTabelaGrupos(grupos) {
  // Pega a div princiál
  const output = document.getElementById("output");
  // Adciona um titulo para a seção da tabela
  output.innerHTML += "<h2>Tabela dos Grupos</h2>";

  // percorre os grupos
  for (let grupo in grupos) {
    // cria uma tabela HTML para cada grupo
    const tabela = document.createElement("table");

    // cria uma cópia do array de times do grupo e os ordena
    const ordenado = [...grupos[grupo]].sort((a, b) => {
      // mais pontos aparece primeiro
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      // mais saldo de gols
      if (b.saldo !== a.saldo) return b.saldo - a.saldo;
      // desempate aleatório
      return Math.random() - 0.5;
    });
    // monta toda a estrutura da tabela com HTML
    tabela.innerHTML = `
      <!-- Título do grupo -->
      <tr><th colspan="3">Grupo ${grupo}</th></tr>

      <!-- Cabeçalho das colunas -->
      <tr><th>Time</th><th>Pontos</th><th>Saldo</th></tr>

      <!-- Linhas dos times -->
      ${ordenado
        .map(
          (t) => `
        <tr>
          <td>${t.name}</td>
          <td>${t.pontos}</td>
          <td>${t.saldo}</td>
        </tr>`,
        )
        // Junta todas as linhas em uma única string HTML
        .join("")}
    `;

    output.appendChild(tabela); // Adiciona a tabela na tela
  }
}

// Classificação
function classificarTimes(grupos) {
  // array que guarda os times classificados (16)
  let classificados = [];

  // Percorre os grupos
  for (let grupo in grupos) {
    // ordena os times/array original dentro do grupo
    const ordenado = grupos[grupo].sort((a, b) => {
      // mais pontos vem primeiro
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      // saldo de gols
      if (b.saldo !== a.saldo) return b.saldo - a.saldo;
      // desempate aleatório
      return Math.random() - 0.5;
    });
    // Pega os dois primeiros dos grupos
    // (posição 0 = 1º lugar, posição 1 = 2º lugar)
    classificados.push(ordenado[0], ordenado[1]);
  }
  // Retorna todos os classificados (16 times)
  return classificados;
}

// Mata-Mata
function simularMataMata(times) {
  // 'rodada' começa com os 16 classificados
  let rodada = times;
  // Número da fase (1 = oitavas, 2 = quartas, etc.)
  let fase = 1;
  // Aqui guarda os dados da FINAL (para enviar pra API)
  let finalData = null;
  // Aqui guarda todas as fases (para exibir no HTML)
  let fases = [];

  // Continua até sobrar apenas o cammpeão
  while (rodada.length > 1) {
    console.log(`\n===== FASE ${fase} =====`);
    // Array com os vencedores da rodada atual
    let vencedores = [];
    // Array com todos os jogos da fase (para exibir depois)
    let jogosDaFase = [];

    // Percorre os times de 2 em 2 (mata-mata sempre em pares)
    for (let i = 0; i < rodada.length; i += 2) {
      const timeA = rodada[i];
      const timeB = rodada[i + 1];
      // Gera gols aleatórios
      let golsA = Math.floor(Math.random() * 5);
      let golsB = Math.floor(Math.random() * 5);
      // Pênaltis começam zerados
      let penA = 0;
      let penB = 0;

      // Se empatar, vai para os pênaltis
      if (golsA === golsB) {
        penA = Math.floor(Math.random() * 5);
        penB = Math.floor(Math.random() * 5);
        console.log(
          `${timeA.name} ${golsA} x ${golsB} ${timeB.name} (Pênaltis: ${penA} x ${penB})`,
        );
        // Garante que não termine empatado nos pênaltis
        if (penA === penB) penA++;
        // Define o vencedor pelos pênaltis
        vencedores.push(penA > penB ? timeA : timeB);
      } else {
        // Vitória normal
        vencedores.push(golsA > golsB ? timeA : timeB);
        console.log(`${timeA.name} ${golsA} x ${golsB} ${timeB.name}`);
      }
      // Salva os dados desse jogo (para mostrar no HTML)
      jogosDaFase.push({
        timeA: timeA.name,
        timeB: timeB.name,
        golsA,
        golsB,
        penA: golsA === golsB ? penA : null,
        penB: golsA === golsB ? penB : null,
      });
      // Se só existem 2 times na rodada → é a FINAL
      if (rodada.length === 2) {
        finalData = {
          equipeA: timeA.id,
          equipeB: timeB.id,
          golsEquipeA: golsA,
          golsEquipeB: golsB,
          golsPenaltyTimeA: penA,
          golsPenaltyTimeB: penB,
        };
      }
    }
    // Salva todos os jogos dessa fase
    fases.push(jogosDaFase);
    // Os vencedores viram a próxima rodada
    rodada = vencedores;
    // Avança para próxima fase
    fase++;
  }
  // Retorna tudo que precisamos
  return {
    // Campeão final
    campeao: {
      id: rodada[0].id,
      name: rodada[0].name,
    },
    // Dados da final (para enviar à API)
    final: finalData,
    // Todas as fases (para exibir no HTML)
    fases,
  };
}

// Exibe o mata-mata no html
function exibirMataMata(fases) {
  // Pega a div principal
  const output = document.getElementById("output");
  // Adcinona o título a seção de mata-mata
  output.innerHTML += "<h2>Mata-Mata</h2>";

  // Percorre todas as fases (oitavas, quartas... final)
  fases.forEach((fase, index) => {
    // cria uma div para cada fase
    const div = document.createElement("div");
    // mostra o nome da fase (Fase 1, Fase 2...)
    div.innerHTML = `<h3>Fase ${index + 1}</h3>`;

    // percorre todos os jogos dentro dessa fase
    fase.forEach((jogo) => {
      // adciona cada jogo como um paragrafo
      div.innerHTML += `
        <div class="jogo">
          <span class="time">${jogo.timeA}</span>
          <span class="placar">
            ${jogo.golsA} x ${jogo.golsB}
            ${
              jogo.penA !== null
                ? `
                <smal>
                  (${jogo.penA} x ${jogo.penB})
                </smal>
              `
                : ""
            }
          </span>
          <span class="time">${jogo.timeB}</span>
        </div>
      `;
    });
    // Adciona essa fase completa na tela
    output.appendChild(div);
  });
}

// Enviar Resultado
async function enviarResultadoFinal(final) {
  // Envia uma requisição HTTP a API usando fetch
  // await espera a resposta
  await fetch(POST_URL, {
    // POST para enviar dados
    method: "POST",
    // Cabeçalho da requisição
    headers: {
      // Informa que o envio é JSON
      "Content-Type": "application/json",
      // Identificação do usuário
      "git-user": GIT_USER,
    },
    // Corpo da requisição (dados da final)
    // Converte o objeto JS para JSON (string)
    body: JSON.stringify(final),
  });
  console.log("Resultado enviado!");
}
