const BASE_URL = "https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/ROAD_ACCESSIBILITY_DUE_TO_FLOOD_WFL1/FeatureServer";

const ROAD_LAYERS = [
  { id: 80, nameField: "Name", statusField: "Status" },     // Jalan Banjir
  { id: 81, nameField: "Name", statusField: "Status" },     // Jalan Persekutuan
  { id: 84, nameField: "NAME", statusField: "STATUS" }      // Jalan Alternative
];

const PPS_LAYER = { id: 97, nameField: "PPS_Name", statusField: "Status" };

import districtRoadsList from './districtRoads.json';
import roadAttributes from './roadAttributes.json';

/**
 * Fetches all roads from multiple ArcGIS Feature Layers.
 */
export async function fetchRoads() {
  try {
    const fetchPromises = ROAD_LAYERS.map(async (layer) => {
      const params = new URLSearchParams({
        where: "1=1",
        outFields: "*",
        returnGeometry: "false",
        f: "json"
      });

      const response = await fetch(`${BASE_URL}/${layer.id}/query?${params.toString()}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || `Failed to fetch layer ${layer.id}`);
      }

      if (data.features) {
        return data.features.map(feature => {
          const attr = feature.attributes;
          
          // Standardize DISTRICT to Title Case (e.g. SEGAMAT -> Segamat)
          let standardDistrict = attr.DISTRICT || attr.District || attr.district;
          if (standardDistrict) {
            standardDistrict = standardDistrict.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          }

          return {
            ...attr,
            DISTRICT: standardDistrict, // Overwrite with standardized case
            // Standardize field names across layers so React always sees "Name" and "Status"
            Name: attr[layer.nameField],
            Status: attr[layer.statusField],
            layerId: layer.id // Store the layer ID so we know where to send updates
          };
        });
      }
      return [];
    });

    const results = await Promise.all(fetchPromises);
    const flattened = results.flat();

    // Deduplicate standard roads by Name and District
    const uniqueRoadsMap = new Map();
    for (const road of flattened) {
      if (!road.Name) continue;
      
      // Normalize Segamat's messy road name variations
      let displayName = road.Name.trim();
      if (road.DISTRICT && road.DISTRICT.toUpperCase() === 'SEGAMAT') {
        const upper = displayName.toUpperCase();
        if (upper === 'FELDA MEDOI' || upper === 'JALAN FELDA MEDOI' || upper === 'JALAN MEDOI') {
          displayName = 'Felda Medoi';
        } else if (upper === 'FELDA PEMANIS' || upper === 'JALAN FELDA PEMANIS') {
          displayName = 'Felda Pemanis';
        } else if (upper === 'FELDA KEMELAH' || upper === 'JALAN FELDA KEMELAH') {
          displayName = 'Felda Kemelah';
        }
      }

      // Use uppercase for the key so we don't get duplicates like "Jalan Cempaka" vs "JALAN CEMPAKA"
      const key = `${displayName.toUpperCase()}_${(road.DISTRICT || '').toUpperCase()}`;
      
      // Prefer standard roads with a Route_No or District over ones without if there's a duplicate
      if (!uniqueRoadsMap.has(key) || road.Route_No) {
        let typeOfRoad = null;
        let routeNo = road.Route_No || road.ROUTE_NO || road.REF || null;
        
        // Match from roadAttributes.json
        const roadAttr = roadAttributes[displayName.toUpperCase()];
        if (roadAttr) {
            typeOfRoad = roadAttr.type_of_road;
            if (!routeNo && roadAttr.route_no) {
                routeNo = roadAttr.route_no;
            }
        }
        
        uniqueRoadsMap.set(key, { 
            ...road, 
            Name: displayName,
            Type_of_Road: typeOfRoad,
            Route_No: routeNo
        });
      }
    }

    // Add district roads from static JSON to the dropdown list
    const districtRoads = districtRoadsList.map((road) => ({
      isDistrictRoad: true,
      Name: road.Name,
      DISTRICT: road.DISTRICT
    }));

    for (const dRoad of districtRoads) {
      let displayName = dRoad.Name.trim();
      if (dRoad.DISTRICT && dRoad.DISTRICT.toUpperCase() === 'SEGAMAT') {
        const upper = displayName.toUpperCase();
        if (upper === 'FELDA MEDOI' || upper === 'JALAN FELDA MEDOI' || upper === 'JALAN MEDOI') {
          displayName = 'Felda Medoi';
        } else if (upper === 'FELDA PEMANIS' || upper === 'JALAN FELDA PEMANIS') {
          displayName = 'Felda Pemanis';
        } else if (upper === 'FELDA KEMELAH' || upper === 'JALAN FELDA KEMELAH') {
          displayName = 'Felda Kemelah';
        }
      }

      const key = `${displayName.toUpperCase()}_${(dRoad.DISTRICT || '').toUpperCase()}`;
      if (!uniqueRoadsMap.has(key)) {
        let typeOfRoad = null;
        let routeNo = null;
        
        // Match from roadAttributes.json
        const roadAttr = roadAttributes[displayName.toUpperCase()];
        if (roadAttr) {
            typeOfRoad = roadAttr.type_of_road;
            routeNo = roadAttr.route_no;
        }
        
        uniqueRoadsMap.set(key, { 
            ...dRoad, 
            Name: displayName,
            Type_of_Road: typeOfRoad,
            Route_No: routeNo
        });
      }
    }

    // Convert back to array and sort by name
    return Array.from(uniqueRoadsMap.values()).sort((a, b) => {
      return a.Name.localeCompare(b.Name);
    });

  } catch (error) {
    console.error("Error fetching ArcGIS roads:", error);
    throw error;
  }
}

/**
 * Fetches all PPS from the ArcGIS Feature Layer.
 */
export async function fetchPPS() {
  try {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      returnGeometry: "false",
      orderByFields: "PPS_Name ASC",
      f: "json"
    });

    const response = await fetch(`${BASE_URL}/${PPS_LAYER.id}/query?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch PPS data");
    }

    if (data.features) {
      return data.features.map(feature => {
        return {
          ...feature.attributes,
          layerId: PPS_LAYER.id
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching ArcGIS PPS:", error);
    throw error;
  }
}

/**
 * Fetches all Rivers from the Rivers Feature Layer.
 */
export async function fetchRivers() {
  try {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      returnGeometry: "false",
      orderByFields: "River_Name ASC",
      f: "json"
    });

    const response = await fetch(`https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/Rivers_Flood/FeatureServer/0/query?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch Rivers data");
    }

    if (data.features) {
      return data.features.map(feature => {
        return {
          ...feature.attributes,
          layerId: "river_0" // Custom identifier for rivers
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching ArcGIS Rivers:", error);
    throw error;
  }
}

/**
 * Universal function to update any feature using its layer ID and object ID.
 */
export async function updateFeatureStatus(layerId, objectId, attributesToUpdate) {
  try {
    const featureEdit = {
      attributes: {
        OBJECTID: objectId,
        ...attributesToUpdate
      }
    };

    const formData = new URLSearchParams();
    formData.append("f", "json");
    formData.append("features", JSON.stringify([featureEdit]));

    const response = await fetch(`${BASE_URL}/${layerId}/updateFeatures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Failed to update feature in ArcGIS");
    }

    if (data.updateResults && data.updateResults.length > 0) {
      const result = data.updateResults[0];
      if (!result.success) {
        throw new Error(result.error?.description || "Failed to update feature");
      }
      return result;
    }

    throw new Error("Unexpected response from ArcGIS updateFeatures endpoint.");
  } catch (error) {
    console.error("Error updating ArcGIS feature:", error);
    throw error;
  }
}

/**
 * Universal function to update a River feature.
 */
export async function updateRiverFeature(objectId, attributesToUpdate) {
  try {
    const featureEdit = {
      attributes: {
        OBJECTID: objectId,
        ...attributesToUpdate
      }
    };

    const formData = new URLSearchParams();
    formData.append("f", "json");
    formData.append("features", JSON.stringify([featureEdit]));

    const response = await fetch(`https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/Rivers_Flood/FeatureServer/0/updateFeatures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Failed to update river in ArcGIS");
    }

    if (data.updateResults && data.updateResults.length > 0) {
      const result = data.updateResults[0];
      if (!result.success) {
        throw new Error(result.error?.description || "Failed to update river");
      }
      return result;
    }

    throw new Error("Unexpected response from ArcGIS updateFeatures endpoint.");
  } catch (error) {
    console.error("Error updating ArcGIS river:", error);
    throw error;
  }
}
