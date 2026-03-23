import csv
import sys
import os

def main():
    csv_path = r'd:\projects\guimatech\adefe-site\db\igrejas.csv'
    sql_path = r'd:\projects\guimatech\adefe-site\db\igrejas.sql'

    sql_statements = [
        "-- Script de Criação e Inserção para MySQL",
        "-- Gerado a partir de igrejas.csv",
        "",
        "CREATE TABLE IF NOT EXISTS igrejas (",
        "    id INT AUTO_INCREMENT PRIMARY KEY,",
        "    grupo VARCHAR(255),",
        "    nome VARCHAR(255),",
        "    telefone VARCHAR(100),",
        "    sms_telefone VARCHAR(100),",
        "    email VARCHAR(255),",
        "    superintendente_nome VARCHAR(255),",
        "    superintendente_img VARCHAR(255),",
        "    tesoureiro_nome VARCHAR(255),",
        "    tesoureiro_img VARCHAR(255),",
        "    secretario_nome VARCHAR(255),",
        "    secretario_img VARCHAR(255),",
        "    lider_jovens_nome VARCHAR(255),",
        "    lider_jovens_img VARCHAR(255),",
        "    pastor_assistente_nome VARCHAR(255),",
        "    pastor_assistente_img VARCHAR(255),",
        "    pastor_super_assistente_nome VARCHAR(255),",
        "    pastor_super_assistente_img VARCHAR(255),",
        "    pastor_regional_nome VARCHAR(255),",
        "    pastor_regional_img VARCHAR(255),",
        "    pastor_nacional_nome VARCHAR(255),",
        "    pastor_nacional_img VARCHAR(255),",
        "    endereco TEXT,",
        "    mapa_url TEXT,",
        "    aniversario VARCHAR(100),",
        "    banco VARCHAR(100)",
        ");",
        "",
        "INSERT INTO igrejas (grupo, nome, telefone, email, endereco, mapa_url, superintendente_nome, pastor_regional_nome, superintendente_img) VALUES"
    ]

    values = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            grupo = row.get('Regiao', '').strip()
            nome = row.get('Igreja', '').strip()
            telefone = row.get('TelefoneIgreja', '').strip()
            email = row.get('EmailIgreja', '').strip()
            
            endereco_parts = []
            if row.get('EnderecoIgreja', '').strip(): endereco_parts.append(row.get('EnderecoIgreja', '').strip())
            if row.get('CidadeIgreja', '').strip(): endereco_parts.append(row.get('CidadeIgreja', '').strip())
            if row.get('CodigoPostal', '').strip(): endereco_parts.append(row.get('CodigoPostal', '').strip())
            if row.get('Pais', '').strip(): endereco_parts.append(row.get('Pais', '').strip())
            endereco = ", ".join(endereco_parts)
            
            map_coords = row.get('GoogleMaps', '').strip()
            mapa_url = f"https://www.google.com/maps/search/?api=1&query={map_coords}" if map_coords and map_coords != "0.000000, 0.000000" else ""
            
            superintendente_nome = row.get('Superintendente', '').strip()
            pastor_regional_nome = row.get('PastorRegional', '').strip()
            superintendente_img = row.get('ImagemSuperintendente', '').strip()
            
            def esc(val):
                if not val:
                    return "NULL"
                return "'" + val.replace("'", "''") + "'"
                
            vals = [
                esc(grupo),
                esc(nome),
                esc(telefone),
                esc(email),
                esc(endereco),
                esc(mapa_url),
                esc(superintendente_nome),
                esc(pastor_regional_nome),
                esc(superintendente_img)
            ]
            values.append("    (" + ", ".join(vals) + ")")

    sql_statements.append(",\n".join(values) + ";\n")

    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_statements))
        
    print(f"Sucesso! Gerado arquivo {sql_path} a partir de {csv_path}")

if __name__ == '__main__':
    main()
