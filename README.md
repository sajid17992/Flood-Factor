# Flood-Factor

Flood-Factor is an advanced geospatial analysis tool designed to assess flood risk and perform flood modeling using Digital Elevation Models (DEMs), landcover data, and rainfall intensity. The project leverages Python geospatial libraries, hydrologic modeling, and web APIs to provide automated watershed delineation, flood depth estimation, and 3D flood visualizations.

## Features

- **Automated DEM Download:** Fetches elevation data from OpenTopography API based on user-supplied locations.
- **Watershed Delineation:** Uses WhiteboxTools and raster processing to analyze depressions, flow direction, and flow accumulation.
- **Channel & Pour Point Detection:** Identifies stream channels and pour points for precise hydrologic modeling.
- **Landcover Processing:** Computes mean C-factor from landcover data for runoff estimation.
- **Flood Modeling:** Calculates flood depth and inundation using rainfall scenarios and hydrologic equations.
- **3D Visualization:** Generates interactive 3D maps of flooded areas using PyVista.
- **REST API:** Built-in Flask server for programmatic access and file downloads.

## Requirements

- Python 3.7+
- Packages: `rasterio`, `requests`, `numpy`, `pyvista`, `matplotlib`, `scipy`, `whitebox`, `geopy`, `geopandas`, `pandas`, `shapely`, `flask`, `flask_cors`, `python-dotenv`
- [WhiteboxTools](https://www.whiteboxgeo.com/manual/wbt_book/intro.html)
- OpenTopography API Key (you have to create an account and request for an API key form opentopography)

## Usage

1. **Set Up Environment:**
   - Install dependencies via pip:
     ```
     pip install -r requirements.txt
     ```
   - Optionally create a `.env` file for your OpenTopography API key.

2. **Input Data:**
   - Provide an address (preferably in Bangladesh), rainfall intensity (inches/hour), and duration (seconds) via the `/process` API endpoint.

3. **Start the Server:**
   ```
   python main.py
   ```

4. **API Endpoints:**
   - `POST /process`:
     - JSON body: `{ "address": "Dhaka", "rainfall_intensity": 2.5, "duration": 200 }`
     - Returns: Flood depth maps, 3D visualization, and summary metadata.
   - `GET /download/<filename>`:
     - Download result files (GeoTIFFs, PNGs, HTML visualizations).

5. **Outputs:**
   - Flood depth raster and PNG
   - Landcover C-factor map
   - Streams raster
   - 3D flood visualization (HTML)
   - Metadata: inundated area, flood volume, coordinates, bounding box, peak runoff, and more

## Project Structure

- `main.py` : Main application and API server
- `Analysis.ipynb` : Exploratory analysis and demonstrations (Jupyter Notebook)
- `core.ipynb` : Core geospatial and hydrologic processing (Jupyter Notebook)
- `output_files/` : Generated outputs (created automatically)

## Example API Call

```bash
curl -X POST http://localhost:5000/process \
  -H "Content-Type: application/json" \
  -d '{"address":"Dhaka","rainfall_intensity":2.5,"duration":200}'
```

## Acknowledgements

- [OpenTopography](https://opentopography.org/)
- [ESA WorldCover](https://worldcover2020.esa.int/)
- [WhiteboxTools](https://www.whiteboxgeo.com/)
- [PyVista](https://docs.pyvista.org/)

## License

This project is provided for research and educational purposes.

---

*For questions or contributions, please open an issue or pull request.*
