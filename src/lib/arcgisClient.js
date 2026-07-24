// The base URL for the ArcGIS Feature Layer (Layer 0)
const ARCGIS_LAYER_URL = "https://services5.arcgis.com/2ZRAaoTSJbQ20ceg/arcgis/rest/services/JALAN_BANJIR/FeatureServer/0";

/**
 * Fetches all roads from the ArcGIS Feature Layer so we can populate the dropdown.
 */
export async function fetchRoads() {
  try {
    const params = new URLSearchParams({
      where: "1=1", // Get all features
      outFields: "OBJECTID,Name,Route_No,DISTRICT,STATE,ROUTETYPE,DEPTH,Status,DAMAGE",
      returnGeometry: "false",
      orderByFields: "Name ASC",
      f: "json"
    });

    const response = await fetch(`${ARCGIS_LAYER_URL}/query?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch roads");
    }

    // Map the raw ArcGIS features into a simpler array of objects for React
    if (data.features) {
      return data.features.map(feature => feature.attributes);
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching ArcGIS roads:", error);
    throw error;
  }
}

/**
 * Updates a specific road's attributes in ArcGIS using its OBJECTID.
 * @param {number} objectId - The internal ArcGIS ID of the road
 * @param {object} attributesToUpdate - The fields to update (e.g. { Status: "Closed", DEPTH: 1.5 })
 */
export async function updateRoadStatus(objectId, attributesToUpdate) {
  try {
    // Construct the feature edit payload
    const featureEdit = {
      attributes: {
        OBJECTID: objectId,
        ...attributesToUpdate
      }
    };

    const formData = new URLSearchParams();
    formData.append("f", "json");
    formData.append("features", JSON.stringify([featureEdit]));

    const response = await fetch(`${ARCGIS_LAYER_URL}/updateFeatures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Failed to update road in ArcGIS");
    }

    // check updateResults array
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
