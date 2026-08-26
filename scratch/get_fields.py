import urllib.request, json
ids = [95, 89, 3, 94, 0, 1, 73, 71, 72, 81, 83]
for idx in ids:
    try:
        req = urllib.request.urlopen(f'https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/ROAD_ACCESSIBILITY_DUE_TO_FLOOD_WFL1/FeatureServer/{idx}?f=json')
        data = json.loads(req.read().decode("utf-8"))
        fields = [f['name'] for f in data.get('fields', [])]
        print(f'{idx} ({data.get("name")}): {fields}')
    except Exception as e:
        print(f'Error on {idx}: {e}')
