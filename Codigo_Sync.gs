// ═══════════════════════════════════════════════════════════
// GESTÃO CH v2 — Google Apps Script (Sync Only)
// Planilha: 17eiW1uAjZs6EpWsiHQTumPphffrQMCxlLUcWqgvO6mM
// Função: receber dados do app standalone e salvar na planilha
// ═══════════════════════════════════════════════════════════

var SPREADSHEET_ID = '17eiW1uAjZs6EpWsiHQTumPphffrQMCxlLUcWqgvO6mM';
var TIMEZONE       = 'America/Bahia';

// Cabeçalhos das abas
var CABECALHOS = {
  Clientes:  ['ID','TIPO','STATUS','NOME','CODIGO','CPF','SENHA','2FA','TELEFONE','WHATSAPP',
               'NASCIMENTO','NATURALIDADE','PROFISSAO','ESTADO_CIVIL','RG','ORGAO','NUM_TITULO',
               'PAI','MAE','ENDERECO','CIDADE','CEP','LAT','LNG',
               'NOME_PROP','CPF_PROP','RG_PROP','ORGAO_PROP',
               'ULTIMO_VISTO','COMPLETO','CRIADO','ATUALIZADO'],
  Servicos:  ['ID','CLIENTE_ID','TIPO','ARMA','STATUS','OBS','DATA_ABERTURA','DATA_PROTOCOLO','CRIADO','ATUALIZADO'],
  GRUs:      ['ID','SERVICO_ID','CLIENTE_ID','CLIENTE_NOME','TIPO_SERVICO','ARMA','STATUS','VENCIMENTO','DATA_PAG','CRIADO'],
  Alunos:    ['ID','NOME_ALUNO','CLIENTE_ID','CURSO','DATA_AULA','TELEFONE','STATUS','OBS','CRIADO','ATUALIZADO'],
  Bloqueios: ['ID','DATA','MOTIVO','CRIADO']
};

// ─── ENDPOINT PRINCIPAL ────────────────────────────────────
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action  = e.parameter.action || payload.action || 'sync';
    var result  = {};

    if (action === 'sync') {
      // Receber e salvar dados do app
      if (payload.clientes)  result.clientes  = syncAba('Clientes',  payload.clientes,  'ID');
      if (payload.servicos)  result.servicos  = syncAba('Servicos',   payload.servicos,  'ID');
      if (payload.grus)      result.grus      = syncAba('GRUs',       payload.grus,       'ID');
      if (payload.alunos)    result.alunos    = syncAba('Alunos',     payload.alunos,     'ID');
      if (payload.bloqueios) result.bloqueios = syncAba('Bloqueios',  payload.bloqueios,  'ID');
      result.ok = true;
      result.ts = _agora();

    } else if (action === 'getData') {
      // Enviar todos os dados para o app (carga inicial)
      result.clientes  = lerAba('Clientes');
      result.servicos  = lerAba('Servicos');
      result.grus      = lerAba('GRUs');
      result.alunos    = lerAba('Alunos');
      result.bloqueios = lerAba('Bloqueios');
      result.ok = true;
    }

    return _json(result);
  } catch(err) {
    return _json({ok:false, erro:err.message});
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action || 'getData';
    var result = {};

    if (action === 'getData') {
      result.clientes  = lerAba('Clientes');
      result.servicos  = lerAba('Servicos');
      result.grus      = lerAba('GRUs');
      result.alunos    = lerAba('Alunos');
      result.bloqueios = lerAba('Bloqueios');
      result.ok = true;
    } else if (action === 'ping') {
      result = {ok:true, ts:_agora(), msg:'Gestão CH v2 online'};
    }

    return _json(result);
  } catch(err) {
    return _json({ok:false, erro:err.message});
  }
}

// ─── SYNC DE ABA ──────────────────────────────────────────
function syncAba(nomeAba, dados, campoID) {
  var ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh  = _garantirAba(ss, nomeAba);
  var cab = CABECALHOS[nomeAba];

  // Ler registros existentes
  var existentes = {};
  var ultLinha   = sh.getLastRow();
  if (ultLinha > 1) {
    var vals = sh.getRange(2, 1, ultLinha-1, cab.length).getValues();
    vals.forEach(function(row, i) {
      var id = String(row[0] || '');
      if (id) existentes[id] = { row: i+2, data: row };
    });
  }

  var inseridos = 0, atualizados = 0;

  dados.forEach(function(obj) {
    var id = String(obj[campoID] || obj.id || '');
    if (!id) return;

    var linha = cab.map(function(k) {
      return obj[k] !== undefined ? obj[k] : (obj[k.toLowerCase()] !== undefined ? obj[k.toLowerCase()] : '');
    });

    if (existentes[id]) {
      // Atualizar
      sh.getRange(existentes[id].row, 1, 1, cab.length).setValues([linha]);
      atualizados++;
    } else {
      // Inserir
      sh.appendRow(linha);
      inseridos++;
    }
  });

  return {inseridos:inseridos, atualizados:atualizados, total:dados.length};
}

// ─── LER ABA → ARRAY DE OBJETOS ───────────────────────────
function lerAba(nomeAba) {
  var ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh  = _garantirAba(ss, nomeAba);
  var ult = sh.getLastRow();
  if (ult <= 1) return [];

  var cab  = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var vals = sh.getRange(2, 1, ult-1, cab.length).getValues();

  return vals.filter(function(r){ return r[0]; }).map(function(r) {
    var obj = {};
    cab.forEach(function(k, i){ obj[k] = r[i] !== undefined ? String(r[i]) : ''; });
    return obj;
  });
}

// ─── GARANTIR ABA COM CABEÇALHO ───────────────────────────
function _garantirAba(ss, nome) {
  var sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    var cab = CABECALHOS[nome];
    if (cab) {
      sh.getRange(1, 1, 1, cab.length).setValues([cab]);
      sh.getRange(1, 1, 1, cab.length).setFontWeight('bold')
        .setBackground('#0d1525').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

// ─── UTILITÁRIOS ──────────────────────────────────────────
function _agora() {
  return Utilities.formatDate(new Date(), 'America/Bahia', 'dd/MM/yyyy HH:mm:ss');
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── INICIALIZAR ABAS ─────────────────────────────────────
function inicializarAbas() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.keys(CABECALHOS).forEach(function(nome) {
    _garantirAba(ss, nome);
    Logger.log('Aba ' + nome + ' OK');
  });
  Logger.log('✅ Todas as abas inicializadas em ' + _agora());
}

// ─── TESTE ────────────────────────────────────────────────
function testar() {
  Logger.log('=== TESTE GESTÃO CH v2 ===');
  Logger.log('Planilha: ' + SPREADSHEET_ID);
  Logger.log('Hora atual: ' + _agora());

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var abas = ss.getSheets().map(function(s){return s.getName();});
  Logger.log('Abas existentes: ' + abas.join(', '));

  // Contar registros
  Object.keys(CABECALHOS).forEach(function(nome) {
    var sh = ss.getSheetByName(nome);
    if (sh) Logger.log(nome + ': ' + Math.max(0, sh.getLastRow()-1) + ' registros');
  });
  Logger.log('========================');
}
