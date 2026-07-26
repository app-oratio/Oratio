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

  var DATE_KEYS = ['date', 'data', 'datacivil', 'dataiso', 'iso', 'civildate'];
  var TITLE_KEYS = [
    'celebracao', 'celebration', 'nomecelebracao', 'nomedacelebracao', 'titulo',
    'title', 'nome', 'name', 'memoria', 'festa', 'solenidade'
  ];
  var WEEK_KEYS = [
    'semana', 'semanaliturgica', 'semanadotempo', 'week', 'weeklabel', 'feria',
    'descricao', 'description', 'subtitulo', 'subtitle'
  ];
  var SEASON_KEYS = [
    'tempo', 'tempoliturgico', 'periodoliturgico', 'season', 'liturgicalseason',
    'periodo', 'period'
  ];
  var INDEX_KEYS = [
    'indice', 'index', 'idx', 'indiceliturgico', 'tempoindice', 'seasonindex',
    'liturgicalindex'
  ];
  var COLOR_KEYS = [
    'cor', 'cores', 'color', 'colors', 'corliturgica', 'liturgicalcolor',
    'liturgicalcolors'
  ];
  var GRADE_KEYS = [
    'grau', 'grade', 'rank', 'classe', 'classificacao', 'classificacaocelebracao',
    'tipocelebracao', 'celebrationtype', 'celebrationrank', 'degree'
  ];
  var CYCLE_KEYS = [
    'ciclo', 'ciclodominical', 'anoliturigico', 'anoliturgico', 'yearcycle',
    'liturgicalyear', 'cycle'
  ];
  var OPTIONAL_MEMORY_KEYS = [
    'memoriasfacultativas', 'memoriafacultativa', 'memoriasopcionais',
    'memoriaopcional', 'optionalmemories', 'optionalmemory',
    'facultativememories', 'opcionais', 'memorias'
  ];

  function canonicalKey(value) {
    return String(value == null ? '' : value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function normalizeText(value) {
    return String(value == null ? '' : value)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function directValue(object, aliases) {
    if (!isPlainObject(object)) return undefined;
    var keyMap = {};
    Object.keys(object).forEach(function (key) {
      keyMap[canonicalKey(key)] = key;
    });
    for (var index = 0; index < aliases.length; index += 1) {
      var actual = keyMap[canonicalKey(aliases[index])];
      if (actual !== undefined && object[actual] !== null && object[actual] !== '') {
        return object[actual];
      }
    }
    return undefined;
  }

  function readValue(object, aliases) {
    var value = directValue(object, aliases);
    if (value !== undefined) return value;

    var containers = ['liturgia', 'celebracao', 'calendario', 'meta', 'info', 'dados', 'dia'];
    for (var index = 0; index < containers.length; index += 1) {
      var nested = directValue(object, [containers[index]]);
      if (isPlainObject(nested)) {
        value = directValue(nested, aliases);
        if (value !== undefined) return value;
      }
    }
    return undefined;
  }

  function scalarText(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return normalizeText(value);
    if (Array.isArray(value)) {
      return value.map(scalarText).filter(Boolean).join(', ');
    }
    if (isPlainObject(value)) {
      return scalarText(readValue(value, ['nome', 'name', 'titulo', 'title', 'valor', 'value', 'label']));
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

  function parseDateValue(value, yearHint) {
    if (value === null || value === undefined || value === '') return '';

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      var timestamp = value < 100000000000 ? value * 1000 : value;
      var timestampDate = new Date(timestamp);
      if (!Number.isNaN(timestampDate.getTime())) return timestampDate.toISOString().slice(0, 10);
    }

    if (isPlainObject(value)) {
      var objectYear = Number(directValue(value, ['ano', 'year']) || yearHint);
      var objectMonth = Number(directValue(value, ['mes', 'month']));
      var objectDay = Number(directValue(value, ['dia', 'day']));
      if (objectYear && objectMonth && objectDay) return validIsoDate(objectYear, objectMonth, objectDay);
      return parseDateValue(directValue(value, DATE_KEYS), yearHint);
    }

    var text = normalizeText(value);
    var match;

    match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (match) return validIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));

    match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (match) return validIsoDate(Number(match[3]), Number(match[2]), Number(match[1]));

    match = text.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (match) return validIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));

    match = text.match(/^(\d{1,2})[-/.](\d{1,2})$/);
    if (match && yearHint) {
      var first = Number(match[1]);
      var second = Number(match[2]);
      var ddmm = validIsoDate(Number(yearHint), second, first);
      var mmdd = validIsoDate(Number(yearHint), first, second);
      return ddmm || mmdd;
    }

    return '';
  }

  function pathDate(path, yearHint) {
    var fullDate = '';
    path.forEach(function (part) {
      if (!fullDate) fullDate = parseDateValue(part, yearHint);
    });
    if (fullDate) return fullDate;

    var numeric = path
      .map(function (part) { return /^\d{1,4}$/.test(String(part)) ? Number(part) : null; })
      .filter(function (part) { return part !== null; });

    var year = Number(yearHint);
    var yearPosition = numeric.findIndex(function (part) { return part >= 1900 && part <= 2200; });
    if (yearPosition >= 0) year = numeric[yearPosition];

    if (!year) return '';
    var remaining = numeric.filter(function (part, index) { return index !== yearPosition; });
    if (remaining.length >= 2) {
      var month = remaining[remaining.length - 2];
      var day = remaining[remaining.length - 1];
      return validIsoDate(year, month, day) || validIsoDate(year, day, month);
    }
    return '';
  }

  function looksLikeDayRecord(object) {
    if (!isPlainObject(object)) return false;
    return [TITLE_KEYS, WEEK_KEYS, SEASON_KEYS, COLOR_KEYS, GRADE_KEYS, INDEX_KEYS].some(function (aliases) {
      return directValue(object, aliases) !== undefined;
    });
  }

  function collectDayCandidates(payload, year) {
    var candidates = [];
    var visited = new WeakSet();

    function visit(value, path, depth) {
      if (depth > 9 || value === null || value === undefined) return;

      if (Array.isArray(value)) {
        value.forEach(function (item, index) {
          visit(item, path.concat(String(index)), depth + 1);
        });
        return;
      }

      if (!isPlainObject(value)) return;
      if (visited.has(value)) return;
      visited.add(value);

      var explicitDate = parseDateValue(readValue(value, DATE_KEYS), year) || parseDateValue(value, year);
      var inferredDate = explicitDate || pathDate(path, year);
      if (inferredDate && looksLikeDayRecord(value)) {
        candidates.push({ date: inferredDate, raw: value, path: path.slice() });
      }

      Object.keys(value).forEach(function (key) {
        var child = value[key];
        var keyDate = parseDateValue(key, year);
        if (keyDate && isPlainObject(child)) {
          candidates.push({ date: keyDate, raw: child, path: path.concat(key) });
        }
        visit(child, path.concat(key), depth + 1);
      });
    }

    visit(payload, [], 0);

    if (!candidates.length && Array.isArray(payload) && (payload.length === 365 || payload.length === 366)) {
      payload.forEach(function (raw, index) {
        var date = new Date(Date.UTC(Number(year), 0, index + 1));
        candidates.push({ date: date.toISOString().slice(0, 10), raw: raw, path: [String(index)] });
      });
    }

    return candidates;
  }

  function scoreRecord(record) {
    if (!isPlainObject(record)) return 0;
    var score = 0;
    if (readValue(record, TITLE_KEYS) !== undefined) score += 7;
    if (readValue(record, WEEK_KEYS) !== undefined) score += 4;
    if (readValue(record, SEASON_KEYS) !== undefined) score += 3;
    if (readValue(record, COLOR_KEYS) !== undefined) score += 3;
    if (readValue(record, GRADE_KEYS) !== undefined) score += 2;
    if (readValue(record, INDEX_KEYS) !== undefined) score += 2;
    if (readValue(record, OPTIONAL_MEMORY_KEYS) !== undefined) score += 2;
    score += Math.min(Object.keys(record).length, 12) / 12;
    return score;
  }

  function deduplicateDayCandidates(candidates, year) {
    var byDate = new Map();
    candidates.forEach(function (candidate) {
      if (!candidate.date || Number(candidate.date.slice(0, 4)) !== Number(year)) return;
      var previous = byDate.get(candidate.date);
      if (!previous || scoreRecord(candidate.raw) > scoreRecord(previous.raw)) {
        byDate.set(candidate.date, candidate);
      }
    });
    return Array.from(byDate.values()).sort(function (a, b) {
      return a.date.localeCompare(b.date);
    });
  }

  function colorTokens(value) {
    var values = [];

    function append(item) {
      if (item === null || item === undefined || item === '') return;
      if (Array.isArray(item)) {
        item.forEach(append);
        return;
      }
      if (isPlainObject(item)) {
        var nested = readValue(item, ['nome', 'name', 'cor', 'color', 'valor', 'value', 'label']);
        if (nested !== undefined) append(nested);
        return;
      }
      normalizeText(item).split(/[,;/|]+/).forEach(function (part) {
        if (normalizeText(part)) values.push(normalizeText(part));
      });
    }

    append(value);
    return values.filter(function (value, index, list) {
      return list.findIndex(function (item) { return canonicalKey(item) === canonicalKey(value); }) === index;
    });
  }

  function colorClass(value) {
    var normalized = canonicalKey(value);
    if (/(branco|white)/.test(normalized)) return 'white';
    if (/(vermelho|red)/.test(normalized)) return 'red';
    if (/(verde|green)/.test(normalized)) return 'green';
    if (/(roxo|violeta|purple|violet)/.test(normalized)) return 'purple';
    if (/(rosa|rose|pink)/.test(normalized)) return 'rose';
    if (/(preto|black)/.test(normalized)) return 'black';
    if (/(dourado|ouro|gold)/.test(normalized)) return 'gold';
    return '';
  }

  function normalizeGrade(value) {
    var raw = scalarText(value);
    var normalized = canonicalKey(raw);
    if (!normalized) return { code: '', label: '', kind: 'ferial' };

    if (raw === 'S' || normalized === 's' || /solenidade|solemnity/.test(normalized)) {
      return { code: 'S', label: 'Solenidade', kind: 'solemnity' };
    }
    if (raw === 'F' || normalized === 'f' || /festa|feast/.test(normalized)) {
      return { code: 'F', label: 'Festa', kind: 'feast' };
    }
    if (raw === 'm' || /memoriafacultativa|optionalmemory|memorialfacultativo/.test(normalized)) {
      return { code: 'm', label: 'Memória facultativa', kind: 'optional-memory' };
    }
    if (raw === 'M' || normalized === 'mo' || normalized === 'memoria' || /memoriaobrigatoria|obligatorymemory|memorial/.test(normalized)) {
      return { code: 'M', label: 'Memória obrigatória', kind: 'memory' };
    }

    if (/domingo|sunday/.test(normalized)) {
      return { code: '', label: 'Domingo', kind: 'sunday' };
    }

    return { code: raw.length <= 3 ? raw : '', label: raw, kind: 'ferial' };
  }

  function genericCelebration(text) {
    var normalized = canonicalKey(text);
    return !normalized || /^(feria|diaferial|ferial|semcelebracao)$/.test(normalized);
  }

  function deriveSeason(record, title, weekLabel, indexValue) {
    var source = [scalarText(readValue(record, SEASON_KEYS)), title, weekLabel, scalarText(indexValue)]
      .filter(Boolean)
      .join(' ');
    var normalized = canonicalKey(source);

    if (/triduo|triduum/.test(normalized)) return { key: 'triduum', name: 'Tríduo Pascal' };
    if (/quaresma|lent/.test(normalized)) return { key: 'lent', name: 'Quaresma' };
    if (/advento|advent/.test(normalized)) return { key: 'advent', name: 'Advento' };
    if (/tempopascal|pascoa|pascal|easter/.test(normalized)) return { key: 'easter', name: 'Tempo Pascal' };
    if (/tempo(d[eo])?natal|oitavadonatal|depoisdaepifania|epifania|christmas/.test(normalized)) {
      return { key: 'christmas', name: 'Tempo do Natal' };
    }
    if (/tempocomum|ordinary|comum/.test(normalized)) return { key: 'ordinary', name: 'Tempo Comum' };

    var compactIndex = canonicalKey(indexValue);
    if (/^(adv|advento)$/.test(compactIndex)) return { key: 'advent', name: 'Advento' };
    if (/^(nat|natal|tn)$/.test(compactIndex)) return { key: 'christmas', name: 'Tempo do Natal' };
    if (/^(qua|quaresma|lent)$/.test(compactIndex)) return { key: 'lent', name: 'Quaresma' };
    if (/^(tri|triduo)$/.test(compactIndex)) return { key: 'triduum', name: 'Tríduo Pascal' };
    if (/^(pas|pascal|tp)$/.test(compactIndex)) return { key: 'easter', name: 'Tempo Pascal' };
    if (/^(tc|comum|ordinary)$/.test(compactIndex)) return { key: 'ordinary', name: 'Tempo Comum' };

    return { key: '', name: '' };
  }

  function cycleFromValue(value) {
    var text = scalarText(value).toUpperCase();
    var match = text.match(/(?:ANO\s*)?([ABC])\b/);
    return match ? match[1] : '';
  }

  function calculatedAdventCycle(isoDate) {
    var year = Number(String(isoDate).slice(0, 4)) + 1;
    var remainder = year % 3;
    if (remainder === 1) return 'A';
    if (remainder === 2) return 'B';
    return 'C';
  }

  function normalizeDay(candidate) {
    var record = candidate.raw;
    var title = scalarText(readValue(record, TITLE_KEYS));
    var weekLabel = scalarText(readValue(record, WEEK_KEYS));
    var seasonValue = readValue(record, SEASON_KEYS);
    var indexValue = readValue(record, INDEX_KEYS);

    if (genericCelebration(title) && weekLabel) title = weekLabel;
    if (!title) title = weekLabel || scalarText(seasonValue) || 'Dia ferial';

    return {
      date: candidate.date,
      raw: record,
      title: title,
      weekLabel: weekLabel,
      grade: normalizeGrade(readValue(record, GRADE_KEYS)),
      colors: colorTokens(readValue(record, COLOR_KEYS)),
      indexValue: scalarText(indexValue),
      season: deriveSeason(record, title, weekLabel, indexValue),
      cycle: cycleFromValue(readValue(record, CYCLE_KEYS)),
      optionalSource: readValue(record, OPTIONAL_MEMORY_KEYS)
    };
  }

  function partialDateKeys(value) {
    var text = normalizeText(value);
    if (!text) return [];

    var full = parseDateValue(text, null);
    if (full) return memoryDateKeys(full);

    var match = text.match(/^(\d{1,2})[-/.](\d{1,2})$/);
    if (!match) return [];

    var first = Number(match[1]);
    var second = Number(match[2]);
    var keys = [];

    function add(month, day) {
      if (month < 1 || month > 12 || day < 1 || day > 31) return;
      keys.push(pad2(month) + '-' + pad2(day));
      keys.push(pad2(day) + '-' + pad2(month));
      keys.push(pad2(month) + '/' + pad2(day));
      keys.push(pad2(day) + '/' + pad2(month));
    }

    add(first, second);
    add(second, first);
    return keys.filter(function (key, index, list) { return list.indexOf(key) === index; });
  }

  function memoryDateKeys(date) {
    if (!date) return [];
    var parts = date.split('-');
    if (parts.length !== 3) return [];
    return [parts[1] + '-' + parts[2], parts[2] + '-' + parts[1], parts[1] + '/' + parts[2], parts[2] + '/' + parts[1]];
  }

  function isOptionalMemoryRecord(record, grade) {
    var explicit = readValue(record, ['facultativa', 'facultativo', 'optional', 'opcional', 'isoptional']);
    if (explicit === true || String(explicit).toLowerCase() === 'true' || Number(explicit) === 1) return true;
    var text = canonicalKey([grade.label, grade.code, scalarText(readValue(record, GRADE_KEYS))].join(' '));
    return grade.kind === 'optional-memory' || /memoriafacultativa|optionalmemory/.test(text);
  }

  function normalizeMemory(record, keyHint, dateHint) {
    if (typeof record === 'string') {
      var text = normalizeText(record);
      return text ? { id: canonicalKey(keyHint || text), name: text, date: parseDateValue(dateHint, null) || '', dateKeys: partialDateKeys(dateHint).concat(partialDateKeys(keyHint)), optional: true } : null;
    }
    if (!isPlainObject(record)) return null;

    var name = scalarText(readValue(record, TITLE_KEYS));
    if (!name) name = scalarText(readValue(record, ['denominacao', 'label', 'texto']));
    if (!name) return null;

    var grade = normalizeGrade(readValue(record, GRADE_KEYS));
    var dateValue = readValue(record, DATE_KEYS);
    var date = parseDateValue(dateValue, null) || parseDateValue(record, null) || parseDateValue(dateHint, null) || '';
    var dateKeys = []
      .concat(partialDateKeys(dateValue))
      .concat(partialDateKeys(dateHint))
      .concat(partialDateKeys(keyHint));
    var id = scalarText(readValue(record, ['id', 'slug', 'codigo', 'code', 'chave', 'key'])) || keyHint || name;

    return {
      id: canonicalKey(id),
      name: name,
      date: date,
      dateKeys: dateKeys.filter(function (key, index, list) { return list.indexOf(key) === index; }),
      optional: isOptionalMemoryRecord(record, grade),
      grade: grade,
      colors: colorTokens(readValue(record, COLOR_KEYS))
    };
  }

  function createMemoryIndex(payload) {
    var byId = new Map();
    var byDate = new Map();
    var visited = new WeakSet();

    function add(memory) {
      if (!memory) return;
      if (memory.id) {
        if (!byId.has(memory.id)) byId.set(memory.id, []);
        byId.get(memory.id).push(memory);
      }
      memoryDateKeys(memory.date).concat(memory.dateKeys || []).forEach(function (key) {
        var normalizedKey = canonicalKey(key);
        if (!byDate.has(normalizedKey)) byDate.set(normalizedKey, []);
        byDate.get(normalizedKey).push(memory);
      });
    }

    function visit(value, path, depth) {
      if (depth > 9 || value === null || value === undefined) return;
      if (Array.isArray(value)) {
        value.forEach(function (item, index) { visit(item, path.concat(String(index)), depth + 1); });
        return;
      }
      if (typeof value === 'string') {
        var lastKey = path.length ? path[path.length - 1] : '';
        var parentKey = path.length > 1 ? path[path.length - 2] : '';
        var propertyKey = canonicalKey(lastKey);
        var commonProperty = /^(nome|name|titulo|title|cor|color|grau|grade|rank|descricao|description|id|slug|codigo|code)$/.test(propertyKey);
        if (!commonProperty && normalizeText(value).length >= 6 && (partialDateKeys(lastKey).length || /memoria|opcao|optional/.test(canonicalKey(parentKey)))) {
          add(normalizeMemory(value, lastKey, lastKey));
        }
        return;
      }
      if (!isPlainObject(value) || visited.has(value)) return;
      visited.add(value);

      var hint = path.length ? path[path.length - 1] : '';
      var dateHint = path.slice().reverse().find(function (part) { return partialDateKeys(part).length; }) || pathDate(path, null);
      add(normalizeMemory(value, hint, dateHint));

      Object.keys(value).forEach(function (key) {
        visit(value[key], path.concat(key), depth + 1);
      });
    }

    visit(payload, [], 0);
    return { byId: byId, byDate: byDate };
  }

  function flattenMemorySource(source) {
    var values = [];
    if (source === undefined || source === null || source === '') return values;
    if (Array.isArray(source)) {
      source.forEach(function (item) { values = values.concat(flattenMemorySource(item)); });
      return values;
    }
    if (isPlainObject(source)) {
      var normalized = normalizeMemory(source, '', '');
      if (normalized) return [source];
      Object.keys(source).forEach(function (key) {
        var value = source[key];
        if (typeof value === 'boolean' && value) values.push(key);
        else values = values.concat(flattenMemorySource(value));
      });
      return values;
    }
    return [source];
  }

  function displayMemoryName(name) {
    var text = normalizeText(name);
    if (!text) return '';
    if (/\([mM]\)\s*$/.test(text)) return text.replace(/\(M\)\s*$/, '(m)');
    return text + ' (m)';
  }

  function resolveOptionalMemories(day, memoryIndex) {
    var memories = [];

    function add(memory, forceOptional) {
      if (!memory || !memory.name) return;
      if (!forceOptional && !memory.optional) return;
      if (canonicalKey(memory.name) === canonicalKey(day.title)) return;
      memories.push(memory);
    }

    flattenMemorySource(day.optionalSource).forEach(function (source) {
      if (isPlainObject(source)) {
        add(normalizeMemory(source, '', day.date), true);
        return;
      }

      var value = normalizeText(source);
      if (!value) return;
      var matches = memoryIndex.byId.get(canonicalKey(value));
      if (matches && matches.length) {
        matches.forEach(function (memory) { add(memory, true); });
      } else if (!/^\d+$/.test(value)) {
        add({ name: value, optional: true }, true);
      }
    });

    memoryDateKeys(day.date).forEach(function (key) {
      var matches = memoryIndex.byDate.get(canonicalKey(key)) || [];
      matches.forEach(function (memory) { add(memory, false); });
    });

    var unique = [];
    memories.forEach(function (memory) {
      if (!unique.some(function (item) { return canonicalKey(item.name) === canonicalKey(memory.name); })) {
        unique.push(memory);
      }
    });

    return unique.map(function (memory) {
      return displayMemoryName(memory.name);
    }).filter(Boolean);
  }

  function todayIsoInSaoPaulo() {
    var parts = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone: SAO_PAULO_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date()).forEach(function (part) {
      if (part.type !== 'literal') parts[part.type] = part.value;
    });
    return [parts.year, parts.month, parts.day].join('-');
  }

  function dateParts(isoDate) {
    var parts = isoDate.split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return {
      year: parts[0],
      month: parts[1],
      day: parts[2],
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

    if (day.season.key === 'advent') {
      label += ' · Ano ' + (day.cycle || calculatedAdventCycle(day.date));
    }

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
      var dot = element('span', 'liturgical-calendar-color-dot' + (colorClass(color) ? ' is-' + colorClass(color) : ''));
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

  function renderDay(day, options) {
    var parts = dateParts(day.date);
    var importance = day.grade.kind === 'solemnity' || parts.isSunday
      ? 'is-major'
      : day.grade.kind === 'feast' ? 'is-medium' : 'is-normal';
    var row = element('article', 'liturgical-calendar-day ' + importance);
    row.id = 'dia-' + day.date;
    row.setAttribute('role', 'listitem');

    if (options.today === day.date && Number(day.date.slice(0, 4)) === options.year) {
      row.classList.add('is-today');
      row.setAttribute('aria-current', 'date');
    }

    var dateBlock = element('time', 'liturgical-calendar-date');
    dateBlock.dateTime = day.date;
    dateBlock.appendChild(element('span', 'liturgical-calendar-date__day', String(parts.day)));
    dateBlock.appendChild(element('span', 'liturgical-calendar-date__weekday', parts.weekday));

    var grade = element('span', 'liturgical-calendar-grade' + (day.grade.code ? '' : ' is-empty'), day.grade.code || '·');
    grade.setAttribute('title', day.grade.label || 'Dia ferial');
    grade.setAttribute('aria-label', day.grade.label || 'Sem grau litúrgico próprio');

    var celebration = element('div', 'liturgical-calendar-celebration');
    if (row.classList.contains('is-today')) {
      celebration.appendChild(element('span', 'liturgical-calendar-today-label', 'Hoje'));
    }
    celebration.appendChild(element('h3', 'liturgical-calendar-celebration__title', day.title));

    var optionalMemories = resolveOptionalMemories(day, options.memoryIndex);
    if (optionalMemories.length) {
      var list = element('ul', 'liturgical-calendar-option-list');
      optionalMemories.forEach(function (memory) {
        list.appendChild(element('li', '', memory));
      });
      celebration.appendChild(list);
    }

    row.appendChild(dateBlock);
    row.appendChild(renderColor(day));
    row.appendChild(grade);
    row.appendChild(celebration);
    return row;
  }

  function renderMonth(month, days, options) {
    var section = element('section', 'liturgical-calendar-month');
    section.id = 'mes-' + month;
    section.setAttribute('aria-labelledby', 'mes-' + month + '-titulo');

    var header = element('header', 'liturgical-calendar-month__header');
    var title = element('h2', '', MONTH_NAMES[month - 1] + ' de ' + options.year);
    title.id = 'mes-' + month + '-titulo';
    header.appendChild(title);
    header.appendChild(element('p', 'liturgical-calendar-month__devotion', MONTH_DEVOTIONS[month - 1]));

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

  function renderCalendar(content, nav, days, memoryIndex, year, today) {
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
        memoryIndex: memoryIndex,
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
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-cache',
      headers: { Accept: 'application/json' },
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      if (!response.ok) throw new Error('Resposta HTTP ' + response.status);
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
    var yearBaseUrl = root.getAttribute('data-year-base-url') || '';
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
      if (!memoriesUrl) return Promise.resolve({ index: createMemoryIndex([]), warning: true });
      if (!memoryPromise) {
        memoryPromise = fetchJson(memoriesUrl)
          .then(function (payload) { return { index: createMemoryIndex(payload), warning: false }; })
          .catch(function () { return { index: createMemoryIndex([]), warning: true }; });
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
      todayButton.hidden = Number(today.slice(0, 4)) !== year;
      setStatus('Carregando o calendário de ' + year + '…');

      var yearUrl = yearBaseUrl + String(year) + '.json';
      previousButton.disabled = availableYears.indexOf(year) <= 0;
      nextButton.disabled = availableYears.indexOf(year) >= availableYears.length - 1;

      Promise.all([fetchJson(yearUrl), loadMemories()])
        .then(function (results) {
          if (currentToken !== loadToken) return;
          var candidates = deduplicateDayCandidates(collectDayCandidates(results[0], year), year);
          var days = candidates.map(normalizeDay);

          if (!days.length) throw new Error('O arquivo não contém dias reconhecíveis para ' + year + '.');

          renderCalendar(content, nav, days, results[1].index, year, today);
          if (scrollToTodayAfterLoad && Number(today.slice(0, 4)) === year) {
            scrollToTodayAfterLoad = false;
            window.requestAnimationFrame(function () {
              var todayTarget = document.getElementById('dia-' + today);
              if (todayTarget) todayTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
          }
          if (results[1].warning) {
            setStatus('Calendário de ' + year + ' carregado. As memórias facultativas não puderam ser consultadas neste momento.', 'warning');
          } else {
            setStatus('Calendário de ' + year + ' carregado com ' + days.length + ' dias.');
          }
        })
        .catch(function (error) {
          if (currentToken !== loadToken) return;
          console.error('[Oratio Calendário Litúrgico]', error);
          var message = error && error.name === 'AbortError'
            ? 'O carregamento demorou mais do que o esperado. Atualize a página e tente novamente.'
            : 'Não foi possível carregar o calendário de ' + year + '. A sincronização dos dados da publicação pode ter falhado.';
          setStatus(message, 'error');
          renderError(content, message);
          nav.hidden = true;
        });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var year = validYear(input.value);
      if (!year) {
        setStatus('Informe um ano entre 1970 e 2100.', 'error');
        input.focus();
        return;
      }
      loadYear(year);
    });

    if (previousButton) {
      previousButton.addEventListener('click', function () {
        var year = validYear(input.value) || defaultYear;
        var position = availableYears.indexOf(year);
        if (position > 0) loadYear(availableYears[position - 1]);
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        var year = validYear(input.value) || defaultYear;
        var position = availableYears.indexOf(year);
        if (position >= 0 && position < availableYears.length - 1) loadYear(availableYears[position + 1]);
      });
    }

    if (todayButton) {
      todayButton.addEventListener('click', function () {
        var currentYear = Number(today.slice(0, 4));
        if (validYear(input.value) !== currentYear) {
          scrollToTodayAfterLoad = true;
          loadYear(currentYear);
          return;
        }
        var target = document.getElementById('dia-' + today);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    loadYear(yearFromLocation(defaultYear));
  }

  function start() {
    document.querySelectorAll('[data-liturgical-calendar]').forEach(initialize);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
