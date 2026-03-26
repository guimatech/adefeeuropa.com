import csv
import re

html_file = r'd:\projects\guimatech\adefe-site\db\SGIFAE - Gestão Integrada.html'
csv_file = r'd:\projects\guimatech\adefe-site\db\igrejas.csv'

try:
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    html_churches = set()
    
    matches = re.findall(r'<span class="TextTypeDisplay__text" data-testid="text-type-display-span">(AD[^<]+)</span>', content)
    for m in matches:
        name = m.replace('AD ', 'ADEFE ').upper().strip()
        html_churches.add(name)
        
    matches_id = re.findall(r'id="Table_RowElement_Igrejas_Ativas_([^"]+)"', content)
    for m in matches_id:
        name = m.replace('_', ' ').upper().strip()
        html_churches.add(name)

    csv_churches = set()
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['Igreja'].replace('_', ' ').upper().strip()
            csv_churches.add(name)

    diff = csv_churches - html_churches

    print("Churches in CSV but not in HTML:")
    for c in sorted(diff):
        print(c)
        
except Exception as e:
    print(f"Error: {e}")
