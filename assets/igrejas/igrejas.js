(function () {
  var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRgqdjNjQWkla6tvjVY086Scpy-cDlBaGe-i9OVb9rrQkE0gDqyAhKKgH_YM_Bg4R_ojc3MBk3_lXF9/pub?output=csv';

  var FLAGS = {
    'Portugal': '<img src="assets/images/flag-portugal.webp" alt="PT" class="flag-icon">', 
    'Spain': '<img src="assets/images/flag-spain.avif" alt="ES" class="flag-icon">', 
    'Belgium': '<img src="assets/images/flag-belgica.svg" alt="BE" class="flag-icon">',
    'Luxembourg': '<img src="assets/images/flag-Luxembourg.png" alt="LU" class="flag-icon">', 
    'France': '<img src="assets/images/flag-france.svg" alt="FR" class="flag-icon">', 
    'Germany': '<img src="assets/images/flag-alemanha.avif" alt="DE" class="flag-icon">', 
    'Guinea-Bisáu': '<img src="assets/images/flag-guinea-bissau.png" alt="GW" class="flag-icon">',
    'Mozambique': '<img src="assets/images/flag-mozambique.png" alt="MZ" class="flag-icon">'
  };

  var PAIS_PT = {
    'Portugal': 'Portugal', 'Spain': 'Espanha', 'Belgium': 'Bélgica',
    'Luxembourg': 'Luxemburgo', 'France': 'França', 'Germany': 'Alemanha', 'Guinea-Bisáu': 'Guiné-Bissau',
    'Mozambique': 'Moçambique'
  };

  var IGREJAS = [];

  var activePais = 'all';
  var searchTerm = '';

  // Parse a single CSV line into an array of fields, handling quoted fields with commas.
  function parseCSVLine(line) {
    var fields = [];
    var i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        // Quoted field
        var field = '';
        i++; // skip opening quote
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            field += '"';
            i += 2;
          } else if (line[i] === '"') {
            i++; // skip closing quote
            break;
          } else {
            field += line[i];
            i++;
          }
        }
        fields.push(field);
        if (line[i] === ',') i++; // skip comma after closing quote
      } else {
        // Unquoted field
        var end = line.indexOf(',', i);
        if (end === -1) end = line.length;
        fields.push(line.slice(i, end));
        i = end + 1;
      }
    }
    return fields;
  }

  function parseCSV(text) {
    var lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (lines.length === 0) return [];
    var headers = parseCSVLine(lines[0]);
    var result = [];
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i];
      if (!line.trim()) continue;
      var fields = parseCSVLine(line);
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j].trim()] = (fields[j] !== undefined ? fields[j].trim() : '');
      }
      result.push(obj);
    }
    return result;
  }

  function csvRowToIgreja(row) {
    return {
      nome:     row['Igreja']                   || '',
      tel:      row['TelefoneIgreja']            || '',
      email:    row['EmailIgreja']               || '',
      endereco: row['EnderecoIgreja']            || '',
      cidade:   row['CidadeIgreja']              || '',
      cp:       row['CodigoPostal']              || '',
      regiao:   row['Regiao']                    || '',
      pais:     row['Pais']                      || '',
      coords:   row['GoogleMaps']                || '',
      pastor:   row['Superintendente']           || '',
      regional: row['PastorRegional']            || '',
      img:      row['ImagemSuperintendente']     || ''
    };
  }

  function sortPaises(paises) {
    return paises.sort(function (a, b) {
      if (a === 'Portugal') return -1;
      if (b === 'Portugal') return 1;
      return a.localeCompare(b);
    });
  }

  function groupData(list) {
    var g = {};
    list.forEach(function (ig) {
      if (!g[ig.pais]) g[ig.pais] = {};
      if (!g[ig.pais][ig.regiao]) g[ig.pais][ig.regiao] = [];
      g[ig.pais][ig.regiao].push(ig);
    });
    return g;
  }

  function filterIgrejas() {
    var q = searchTerm.toLowerCase();
    return IGREJAS.filter(function (ig) {
      var matchPais = activePais === 'all' || ig.pais === activePais;
      var matchSearch = !q ||
        ig.nome.toLowerCase().indexOf(q) !== -1 ||
        ig.cidade.toLowerCase().indexOf(q) !== -1 ||
        ig.pastor.toLowerCase().indexOf(q) !== -1;
      return matchPais && matchSearch;
    });
  }

  function openModal(ig) {
    var mapHtml = '';
    if (ig.coords) {
      var p = ig.coords.split(',');
      var lat = parseFloat(p[0]), lon = parseFloat(p[1]);
      mapHtml = '<div class="ratio ratio-16x9 mt-3 rounded overflow-hidden">' +
        '<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=' +
        (lon - 0.008) + ',' + (lat - 0.008) + ',' + (lon + 0.008) + ',' + (lat + 0.008) +
        '&layer=mapnik&marker=' + lat + ',' + lon + '" loading="lazy" style="border:0"></iframe></div>';
    }
    var html = '<div class="igm-top">' +
      '<h5 class="igm-nome">' + ig.nome + '</h5>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>' +
      '</div>' +
      '<div class="igm-content">' +
      '<div class="igm-photo-col">' +
      '<div class="img-skeleton-wrapper img-skeleton">' +
      '<img src="' + ig.img + '" alt="' + ig.pastor + '" class="igm-photo" style="opacity:0;transition:opacity 0.3s ease;" onload="this.style.opacity=\'1\';this.parentElement.classList.remove(\'img-skeleton\');" onerror="this.style.opacity=\'1\';this.parentElement.classList.remove(\'img-skeleton\');" />' +
      '</div>' +
      '<p class="igm-pastor-name">' + ig.pastor + '</p>' +
      '</div>' +
      '<div class="igm-info-col">' +
      '<p><strong><i class="bx bx-map-pin"></i> Endereço:</strong> ' + ig.endereco + '</p>' +
      (ig.cp ? '<p><strong><i class="bx bx-mail-send"></i> Código Postal:</strong> ' + ig.cp + '</p>' : '') +
      '<p><strong><i class="bx bx-buildings"></i> Cidade:</strong> ' + ig.cidade + ' — ' + (PAIS_PT[ig.pais] || ig.pais) + '</p>' +
      '<p><strong><i class="bx bx-phone"></i> Tel.:</strong> <a href="tel:' + ig.tel + '">' + ig.tel + '</a></p>' +
      '<p><strong><i class="bx bx-envelope"></i> E-mail:</strong> <a href="mailto:' + ig.email + '">' + ig.email + '</a></p>' +
      (ig.regional ? '<p><strong><i class="bx bx-user-pin"></i> Pastor Regional:</strong> ' + ig.regional + '</p>' : '') +
      '</div></div>' +
      (mapHtml ? '<div class="igm-map">' + mapHtml + '</div>' : '');
    document.getElementById('igrejaModalContent').innerHTML = html;
    new bootstrap.Modal(document.getElementById('igrejaModal')).show();
  }

  function renderTabs() {
    var container = document.getElementById('igrejas-pais-filter');
    var paises = sortPaises(Object.keys(groupData(IGREJAS)));
    var html = '<button class="igr-filter-btn' + (activePais === 'all' ? ' active' : '') + '" data-pais="all">Todos (' + IGREJAS.length + ')</button>';
    paises.forEach(function (pais) {
      var flag = FLAGS[pais] || '';
      var count = IGREJAS.filter(function (i) { return i.pais === pais; }).length;
      html += '<button class="igr-filter-btn' + (activePais === pais ? ' active' : '') + '" data-pais="' + pais + '">' + flag + ' ' + (PAIS_PT[pais] || pais) + ' (' + count + ')</button>';
    });
    container.innerHTML = html;
  }

  function renderGrid() {
    var filtered = filterIgrejas();
    var grouped = groupData(filtered);
    var paises = sortPaises(Object.keys(grouped));
    var container = document.getElementById('igrejas-grid');

    if (filtered.length === 0) {
      container.innerHTML = '<p class="text-center py-4 text-muted">Nenhuma igreja encontrada.</p>';
      return;
    }

    var html = '';
    paises.forEach(function (pais) {
      var flag = FLAGS[pais] || '';
      var regioes = Object.keys(grouped[pais]).sort();
      var totalPais = 0;
      regioes.forEach(function (r) { totalPais += grouped[pais][r].length; });

      html += '<div class="igr-country">' +
        '<div class="igr-country-bar">' +
        '<span class="igr-flag">' + flag + '</span>' +
        '<span class="igr-country-name">' + (PAIS_PT[pais] || pais) + '</span>' +
        '<span class="igr-count">' + totalPais + ' igreja' + (totalPais > 1 ? 's' : '') + '</span>' +
        '</div>';

      regioes.forEach(function (regiao) {
        var igrejas = grouped[pais][regiao];
        html += '<div class="igr-region">' +
          '<h6 class="igr-region-title">' + regiao + '</h6>' +
          '<div class="igr-list">';
        igrejas.forEach(function (ig) {
          html += '<button class="igr-item" data-idx="' + IGREJAS.indexOf(ig) + '">' +
            'AD ' + ig.nome.replace('ADEFE ', '') +
            '</button>';
        });
        html += '</div></div>';
      });

      html += '</div>';
    });

    container.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Show loading indicator immediately
    document.getElementById('igrejas-grid').innerHTML =
      '<p class="text-center py-4 text-muted">A carregar igrejas...</p>';

    // Wire up event listeners right away so the UI is ready
    document.getElementById('igrejas-pais-filter').addEventListener('click', function (e) {
      var btn = e.target.closest('.igr-filter-btn');
      if (!btn) return;
      activePais = btn.getAttribute('data-pais');
      renderTabs();
      renderGrid();
    });

    var searchTimeout;
    document.getElementById('igrejas-search').addEventListener('input', function (e) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function () {
        searchTerm = e.target.value;
        renderGrid();
      }, 250);
    });

    document.getElementById('igrejas-grid').addEventListener('click', function (e) {
      var btn = e.target.closest('.igr-item');
      if (!btn) return;
      openModal(IGREJAS[parseInt(btn.getAttribute('data-idx'))]);
    });

    // Fetch live data from Google Sheets CSV
    fetch(CSV_URL)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      })
      .then(function (text) {
        var parsed = parseCSV(text);
        IGREJAS.length = 0;
        parsed.forEach(function (r) { IGREJAS.push(csvRowToIgreja(r)); });
        renderTabs();
        renderGrid();
      })
      .catch(function (err) {
        console.error('Erro ao carregar igrejas:', err);
        document.getElementById('igrejas-grid').innerHTML =
          '<p class="text-center py-4 text-muted">Não foi possível carregar as igrejas. Tente novamente mais tarde.</p>';
      });
  });
})();
