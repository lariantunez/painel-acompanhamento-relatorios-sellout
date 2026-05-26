// ══════════════════════════════════════════════════════════════════
// Apps Script — Controle SellOut
// ══════════════════════════════════════════════════════════════════
// Após editar, vá em Implantar > Gerenciar implantações >
// clique no lápis > "Nova versão" > Implantar
// A URL NÃO muda entre versões.
// ══════════════════════════════════════════════════════════════════

const SHEET_ID = '11tJi_wAACViuVoKmxHsWUGRYbQ9G1oisf767Hph0nJg';

// Nome exato da aba de representantes
const ABA_REPRESENTANTES = 'Representantes';

// Colunas esperadas nas abas de dados (case-insensitive no match)
// A planilha deve ter um cabeçalho na linha 1.
// Novas colunas adicionadas:
//   "Ultima Cobrança"       → cobrança via WhatsApp (coluna existente)
//   "Ultima Cobrança Email" → cobrança via email (coluna NOVA — adicionar na planilha)

function doGet(e) {
  const action = e.parameter.action || '';

  try {
    if (action === 'sheets')               return jsonResp(getSheets());
    if (action === 'telefones')            return jsonResp(getTelefones());
    if (action === 'emailsRepresentantes') return jsonResp(getEmailsRepresentantes());
    if (action === 'registrarCobranca')    return jsonResp(registrarCobranca(e, 'whatsapp'));
    if (action === 'registrarCobrancaEmail') return jsonResp(registrarCobranca(e, 'email'));
    // default: retorna linhas da aba
    return jsonResp(getRows(e.parameter.sheet || ''));
  } catch(err) {
    return jsonResp({ error: err.message });
  }
}

// ──────────────────────────────────────────────────────────────────
// HELPER: resposta JSON com CORS
// ──────────────────────────────────────────────────────────────────
function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ──────────────────────────────────────────────────────────────────
// Lista abas que batem com o padrão XX_Xxx (ex: 26_Mar)
// ──────────────────────────────────────────────────────────────────
function getSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const pattern = /^\d{2}_[A-Za-z]{3}$/;
  const sheets = ss.getSheets()
    .map(s => s.getName())
    .filter(n => pattern.test(n));
  return { sheets };
}

// ──────────────────────────────────────────────────────────────────
// Retorna linhas de uma aba como array de objetos
// ──────────────────────────────────────────────────────────────────
function getRows(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Aba não encontrada: ' + sheetName);

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { rows: [] };

  const headers = data[0].map(h => String(h).trim());
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // Formata datas
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'dd/MM/yyyy');
      }
      obj[h] = val !== undefined && val !== null ? String(val) : '';
    });
    return obj;
  }).filter(r => Object.values(r).some(v => v.trim()));

  return { rows };
}

// ──────────────────────────────────────────────────────────────────
// Retorna telefones dos representantes (aba Representantes, col B)
// Coluna A = Nome, Coluna B = Telefone
// ──────────────────────────────────────────────────────────────────
function getTelefones() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(ABA_REPRESENTANTES);
  if (!sheet) return { telefones: {} };

  const data = sheet.getDataRange().getValues();
  const telefones = {};
  // Pula linha de cabeçalho (linha 0)
  for (let i = 1; i < data.length; i++) {
    const nome = String(data[i][0] || '').trim();
    const tel  = String(data[i][1] || '').trim();
    if (nome && tel) telefones[nome] = tel;
  }
  return { telefones };
}

// ──────────────────────────────────────────────────────────────────
// Retorna emails dos representantes (aba Representantes, col C)
// Coluna A = Nome, Coluna B = Telefone, Coluna C = Email
// ──────────────────────────────────────────────────────────────────
function getEmailsRepresentantes() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(ABA_REPRESENTANTES);
  if (!sheet) return { emails: [], nomes: [] };

  const data = sheet.getDataRange().getValues();
  const emails = [], nomes = [];

  for (let i = 1; i < data.length; i++) {
    const nome  = String(data[i][0] || '').trim();
    const email = String(data[i][2] || '').trim(); // coluna C
    if (nome && email && email.includes('@')) {
      nomes.push(nome);
      emails.push(email);
    }
  }
  return { emails, nomes };
}

// ──────────────────────────────────────────────────────────────────
// Registra data/hora da cobrança na aba ativa
// tipo = 'whatsapp' → coluna "Ultima Cobrança"
// tipo = 'email'    → coluna "Ultima Cobrança Email"
//
// Grava em TODAS as linhas do representante informado
// ──────────────────────────────────────────────────────────────────
function registrarCobranca(e, tipo) {
  const sheetName     = e.parameter.sheet || '';
  const representante = (e.parameter.representante || '').trim();

  if (!sheetName || !representante) {
    return { ok: false, error: 'Parâmetros ausentes: sheet e representante são obrigatórios.' };
  }

  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: 'Aba não encontrada: ' + sheetName };

  const data    = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());

  // Determina qual coluna usar
  const colLabel = tipo === 'email' ? 'Ultima Cobrança Email' : 'Ultima Cobrança';
  let colIdx = headers.indexOf(colLabel);

  // Se a coluna não existir ainda, cria ao final
  if (colIdx === -1) {
    colIdx = headers.length;
    sheet.getRange(1, colIdx + 1).setValue(colLabel);
  }

  // Coluna do representante
  const repColIdx = headers.indexOf('Representante');
  if (repColIdx === -1) return { ok: false, error: 'Coluna "Representante" não encontrada.' };

  const agora = Utilities.formatDate(
    new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'
  );

  let gravadas = 0;
  for (let i = 1; i < data.length; i++) {
    const repNome = String(data[i][repColIdx] || '').trim();
    if (repNome.toLowerCase() === representante.toLowerCase()) {
      sheet.getRange(i + 1, colIdx + 1).setValue(agora);
      gravadas++;
    }
  }

  // Força flush imediato
  SpreadsheetApp.flush();

  return { ok: true, gravadas, data: agora, coluna: colLabel };
}
