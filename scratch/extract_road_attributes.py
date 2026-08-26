import urllib.request, json
import urllib.parse
import os

layers = [
    (95, 'Name', 'Route_No', 'Rd_Categor', None),
    (3, 'NAME', 'REF', None, 'HIGHWAY'),
    (94, 'Name', 'Route_No', 'Rd_Categor', None),
    (0, 'NAME', 'ROUTE_NO', None, 'HIGHWAY'),
    (71, 'NAME', 'ROUTE_NO', 'ROAD_CTGRY', 'HIGHWAY'),
    (81, 'Name', 'Route_No', 'Rd_Categor', None),
    (83, 'NAME', 'ROUTE_NO', 'ROAD_CTGRY', None)
]

# Fallbacks for NAME field if NAME is null
name_fallbacks = ['NAME_EN']
# Fallbacks for Route no
route_fallbacks = ['REF', 'ROUTE_NO', 'Route_No']

base_url = "https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/ROAD_ACCESSIBILITY_DUE_TO_FLOOD_WFL1/FeatureServer/{}/query"

road_attributes = {}

for layer_id, name_f, route_f, cat_f, hw_f in layers:
    print(f"Fetching layer {layer_id}...")
    params = {
        "where": "1=1",
        "outFields": "*",
        "returnGeometry": "false",
        "f": "json"
    }
    url = base_url.format(layer_id) + "?" + urllib.parse.urlencode(params)
    try:
        req = urllib.request.urlopen(url)
        data = json.loads(req.read().decode("utf-8"))
        features = data.get('features', [])
        for f in features:
            attr = f['attributes']
            
            # Get Name
            name = attr.get(name_f)
            if not name:
                for fb in name_fallbacks:
                    name = attr.get(fb)
                    if name: break
            if not name:
                continue
            
            name = name.strip().upper()
            
            # Get Route No
            route_no = attr.get(route_f)
            if not route_no:
                for fb in route_fallbacks:
                    route_no = attr.get(fb)
                    if route_no: break
            
            if isinstance(route_no, str):
                route_no = route_no.strip()
                if route_no == "" or route_no.lower() == "null" or route_no.lower() == "none":
                    route_no = None
            
            # Get Type of Road
            rd_type = "Others"
            
            # Check Category first
            cat = None
            if cat_f:
                cat = attr.get(cat_f)
            
            hw = None
            if hw_f:
                hw = attr.get(hw_f)
                
            if cat:
                cat_upper = str(cat).upper()
                if "PERSEKUTUAN" in cat_upper or "FEDERAL" in cat_upper:
                    rd_type = "Federal Road"
                elif "NEGERI" in cat_upper or "STATE" in cat_upper:
                    rd_type = "State Road"
            
            if rd_type == "Others" and hw:
                hw_lower = str(hw).lower()
                if hw_lower == "unclassified":
                    rd_type = "Unclassified"
                elif hw_lower == "residential":
                    rd_type = "Residential"
            
            # If we already have this road, prefer Federal/State over others, and prefer a real route no over null
            existing = road_attributes.get(name)
            if existing:
                if rd_type in ["Federal Road", "State Road"] and existing['type_of_road'] not in ["Federal Road", "State Road"]:
                    existing['type_of_road'] = rd_type
                if route_no and not existing['route_no']:
                    existing['route_no'] = route_no
            else:
                road_attributes[name] = {
                    "type_of_road": rd_type,
                    "route_no": route_no
                }
                
    except Exception as e:
        print(f"Error processing layer {layer_id}: {e}")

# Save to src/lib/roadAttributes.json
out_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'lib', 'roadAttributes.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(road_attributes, f, indent=2)

print(f"Saved {len(road_attributes)} road attributes to {out_path}")
