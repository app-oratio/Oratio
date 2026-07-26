(function () {
  'use strict';

  var SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';
  var MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  var MONTH_DEVOTIONS = [
    'Mês do Santíssimo Nome de Nosso Senhor Jesus Cristo',
    'Mês da Sagrada Família de Nazaré',
    'Mês do Glorioso São José, Esposo da Virgem Maria',
    'Mês da Santíssima Eucaristia e do Espírito Santo Paráclito',
    'Mês da Santíssima Virgem Maria',
    'Mês do Sacratíssimo Coração de Jesus',
    'Mês do Preciosíssimo Sangue de Nosso Senhor Jesus Cristo',
    'Mês das Santas Vocações e da Vida Consagrada',
    'Mês das Sagradas Escrituras',
    'Mês do Sacratíssimo Rosário da Bem-Aventurada Virgem Maria',
    'Mês das Santas Almas do Purgatório',
    'Mês do Advento e do Nascimento do Salvador'
  ];
  var WEEKDAY_NAMES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

  function normalizeText(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function canonicalKey(value) {
    return normalizeText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function directValue(object, aliases) {
    if (!isPlainObject(object)) return undefined;
    var map = {};
    Object.keys(object).forEach(function (key) {
      map[canonicalKey(key)] = key;
    });
    for (var index = 0; index < aliases.length; index += 1) {
      var actual = map[canonicalKey(aliases[index])];
      if (actual !== undefined && object[actual] !== null && object[actual] !== '') {
        return object[actual];
      }
    }
    return undefined;
  }

  function scalarText(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return normalizeText(value);
    if (Array.isArray(value)) return value.map(scalarText).filter(Boolean).join(', ');
    if (isPlainObject(value)) {
      return scalarText(directValue(value, [
        'nome', 'name', 'titulo', 'título', 'title', 'valor', 'value', 'label'
      ]));
    }
    return '';
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function validIsoDate(year, month, day) {
    var date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) return '';
    return [year, pad2(month), pad2(day)].join('-');
  }

  function looksLikeSlug(value) {
    var text = normalizeText(value);
    return /^\/?[a-z0-9][a-z0-9-]+\/?$/i.test(text) && text.indexOf('-') >= 0;
  }

  function humanizeSlug(value) {
    var text = normalizeText(value)
      .replace(/^https?:\/\/[^/]+/i, '')
      .replace(/^\/+|\/+$/g, '')
      .split('/').filter(Boolean).pop() || '';
    text = text.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  }

  function collectStrings(value, depth, output) {
    if (depth > 5 || value === null || value === undefined) return;
    if (typeof value === 'string' || typeof value === 'number') {
      var text = normalizeText(value);
      if (text) output.push(text);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(function (item) { collectStrings(item, depth + 1, output); });
      return;
    }
    if (isPlainObject(value)) {
      Object.keys(value).forEach(function (key) {
        collectStrings(value[key], depth + 1, output);
      });
    }
  }


function colorTokens(value) {
  var result = [];
  var visited = typeof WeakSet === 'function' ? new WeakSet() : null;

  function append(item, depth) {
    if (depth > 6 || item === null || item === undefined || item === '') return;

    if ((Array.isArray(item) || isPlainObject(item)) && visited) {
      if (visited.has(item)) return;
      visited.add(item);
    }

    if (Array.isArray(item)) {
      item.forEach(function (nested) { append(nested, depth + 1); });
      return;
    }

    if (isPlainObject(item)) {
      var nested = directValue(item, [
        'nome', 'name', 'cor', 'cores', 'cor litúrgica', 'cor liturgica',
        'color', 'colors', 'valor', 'value', 'label'
      ]);
      if (nested !== undefined) append(nested, depth + 1);
      else Object.keys(item).forEach(function (key) { append(item[key], depth + 1); });
      return;
    }

    normalizeText(item).split(/[,;|/]+/).forEach(function (part) {
      var normalized = canonicalKey(part);
      var label = '';
      if (/branco|white/.test(normalized)) label = 'Branco';
      else if (/vermelho|red/.test(normalized)) label = 'Vermelho';
      else if (/verde|green/.test(normalized)) label = 'Verde';
      else if (/roxo|violeta|purple|violet/.test(normalized)) label = 'Roxo';
      else if (/rosa|rose|pink/.test(normalized)) label = 'Rosa';
      else if (/preto|black/.test(normalized)) label = 'Preto';
      else if (/dourado|ouro|gold/.test(normalized)) label = 'Dourado';
      if (label && result.indexOf(label) === -1) result.push(label);
    });
  }

  append(value, 0);
  return result;
}

  function colorClass(value) {
    var normalized = canonicalKey(value);
    if (/branco|white/.test(normalized)) return 'white';
    if (/vermelho|red/.test(normalized)) return 'red';
    if (/verde|green/.test(normalized)) return 'green';
    if (/roxo|violeta|purple|violet/.test(normalized)) return 'purple';
    if (/rosa|rose|pink/.test(normalized)) return 'rose';
    if (/preto|black/.test(normalized)) return 'black';
    if (/dourado|ouro|gold/.test(normalized)) return 'gold';
    return '';
  }


function normalizeGrade(value) {
  var raw = scalarText(value);
  var normalized = canonicalKey(raw);
  if (!normalized) return { code: '', label: '', kind: 'ferial' };

  if (
    raw === 'S' ||
    /^(s|sol|solen)$/.test(normalized) ||
    /solenidade|solemnity/.test(normalized)
  ) {
    return { code: 'S', label: 'Solenidade', kind: 'solemnity' };
  }

  if (
    raw === 'F' ||
    /^(f|fest)$/.test(normalized) ||
    /festa|feast/.test(normalized)
  ) {
    return { code: 'F', label: 'Festa', kind: 'feast' };
  }

  if (
    raw === 'm' ||
    /^(mf|mfac|memfac)$/.test(normalized) ||
    /memoriafacultativa|facultativa|optionalmemory/.test(normalized)
  ) {
    return { code: 'm', label: 'Memória facultativa', kind: 'optional-memory' };
  }

  if (
    raw === 'M' ||
    /^(m|mem|memo|mobr)$/.test(normalized) ||
    normalized === 'memoria' ||
    /memoriaobrigatoria|obrigatoria|memorial/.test(normalized)
  ) {
    return { code: 'M', label: 'Memória obrigatória', kind: 'memory' };
  }

  return { code: '', label: '', kind: 'ferial' };
}

function inferGradeFromValue(value) {
  var strings = [];
  collectStrings(value, 0, strings);

  for (var index = 0; index < strings.length; index += 1) {
    var direct = normalizeGrade(strings[index]);
    if (direct.code) return direct;
  }

  var combined = canonicalKey(strings.join(' '));
  if (/solenidade|solemnity/.test(combined)) return normalizeGrade('S');
  if (/festa|feast/.test(combined)) return normalizeGrade('F');
  if (/memoriafacultativa|facultativa|optionalmemory/.test(combined)) return normalizeGrade('m');
  if (/memoriaobrigatoria|obrigatoria|memorial/.test(combined)) return normalizeGrade('M');
  return normalizeGrade('');
}

function isPrincipalGrade(grade) {
  return Boolean(grade && (grade.code === 'S' || grade.code === 'F' || grade.code === 'M'));
}

  function bestHumanName(value) {
    var strings = [];
    collectStrings(value, 0, strings);
    var ignored = /^(s|f|m|branco|vermelho|verde|roxo|violeta|rosa|preto|dourado|true|false|sim|nao|não)$/i;
    var candidates = strings.filter(function (text) {
      if (text.length < 5 || /^\d+$/.test(text) || ignored.test(text)) return false;
      if (/^https?:\/\//i.test(text) || /^\/?[a-z0-9-]+\/?$/i.test(text) && text.indexOf('-') >= 0) return false;
      if (/^\d{1,2}[\/-]\d{1,2}/.test(text)) return false;
      return /[A-Za-zÀ-ÿ]/.test(text);
    });
    candidates.sort(function (a, b) { return b.length - a.length; });
    return candidates[0] || '';
  }

  function composeMemoryName(record, fallbackValue) {
    if (!isPlainObject(record)) return bestHumanName(fallbackValue);

    var name = scalarText(directValue(record, [
      'nome completo', 'nomecompleto', 'celebração', 'celebracao', 'nome', 'name',
      'título completo', 'titulo completo', 'titulocompleto', 'título', 'titulo', 'title',
      'memória', 'memoria', 'denominação', 'denominacao'
    ]));
    var complement = scalarText(directValue(record, [
      'subtítulo', 'subtitulo', 'qualificação', 'qualificacao', 'complemento',
      'designação', 'designacao', 'descrição breve', 'descricao breve', 'descricaobreve'
    ]));

    if (!name) name = bestHumanName(record);
    if (!name) name = bestHumanName(fallbackValue);

    if (
      name && complement &&
      canonicalKey(name).indexOf(canonicalKey(complement)) === -1 &&
      complement.length <= 140
    ) {
      name += ', ' + complement.replace(/^[,;:\-\s]+/, '');
    }
    return normalizeText(name);
  }


function memoryFromValue(value, keyHint) {
  var record = isPlainObject(value) ? value : null;
  var id = record ? scalarText(directValue(record, [
    'id', 'id memória', 'id memoria', 'id celebração', 'id celebracao',
    'slug', 'identificador', 'código', 'codigo', 'chave', 'key', 'caminho', 'path', 'url'
  ])) : '';
  if (!id && looksLikeSlug(keyHint)) id = keyHint;

  var name = composeMemoryName(record, value);
  if (!name && id) name = humanizeSlug(id);
  if (!id || !name) return null;

  var gradeValue = record ? directValue(record, [
    'grau', 'grau litúrgico', 'grau liturgico', 'tipo', 'tipo de celebração',
    'tipo de celebracao', 'categoria', 'classificação', 'classificacao',
    'classe', 'classe litúrgica', 'classe liturgica', 'rank', 'celebration rank'
  ]) : undefined;

  var grade = normalizeGrade(gradeValue);
  if (!grade.code) grade = inferGradeFromValue(value);

  var colorValue = record ? directValue(record, [
    'cor', 'cores', 'cor litúrgica', 'cor liturgica', 'color', 'colors'
  ]) : undefined;
  if (colorValue === undefined) colorValue = value;

  var optionalValue = record ? directValue(record, [
    'facultativa', 'facultativo', 'opcional', 'optional', 'is optional', 'isoptional'
  ]) : undefined;

  return {
    id: canonicalKey(id),
    rawId: id,
    name: name,
    grade: grade,
    colors: colorTokens(colorValue),
    optional: grade.kind === 'optional-memory' || optionalValue === true || String(optionalValue).toLowerCase() === 'true',
    raw: value
  };
}

  function createMemoryIndex(payload) {
    var byId = new Map();
    var visited = typeof WeakSet === 'function' ? new WeakSet() : null;

    function add(memory) {
      if (!memory || !memory.id || !memory.name) return;
      var keys = [memory.id];
      var lastSegment = normalizeText(memory.rawId).replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).pop();
      if (lastSegment) keys.push(canonicalKey(lastSegment));
      keys.forEach(function (key) {
        if (key && !byId.has(key)) byId.set(key, memory);
      });
    }

    function visit(value, keyHint, depth) {
      if (depth > 10 || value === null || value === undefined) return;
      if ((isPlainObject(value) || Array.isArray(value)) && visited) {
        if (visited.has(value)) return;
        visited.add(value);
      }

      if (looksLikeSlug(keyHint)) add(memoryFromValue(value, keyHint));

      if (Array.isArray(value)) {
        value.forEach(function (item) { visit(item, '', depth + 1); });
        return;
      }
      if (!isPlainObject(value)) return;

      var explicitId = directValue(value, [
        'id', 'slug', 'identificador', 'código', 'codigo', 'chave', 'key', 'caminho', 'path', 'url'
      ]);
      if (explicitId !== undefined) add(memoryFromValue(value, keyHint));

      Object.keys(value).forEach(function (key) {
        visit(value[key], key, depth + 1);
      });
    }

    visit(payload, '', 0);
    return { byId: byId };
  }

  function resolveMemory(id, memoryIndex) {
    var raw = normalizeText(id);
    if (!raw) return null;
    var key = canonicalKey(raw);
    if (memoryIndex.byId.has(key)) return memoryIndex.byId.get(key);

    var segment = raw.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).pop() || raw;
    var segmentKey = canonicalKey(segment);
    if (memoryIndex.byId.has(segmentKey)) return memoryIndex.byId.get(segmentKey);

    var found = null;
    memoryIndex.byId.forEach(function (memory, storedKey) {
      if (!found && (storedKey.endsWith(segmentKey) || segmentKey.endsWith(storedKey))) found = memory;
    });
    return found;
  }

  function splitIds(value) {
    var result = [];
    function append(item) {
      if (item === null || item === undefined || item === '') return;
      if (Array.isArray(item)) {
        item.forEach(append);
        return;
      }
      if (isPlainObject(item)) {
        var nested = directValue(item, ['id', 'slug', 'código', 'codigo', 'chave', 'key', 'url', 'caminho']);
        if (nested !== undefined) append(nested);
        else Object.keys(item).forEach(function (key) { append(item[key]); });
        return;
      }
      normalizeText(item).split(/[,;|]+/).forEach(function (part) {
        var text = normalizeText(part);
        if (text && result.indexOf(text) === -1) result.push(text);
      });
    }
    append(value);
    return result;
  }

  function isCalendarDayRecord(value) {
    if (!isPlainObject(value)) return false;
    return directValue(value, ['Mês', 'Mes', 'month']) !== undefined &&
      directValue(value, ['Dia', 'day']) !== undefined;
  }

  function extractYearRecords(payload) {
    var best = [];
    var loose = [];
    var visited = typeof WeakSet === 'function' ? new WeakSet() : null;

    function visit(value, depth) {
      if (depth > 8 || value === null || value === undefined) return;
      if ((isPlainObject(value) || Array.isArray(value)) && visited) {
        if (visited.has(value)) return;
        visited.add(value);
      }

      if (Array.isArray(value)) {
        var records = value.filter(isCalendarDayRecord);
        if (records.length > best.length) best = records;
        value.forEach(function (item) { visit(item, depth + 1); });
        return;
      }

      if (!isPlainObject(value)) return;
      if (isCalendarDayRecord(value)) loose.push(value);
      Object.keys(value).forEach(function (key) { visit(value[key], depth + 1); });
    }

    visit(payload, 0);
    if (best.length) return best;
    return loose;
  }


function seasonFromData(code, text) {
  var normalizedCode = canonicalKey(code);
  var source = canonicalKey([code, text].filter(Boolean).join(' '));

  if (/triduo|triduum/.test(source) || /^(tr|ttr|triduo)$/.test(normalizedCode)) {
    return { key: 'triduum', name: 'Tríduo Pascal' };
  }
  if (/quaresma|lent/.test(source) || /^(tq|qu|qua|quaresma)$/.test(normalizedCode)) {
    return { key: 'lent', name: 'Quaresma' };
  }
  if (/advento|advent/.test(source) || /^(ta|ad|adv|advento)$/.test(normalizedCode)) {
    return { key: 'advent', name: 'Advento' };
  }
  if (/pascal|pascoa|easter/.test(source) || /^(tp|pa|pas|pascal)$/.test(normalizedCode)) {
    return { key: 'easter', name: 'Tempo Pascal' };
  }
  if (/natal|epifania|christmas/.test(source) || /^(tn|na|nat|natal)$/.test(normalizedCode)) {
    return { key: 'christmas', name: 'Tempo do Natal' };
  }
  if (/tempocomum|ordinary/.test(source) || /^(tc|co|comum|ordinary)$/.test(normalizedCode)) {
    return { key: 'ordinary', name: 'Tempo Comum' };
  }
  return { key: '', name: '' };
}

  function seasonColor(season, context) {
    var normalized = canonicalKey(context);
    if (/gaudete|laetare/.test(normalized)) return ['Rosa'];
    if (/pentecostes|ramos|paixaodos(enhor)?|sextafeiradapaixao/.test(normalized)) return ['Vermelho'];
    if (season.key === 'ordinary') return ['Verde'];
    if (season.key === 'advent' || season.key === 'lent') return ['Roxo'];
    if (season.key === 'christmas' || season.key === 'easter') return ['Branco'];
    if (season.key === 'triduum') return ['Dourado'];
    return [];
  }

  function ordinal(value, feminine) {
    var number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return '';
    return String(number) + (feminine ? 'ª' : 'º');
  }

  function epiphanySunday(year) {
    for (var day = 2; day <= 8; day += 1) {
      var date = new Date(Date.UTC(year, 0, day));
      if (date.getUTCDay() === 0) return day;
    }
    return 6;
  }


function expandNote(note) {
  var text = normalizeText(note);
  if (!text) return '';

  return text
    .replace(/\bdo\s+(TC|Co)\b/gi, 'do Tempo Comum')
    .replace(/\bdo\s+(TN|Na)\b/gi, 'do Tempo do Natal')
    .replace(/\bdo\s+(TA|Ad)\b/gi, 'do Advento')
    .replace(/\bda\s+(TQ|Qu)\b/gi, 'da Quaresma')
    .replace(/\bda\s+(TP|Pa)\b/gi, 'do Tempo Pascal')
    .replace(/\b(TC|Co)\b/g, 'Tempo Comum')
    .replace(/\b(TN|Na)\b/g, 'Tempo do Natal')
    .replace(/\b(TA|Ad)\b/g, 'Advento')
    .replace(/\b(TQ|Qu)\b/g, 'Quaresma')
    .replace(/\b(TP|Pa)\b/g, 'Tempo Pascal');
}


function ferialTitle(record, isoDate, season, week, note) {
  var parts = dateParts(isoDate);
  var expandedNote = expandNote(note);

  if (season.key === 'christmas') {
    if (week === 0) return 'Oitava de Natal';
    if (week === 1) return 'Antes da Epifania';
    if (week === 2) return 'Depois da Epifania';
  }

  if (season.key === 'lent') {
    if (week === 0) return 'Depois das Cinzas';
    if (week === 6) return 'Semana Santa';
  }

  if (season.key === 'easter' && week === 1) {
    return 'Oitava de Páscoa';
  }

  if (expandedNote && !/^[-–—.]$/.test(expandedNote)) {
    var noteKey = canonicalKey(expandedNote);
    if (
      /domingo|cinzas|semanasanta|oitava|epifania|natal|pascoa|pentecostes|ramos/.test(noteKey)
    ) {
      return expandedNote;
    }
  }

  if (season.key === 'ordinary') {
    return ordinal(week, !parts.isSunday) + (parts.isSunday ? ' Domingo do Tempo Comum' : ' Semana do Tempo Comum');
  }
  if (season.key === 'advent') {
    return ordinal(week, !parts.isSunday) + (parts.isSunday ? ' Domingo do Advento' : ' Semana do Advento');
  }
  if (season.key === 'lent') {
    return ordinal(week, !parts.isSunday) + (parts.isSunday ? ' Domingo da Quaresma' : ' Semana da Quaresma');
  }
  if (season.key === 'easter') {
    return ordinal(week, !parts.isSunday) + (parts.isSunday ? ' Domingo da Páscoa' : ' Semana do Tempo Pascal');
  }
  if (season.key === 'triduum') return 'Tríduo Pascal';
  if (season.key === 'christmas') return 'Tempo do Natal';

  return season.name || 'Tempo litúrgico não informado';
}

  function gradeFromText(text) {
    var normalized = canonicalKey(text);
    if (/solenidade/.test(normalized)) return normalizeGrade('S');
    if (/festa/.test(normalized)) return normalizeGrade('F');
    if (/memoriafacultativa/.test(normalized)) return normalizeGrade('m');
    if (/memoria/.test(normalized)) return normalizeGrade('M');
    return normalizeGrade('');
  }

  function displayOptionalMemory(memory, fallbackId) {
    var name = memory && memory.name ? memory.name : humanizeSlug(fallbackId);
    if (!name) return '';
    if (/\([mM]\)\s*$/.test(name)) return name.replace(/\(M\)\s*$/, '(m)');
    return name + ' (m)';
  }

  function displayCommemoration(memory, fallbackId) {
    var name = memory && memory.name ? memory.name : humanizeSlug(fallbackId);
    if (!name) return '';
    if (/comemora[cç][aã]o/i.test(name)) return name;
    return name + ' (comemoração)';
  }


function normalizeDayRecord(record, year, memoryIndex) {
  var month = Number(directValue(record, ['Mês', 'Mes', 'month']));
  var dayNumber = Number(directValue(record, ['Dia', 'day']));
  var date = validIsoDate(year, month, dayNumber);
  if (!date) return null;

  var week = Number(directValue(record, ['Semana', 'week']));
  if (!Number.isFinite(week)) week = 0;

  var note = scalarText(directValue(record, ['Notas', 'Nota', 'notes', 'note']));
  var tempo = scalarText(directValue(record, [
    'Tempo', 'tempo litúrgico', 'tempo liturgico', 'season'
  ]));

  var mainIds = splitIds(directValue(record, [
    'ID Ferial', 'idferial', 'ID Celebração', 'idcelebracao', 'ID Principal', 'idprincipal'
  ]));
  var commemorationIds = splitIds(directValue(record, [
    'ID Comemoração', 'idcomemoracao'
  ]));
  var optionalIds = splitIds(directValue(record, [
    'ID Memória Facultativa', 'idmemoriafacultativa',
    'ID Memorias Facultativas', 'idmemoriasfacultativas'
  ]));

  var mainMemory = null;
  for (var index = 0; index < mainIds.length && !mainMemory; index += 1) {
    mainMemory = resolveMemory(mainIds[index], memoryIndex);
  }

  var noteExpanded = expandNote(note);
  var season = seasonFromData(tempo, [
    noteExpanded,
    mainMemory ? mainMemory.name : ''
  ].join(' '));

  var explicitGrade = normalizeGrade(directValue(record, [
    'Grau', 'grau litúrgico', 'grau liturgico', 'Tipo', 'tipo de celebração',
    'tipo de celebracao', 'Categoria', 'Classe'
  ]));

  var grade = explicitGrade.code
    ? explicitGrade
    : mainMemory && mainMemory.grade.code
      ? mainMemory.grade
      : gradeFromText([mainMemory ? mainMemory.name : '', noteExpanded].join(' '));

  var fallbackTitle = ferialTitle(record, date, season, week, noteExpanded);
  var parts = dateParts(date);
  var mainName = mainMemory && mainMemory.name ? mainMemory.name : '';
  var mainLooksLikeSunday = /domingo|ramos|pascoa|pentecostes|trindade|cristorei/.test(canonicalKey(mainName));

  var title = isPrincipalGrade(grade)
    ? mainName || fallbackTitle
    : parts.isSunday && mainName && mainLooksLikeSunday
      ? mainName
      : fallbackTitle;

  var colors = isPrincipalGrade(grade) && mainMemory && mainMemory.colors.length
    ? mainMemory.colors.slice()
    : seasonColor(season, [title, noteExpanded].join(' '));

  if (!colors.length && mainMemory && mainMemory.colors.length) {
    colors = mainMemory.colors.slice();
  }

  var optionalMemories = [];
  optionalIds.forEach(function (id) {
    var memory = resolveMemory(id, memoryIndex);
    var label = displayOptionalMemory(memory, id);
    if (!label) return;
    if (optionalMemories.some(function (item) { return item.label === label; })) return;
    optionalMemories.push({
      id: id,
      name: label.replace(/\s*\(m\)\s*$/i, ''),
      label: label,
      grade: normalizeGrade('m'),
      colors: memory && memory.colors ? memory.colors : [],
      raw: memory ? memory.raw : null
    });
  });

  var commemorations = [];
  commemorationIds.forEach(function (id) {
    var memory = resolveMemory(id, memoryIndex);
    var label = displayCommemoration(memory, id);
    if (!label) return;
    if (commemorations.some(function (item) { return item.label === label; })) return;
    commemorations.push({
      id: id,
      name: memory && memory.name ? memory.name : humanizeSlug(id),
      label: label,
      colors: memory && memory.colors ? memory.colors : [],
      raw: memory ? memory.raw : null
    });
  });

  var cycleValue = scalarText(directValue(record, ['Ano', 'ciclo', 'cycle'])).toUpperCase();
  var cycleMatch = cycleValue.match(/[ABC]/);

  return {
    date: date,
    title: title || season.name || 'Tempo litúrgico não informado',
    grade: grade,
    colors: colors,
    season: season,
    seasonCode: tempo,
    week: week,
    weekTitle: fallbackTitle,
    note: noteExpanded,
    cycle: cycleMatch ? cycleMatch[0] : '',
    optionalMemories: optionalMemories,
    commemorations: commemorations,
    mainMemory: mainMemory,
    raw: record
  };
}

  function todayIsoInSaoPaulo() {
    var parts = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone: SAO_PAULO_TIME_ZONE,
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).forEach(function (part) {
      if (part.type !== 'literal') parts[part.type] = part.value;
    });
    return [parts.year, parts.month, parts.day].join('-');
  }

  function dateParts(isoDate) {
    var values = isoDate.split('-').map(Number);
    var date = new Date(Date.UTC(values[0], values[1] - 1, values[2]));
    return {
      year: values[0], month: values[1], day: values[2],
      weekday: WEEKDAY_NAMES[date.getUTCDay()],
      isSunday: date.getUTCDay() === 0
    };
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function calculatedAdventCycle(isoDate) {
    var liturgicalYear = Number(isoDate.slice(0, 4)) + 1;
    var remainder = liturgicalYear % 3;
    if (remainder === 1) return 'A';
    if (remainder === 2) return 'B';
    return 'C';
  }

  function seasonTransition(previousDay, day) {
    if (!previousDay || !previousDay.season.key || !day.season.key) return null;
    if (previousDay.season.key === day.season.key) return null;
    var labels = {
      advent: 'Início do Advento',
      christmas: 'Início do Tempo do Natal',
      lent: 'Início da Quaresma',
      triduum: 'Início do Tríduo Pascal',
      easter: 'Início do Tempo Pascal',
      ordinary: previousDay.season.key === 'easter' ? 'Retomada do Tempo Comum' : 'Início do Tempo Comum'
    };
    var label = labels[day.season.key];
    if (!label) return null;
    if (day.season.key === 'advent') label += ' · Ano ' + (day.cycle || calculatedAdventCycle(day.date));
    return { key: day.season.key, label: label };
  }

  function renderSeasonBanner(transition) {
    var banner = element('div', 'liturgical-calendar-season-banner is-' + transition.key);
    banner.setAttribute('role', 'separator');
    banner.setAttribute('aria-label', transition.label);
    banner.appendChild(element('strong', '', transition.label));
    return banner;
  }

  function renderColor(day) {
    var wrapper = element('div', 'liturgical-calendar-color');
    var swatches = element('span', 'liturgical-calendar-color__swatches');
    var colors = day.colors.length ? day.colors : ['Não informada'];
    colors.forEach(function (color) {
      var cssClass = colorClass(color);
      var dot = element('span', 'liturgical-calendar-color-dot' + (cssClass ? ' is-' + cssClass : ''));
      dot.setAttribute('aria-hidden', 'true');
      swatches.appendChild(dot);
    });
    var label = element('span', 'liturgical-calendar-color__label', colors.join(' e '));
    wrapper.setAttribute('title', 'Cor litúrgica: ' + colors.join(' e '));
    wrapper.setAttribute('aria-label', 'Cor litúrgica: ' + colors.join(' e '));
    wrapper.appendChild(swatches);
    wrapper.appendChild(label);
    return wrapper;
  }


function longDateLabel(isoDate) {
  var values = isoDate.split('-').map(Number);
  var date = new Date(Date.UTC(values[0], values[1] - 1, values[2]));
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function appendCelebrationTitle(node, day) {
  node.appendChild(document.createTextNode(day.title));

  day.optionalMemories.forEach(function (memory) {
    node.appendChild(document.createTextNode(' ou ' + memory.name + ' '));
    node.appendChild(element('span', 'liturgical-calendar-inline-grade', '(m)'));
  });

  day.commemorations.forEach(function (memory) {
    node.appendChild(document.createTextNode(' ou ' + memory.label));
  });
}

function addDetailRow(list, label, value) {
  var text = normalizeText(value);
  if (!text) return;

  var wrapper = element('div', 'liturgical-calendar-detail-row');
  wrapper.appendChild(element('dt', '', label));
  wrapper.appendChild(element('dd', '', text));
  list.appendChild(wrapper);
}

function detailValue(sources, aliases) {
  for (var index = 0; index < sources.length; index += 1) {
    var value = scalarText(directValue(sources[index], aliases));
    if (value) return value;
  }
  return '';
}

function memoryDetailLabel(memory) {
  if (!memory) return '';
  var label = memory.label || memory.name || '';
  if (memory.colors && memory.colors.length) label += ' · ' + memory.colors.join(' e ');
  return label;
}

function renderDayDetails(day) {
  var panel = element('div', 'liturgical-calendar-day__details');
  var heading = element('h4', 'liturgical-calendar-day__details-title', 'Informações da liturgia');
  panel.appendChild(heading);

  var facts = element('dl', 'liturgical-calendar-day__facts');
  var memorySource = day.mainMemory && isPlainObject(day.mainMemory.raw) ? day.mainMemory.raw : null;
  var sources = [day.raw, memorySource].filter(Boolean);

  addDetailRow(facts, 'Data', longDateLabel(day.date));
  addDetailRow(facts, 'Tempo litúrgico', day.season.name);
  addDetailRow(facts, 'Semana litúrgica', day.weekTitle);
  addDetailRow(facts, 'Cor litúrgica', day.colors.join(' e '));
  addDetailRow(facts, 'Grau litúrgico', day.grade.label || 'Sem grau litúrgico próprio');
  addDetailRow(facts, 'Celebração ou semana', day.title);

  if (day.optionalMemories.length) {
    addDetailRow(
      facts,
      day.optionalMemories.length === 1 ? 'Memória facultativa' : 'Memórias facultativas',
      day.optionalMemories.map(memoryDetailLabel).join('; ')
    );
  }

  if (day.commemorations.length) {
    addDetailRow(
      facts,
      day.commemorations.length === 1 ? 'Comemoração' : 'Comemorações',
      day.commemorations.map(memoryDetailLabel).join('; ')
    );
  }

  addDetailRow(facts, 'Ciclo dominical', day.cycle ? 'Ano ' + day.cycle : '');
  addDetailRow(facts, 'Semana do Saltério', detailValue(sources, [
    'Semana Saltério', 'Semana Salterio', 'Semana do Saltério', 'Semana do Salterio',
    'Saltério', 'Salterio', 'psalter'
  ]));
  addDetailRow(facts, 'Próprio', detailValue(sources, [
    'Próprio', 'Proprio', 'proper'
  ]));
  addDetailRow(facts, 'Comum', detailValue(sources, [
    'Comum', 'common'
  ]));
  addDetailRow(facts, 'Ofício', detailValue(sources, [
    'Ofício', 'Oficio', 'office'
  ]));
  addDetailRow(facts, 'Leituras próprias', detailValue(sources, [
    'Leituras próprias', 'Leituras proprias', 'Leituras', 'readings'
  ]));
  addDetailRow(facts, 'Prefácio', detailValue(sources, [
    'Prefácio', 'Prefacio', 'preface'
  ]));
  addDetailRow(facts, 'Referência', detailValue(sources, [
    'Referência', 'Referencia', 'reference'
  ]));
  addDetailRow(facts, 'Observações', day.note);

  panel.appendChild(facts);
  panel.appendChild(element(
    'p',
    'liturgical-calendar-day__hint',
    'Clique novamente no cabeçalho do dia para recolher estas informações.'
  ));
  return panel;
}

function renderDay(day, options) {
  var parts = dateParts(day.date);
  var importance = day.grade.kind === 'solemnity' || parts.isSunday
    ? 'is-major'
    : day.grade.kind === 'feast' ? 'is-medium' : 'is-normal';

  var row = element('details', 'liturgical-calendar-day ' + importance);
  row.id = 'dia-' + day.date;
  row.setAttribute('role', 'listitem');

  if (options.today === day.date && Number(day.date.slice(0, 4)) === options.year) {
    row.classList.add('is-today');
    row.setAttribute('aria-current', 'date');
  }

  var summary = element('summary', 'liturgical-calendar-day__summary');
  summary.setAttribute('aria-label', 'Ver informações de ' + longDateLabel(day.date));

  var dateBlock = element('time', 'liturgical-calendar-date');
  dateBlock.dateTime = day.date;
  dateBlock.appendChild(element('span', 'liturgical-calendar-date__day', String(parts.day)));
  dateBlock.appendChild(element('span', 'liturgical-calendar-date__weekday', parts.weekday));

  var grade = element(
    'span',
    'liturgical-calendar-grade' + (day.grade.code ? '' : ' is-empty'),
    day.grade.code || '·'
  );
  grade.setAttribute('title', day.grade.label || 'Sem grau litúrgico próprio');
  grade.setAttribute('aria-label', day.grade.label || 'Sem grau litúrgico próprio');

  var celebration = element('div', 'liturgical-calendar-celebration');
  if (row.classList.contains('is-today')) {
    celebration.appendChild(element('span', 'liturgical-calendar-today-label', 'Hoje'));
  }

  var title = element('h3', 'liturgical-calendar-celebration__title');
  appendCelebrationTitle(title, day);
  celebration.appendChild(title);
  celebration.appendChild(element(
    'span',
    'liturgical-calendar-accordion-label',
    'Ver informações'
  ));

  summary.appendChild(dateBlock);
  summary.appendChild(renderColor(day));
  summary.appendChild(grade);
  summary.appendChild(celebration);
  summary.appendChild(element('span', 'liturgical-calendar-accordion-icon', ''));

  row.appendChild(summary);
  row.appendChild(renderDayDetails(day));
  return row;
}


function renderMonth(month, days, options) {
  var section = element('section', 'liturgical-calendar-month');
  section.id = 'mes-' + month;
  section.setAttribute('aria-labelledby', 'mes-' + month + '-titulo');

  var header = element('header', 'liturgical-calendar-month__header');
  var title = element('h2', '', MONTH_NAMES[month - 1]);
  title.id = 'mes-' + month + '-titulo';
  header.appendChild(title);
  header.appendChild(element(
    'p',
    'liturgical-calendar-month__devotion',
    MONTH_DEVOTIONS[month - 1]
  ));

  var list = element('div', 'liturgical-calendar-days');
  list.setAttribute('role', 'list');

  days.forEach(function (day) {
    var previousDay = options.previousByDate.get(day.date);
    var transition = seasonTransition(previousDay, day);
    if (transition) list.appendChild(renderSeasonBanner(transition));
    list.appendChild(renderDay(day, options));
  });

  section.appendChild(header);
  section.appendChild(list);
  return section;
}

  function buildMonthNavigation(nav, months) {
    nav.replaceChildren();
    months.forEach(function (month) {
      var link = element('a', '', MONTH_NAMES[month - 1].slice(0, 3));
      link.href = '#mes-' + month;
      link.title = MONTH_NAMES[month - 1];
      nav.appendChild(link);
    });
    nav.hidden = !months.length;
  }

  function renderCalendar(content, nav, days, year, today) {
    content.replaceChildren();
    var previousByDate = new Map();
    days.forEach(function (day, index) {
      previousByDate.set(day.date, index > 0 ? days[index - 1] : null);
    });

    var months = [];
    for (var month = 1; month <= 12; month += 1) {
      var monthDays = days.filter(function (day) { return Number(day.date.slice(5, 7)) === month; });
      if (!monthDays.length) continue;
      months.push(month);
      content.appendChild(renderMonth(month, monthDays, {
        year: year,
        today: today,
        previousByDate: previousByDate
      }));
    }
    buildMonthNavigation(nav, months);
    content.setAttribute('aria-busy', 'false');
  }

  function renderSkeleton(content) {
    content.replaceChildren();
    var skeleton = element('div', 'liturgical-calendar-skeleton');
    skeleton.setAttribute('aria-hidden', 'true');
    for (var index = 0; index < 7; index += 1) skeleton.appendChild(element('span'));
    content.appendChild(skeleton);
    content.setAttribute('aria-busy', 'true');
  }

  function renderError(content, message) {
    content.replaceChildren();
    content.appendChild(element('div', 'liturgical-calendar-message liturgical-calendar-message--error', message));
    content.setAttribute('aria-busy', 'false');
  }

  function fetchJson(url) {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timeout = controller ? window.setTimeout(function () { controller.abort(); }, 18000) : null;
    return fetch(url, {
      method: 'GET', credentials: 'same-origin', cache: 'no-cache',
      headers: { Accept: 'application/json' },
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      if (!response.ok) throw new Error('Resposta HTTP ' + response.status + ' em ' + url);
      return response.json();
    }).finally(function () {
      if (timeout) window.clearTimeout(timeout);
    });
  }

  function validYear(value) {
    var year = Number(value);
    return Number.isInteger(year) && year >= 1970 && year <= 2100 ? year : null;
  }

  function availableYearsFromRoot(root, defaultYear) {
    var years = String(root.getAttribute('data-available-years') || '')
      .split(',')
      .map(function (value) { return validYear(value.trim()); })
      .filter(Boolean)
      .filter(function (value, index, list) { return list.indexOf(value) === index; })
      .sort(function (a, b) { return a - b; });
    return years.length ? years : [defaultYear];
  }

  function yearFromLocation(defaultYear) {
    var queryYear = validYear(new URLSearchParams(window.location.search).get('ano'));
    return queryYear || defaultYear;
  }

  function updateLocationYear(year) {
    if (!window.history || !window.history.replaceState) return;
    var url = new URL(window.location.href);
    url.searchParams.set('ano', String(year));
    window.history.replaceState({}, '', url.toString());
  }

  function yearUrlFor(root, year) {
    var base = root.getAttribute('data-year-base-url') || '';
    if (base) return base.replace(/\/?$/, '/') + String(year) + '.json';
    var template = root.getAttribute('data-year-url-template') || '';
    return template.replace('{year}', String(year));
  }

  function initialize(root) {
    var content = root.querySelector('[data-calendar-content]');
    var status = root.querySelector('[data-calendar-status]');
    var nav = root.querySelector('[data-calendar-month-nav]');
    var form = root.querySelector('[data-calendar-year-form]');
    var input = root.querySelector('[data-calendar-year-input]');
    var previousButton = root.querySelector('[data-calendar-previous-year]');
    var nextButton = root.querySelector('[data-calendar-next-year]');
    var todayButton = root.querySelector('[data-calendar-today]');
    if (!content || !status || !nav || !form || !input) return;

    var defaultYear = validYear(root.getAttribute('data-default-year')) || new Date().getFullYear();
    var memoriesUrl = root.getAttribute('data-memories-url') || '';
    var availableYears = availableYearsFromRoot(root, defaultYear);
    var today = todayIsoInSaoPaulo();
    var memoryPromise = null;
    var loadToken = 0;
    var scrollToTodayAfterLoad = false;

    function setStatus(message, kind) {
      status.textContent = message;
      status.classList.toggle('is-error', kind === 'error');
      status.classList.toggle('is-warning', kind === 'warning');
    }

    function loadMemories() {
      if (!memoryPromise) {
        memoryPromise = fetchJson(memoriesUrl).then(createMemoryIndex);
      }
      return memoryPromise;
    }

    function loadYear(year) {
      if (availableYears.indexOf(year) === -1) {
        var unavailableMessage = 'O calendário de ' + year + ' ainda não foi publicado.';
        setStatus(unavailableMessage, 'error');
        renderError(content, unavailableMessage);
        nav.hidden = true;
        return;
      }

      var currentToken = ++loadToken;
      input.value = String(year);
      updateLocationYear(year);
      renderSkeleton(content);
      nav.hidden = true;
      if (todayButton) todayButton.hidden = Number(today.slice(0, 4)) !== year;
      setStatus('Carregando o calendário de ' + year + '…');

      if (previousButton) previousButton.disabled = availableYears.indexOf(year) <= 0;
      if (nextButton) nextButton.disabled = availableYears.indexOf(year) >= availableYears.length - 1;

      Promise.all([fetchJson(yearUrlFor(root, year)), loadMemories()])
        .then(function (results) {
          if (currentToken !== loadToken) return;
          var records = extractYearRecords(results[0]);
          var days = records
            .map(function (record) { return normalizeDayRecord(record, year, results[1]); })
            .filter(Boolean)
            .sort(function (a, b) { return a.date.localeCompare(b.date); });

          var unique = [];
          var dates = new Set();
          days.forEach(function (day) {
            if (!dates.has(day.date)) {
              dates.add(day.date);
              unique.push(day);
            }
          });

          if (!unique.length) throw new Error('O arquivo anual não contém registros reconhecíveis.');
          renderCalendar(content, nav, unique, year, today);
          setStatus('Calendário de ' + year + ' carregado com ' + unique.length + ' dias.');

          if (scrollToTodayAfterLoad) {
            scrollToTodayAfterLoad = false;
            var todayElement = document.getElementById('dia-' + today);
            if (todayElement) todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })
        .catch(function (error) {
          if (currentToken !== loadToken) return;
          console.error('[Calendário Litúrgico]', error);
          var message = 'Não foi possível montar o calendário. Verifique se os arquivos anuais e de memórias foram sincronizados corretamente.';
          setStatus(message, 'error');
          renderError(content, message);
          nav.hidden = true;
        });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var year = validYear(input.value);
      if (!year) {
        setStatus('Informe um ano válido.', 'error');
        return;
      }
      loadYear(year);
    });

    if (previousButton) previousButton.addEventListener('click', function () {
      var current = validYear(input.value) || defaultYear;
      var position = availableYears.indexOf(current);
      if (position > 0) loadYear(availableYears[position - 1]);
    });

    if (nextButton) nextButton.addEventListener('click', function () {
      var current = validYear(input.value) || defaultYear;
      var position = availableYears.indexOf(current);
      if (position >= 0 && position < availableYears.length - 1) loadYear(availableYears[position + 1]);
    });

    if (todayButton) todayButton.addEventListener('click', function () {
      var todayYear = Number(today.slice(0, 4));
      if (availableYears.indexOf(todayYear) === -1) return;
      if (validYear(input.value) !== todayYear) {
        scrollToTodayAfterLoad = true;
        loadYear(todayYear);
        return;
      }
      var todayElement = document.getElementById('dia-' + today);
      if (todayElement) todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    loadYear(yearFromLocation(defaultYear));
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-liturgical-calendar]').forEach(initialize);
  });
}());
