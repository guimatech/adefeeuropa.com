import csv
import re
import unicodedata
import os

def normalize_name(name):
    if not name: return ""
    name = unicodedata.normalize('NFKD', str(name)).encode('ASCII', 'ignore').decode('utf-8').upper()
    name = re.sub(r'[^A-Z0-9]', '', name)
    return name

def main():
    csv_file = r'd:\projects\guimatech\adefe-site\db\igrejas.csv'
    txt_file = r'd:\projects\guimatech\adefe-site\db\endereços.txt'
    out_file = r'd:\projects\guimatech\adefe-site\db\igrejas_html.txt'
    
    enderecos_data = {}
    with open(txt_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    current_church = None
    for line in lines:
        line = line.strip()
        if line.startswith('🔵'):
            current_church = line.replace('🔵', '').strip()
            norm = normalize_name(current_church)
            enderecos_data[norm] = {'nome': current_church, 'endereco': '', 'link': ''}
        elif current_church and line.startswith('📬ENDEREÇO:'):
            enderecos_data[normalize_name(current_church)]['endereco'] = line.replace('📬ENDEREÇO:', '').strip()
        elif current_church and line.startswith('📍COMO CHEGAR:'):
            enderecos_data[normalize_name(current_church)]['link'] = line.replace('📍COMO CHEGAR:', '').strip()
            
    manual_maps = {
        normalize_name("ADEFE SEDE_CENTRAL"): normalize_name("ADEFE VILA FRANÇA DE XIRA"),
        normalize_name("ADEFE SANTO ESTÊVÃO"): normalize_name("ADEFE SANTO ESTEVÃO"),
        normalize_name("ADEFE AMÓS"): normalize_name("ADEFE AMÓS (CARREGADO)"),
    }

    html_output = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            igreja = row.get('Igreja', '').strip()
            norm_igreja = normalize_name(igreja)
            
            lookup_key = manual_maps.get(norm_igreja, norm_igreja)
            end_info = enderecos_data.get(lookup_key)
            if not end_info:
                # tentar match parcial apenas como fallback
                for k in enderecos_data:
                    if norm_igreja in k or k in norm_igreja:
                        end_info = enderecos_data[k]
                        break
            if not end_info:
                end_info = {}
                
            endereco_csv = row.get('EnderecoIgreja', '').strip()
            cidade = row.get('CidadeIgreja', '').strip()
            cod_postal = row.get('CodigoPostal', '').strip()
            pais = row.get('Pais', '').strip()
            tel = row.get('TelefoneIgreja', '').strip()
            email = row.get('EmailIgreja', '').strip()
            pastor = row.get('Superintendente', '').strip()
            google_maps = row.get('GoogleMaps', '').strip()
            
            map_link = end_info.get('link', '').strip()
            if not map_link:
                if google_maps and google_maps != "0.000000, 0.000000" and google_maps != "0.000000,0.000000":
                    map_link = f"https://www.google.com/maps/search/?api=1&query={google_maps.replace(' ', '')}"
                else:
                    map_link = ""
                    
            if not map_link and "http" in endereco_csv:
                map_link = endereco_csv
                    
            end_display = end_info.get('endereco', '')
            if not end_display:
                end_display = endereco_csv
                
            city_display = f"<h4>{cidade}</h4>" if cidade else ""
            country_display = f"<h4>{pais}</h4>" if pais else ""
            
            pastores_text = "Pr. " + pastor if pastor and not pastor.startswith("Pr") else pastor
            
            html = f"""<div class="mag-box-container clearfix">
\t<div class="entry clearfix">
\t\t<h4><span style="color: #000000;"> ■ <strong>{igreja.upper()}</strong></span></h4>
\t\t<h4>Endereço: {end_display}</h4>
\t\t<h4>Código Postal: {cod_postal}</h4>
\t\t{city_display}
\t\t{country_display}
\t\t<h4>Tel.: {tel}</h4>
\t\t<h4>E-mail: {email}</h4>
\t\t<h3 style="text-align: center;">___</h3>
\t\t<h4><span style="color: #000000;">■ <strong>PASTORES</strong></span><br>
\t\t{pastores_text}</h4>
\t\t<h4>onde estamos: {map_link}</h4>
\t</div>
</div>"""
            html_output.append(html)
            
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(html_output))
        
    print(f"Sucesso! HTML gerado com {len(html_output)} igrejas em {out_file}")

if __name__ == '__main__':
    main()
