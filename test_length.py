import requests
for layer in [80, 81, 84]:
    url = f"https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/ROAD_ACCESSIBILITY_DUE_TO_FLOOD_WFL1/FeatureServer/{layer}?f=json"
    data = requests.get(url).json()
    for f in data.get('fields', []):
        if f['name'].upper() == 'STATUS':
            print(f"Layer {layer} Status length: {f.get('length')}")
