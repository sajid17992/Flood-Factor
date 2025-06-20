import os
import rasterio
import requests
import numpy as np
import pyvista as pv
import matplotlib
matplotlib.use('Agg')  # Set non-interactive backend
import matplotlib.pyplot as plt
from rasterio.plot import show
from scipy.ndimage import zoom
from whitebox import WhiteboxTools
from geopy.geocoders import Nominatim
from rasterio.windows import from_bounds
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import logging
from dotenv import load_dotenv
import warnings

# Suppress PyVista warning
warnings.filterwarnings('ignore', category=UserWarning, message='Points is not a float type')

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
OUTPUT_DIR = os.path.abspath("output_files")  # Absolute path for output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

# File paths (all absolute)
FILE_PATHS = {
    "filled_dem": os.path.abspath(os.path.join(OUTPUT_DIR, "filled_dem.tif")),
    "flow_dir": os.path.abspath(os.path.join(OUTPUT_DIR, "flow_dir.tif")),
    "flow_acc": os.path.abspath(os.path.join(OUTPUT_DIR, "flow_acc.tif")),
    "streams": os.path.abspath(os.path.join(OUTPUT_DIR, "streams.tif")),
    "pour_point_shp": os.path.abspath(os.path.join(OUTPUT_DIR, "pour_point.shp")),
    "snapped_pp_shp": os.path.abspath(os.path.join(OUTPUT_DIR, "snapped_pp_shp.shp")),
    "watershed_tif": os.path.abspath(os.path.join(OUTPUT_DIR, "watershed.tif")),
    "c_factor_tif": os.path.abspath(os.path.join(OUTPUT_DIR, "C_factor_watershed.tif")),
    "flood_depth": os.path.abspath(os.path.join(OUTPUT_DIR, "flood_depth.tif")),
    "inundation_mask": os.path.abspath(os.path.join(OUTPUT_DIR, "flood_inundation_mask.tif")),
    "flood_depth_png": os.path.abspath(os.path.join(OUTPUT_DIR, "flood_depth_map.png")),
    "dem_user_png": os.path.abspath(os.path.join(OUTPUT_DIR, "dem_user.png")),
    "landcover_c_factor_png": os.path.abspath(os.path.join(OUTPUT_DIR, "landcover_c_factor.png")),
    "flood_visualization": os.path.abspath(os.path.join(OUTPUT_DIR, "flood_visualization.html")),
}

# Constants
STREAM_THRESHOLD = 3000
CELL_AREA_M2 = 30 * 30  # 30m x 30m resolution
API_KEY = os.getenv("OPENTOPOGRAPHY_API_KEY", "81ac76541b208f2e3a9a4c24e7bfc6bc")
C_LOOKUP = {
    10: 0.10, 20: 0.15, 30: 0.20, 40: 0.30,
    50: 0.85, 60: 0.40, 70: 0.05, 80: 0.05,
    90: 0.25, 95: 0.10, 100: 0.20
}
DEFAULT_RAINFALL_INTENSITY = 2.0  # inches/hour

def geocode_location(address):
    """Geocode an address to (latitude, longitude)."""
    try:
        geolocator = Nominatim(user_agent="watergate_app")
        full_address = f"{address}, Bangladesh"
        location = geolocator.geocode(full_address)
        if location is None:
            raise ValueError(f"Could not geocode '{full_address}'")
        logger.info(f"Geocoded '{address}' → lat={location.latitude:.6f}, lon={location.longitude:.6f}")
        return float(location.latitude), float(location.longitude)
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        raise

def get_bbox(lat, lon):
    """Compute a bounding box (~100 km²) around a point."""
    meters_per_deg_lat = 111_000.0
    meters_per_deg_lon = 111_000.0 * np.cos(np.deg2rad(lat))
    delta_deg_lat = 10000.0 / meters_per_deg_lat
    delta_deg_lon = 10000.0 / meters_per_deg_lon
    half_lat = delta_deg_lat / 2.0
    half_lon = delta_deg_lon / 2.0
    west = lon - half_lon
    east = lon + half_lon
    south = lat - half_lat
    north = lat + half_lat
    logger.info(f"Bounding box: W={west:.6f}, S={south:.6f}, E={east:.6f}, N={north:.6f}, "
                f"Size ≈ {(east-west)*111000:.0f} m × {(north-south)*111000:.0f} m")
    return float(west), float(south), float(east), float(north)

def download_dem_opentopo(west, south, east, north, out_tif="dem_user.tif"):
    """Download DEM from OpenTopography."""
    out_path = os.path.abspath(os.path.join(OUTPUT_DIR, out_tif))
    url = (
        "https://portal.opentopography.org/API/globaldem?"
        f"demtype=SRTMGL1&south={south}&north={north}&west={west}&east={east}"
        f"&outputFormat=GTiff&API_Key={API_KEY}"
    )
    logger.info(f"Requesting DEM from OpenTopography: {url}")
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        with open(out_path, "wb") as f:
            f.write(r.content)
        with rasterio.open(out_path) as src:
            arr = src.read(1)
            plt.figure(figsize=(6, 5))
            show(arr, cmap="terrain", title=f"DEM for User Box ({out_tif})")
            plt.tight_layout()
            plt.savefig(FILE_PATHS["dem_user_png"], dpi=300, bbox_inches='tight')
            plt.close()
        logger.info(f"DEM saved to: {out_path}")
        return out_path
    except Exception as e:
        logger.error(f"DEM download error: {str(e)}")
        raise

def process_watershed(dem_path):
    """Perform watershed delineation using WhiteboxTools."""
    wbt = WhiteboxTools()
    wbt.verbose = True
    wbt.set_working_dir(OUTPUT_DIR)  # Set working directory to output_files

    # Ensure dem_path is absolute
    dem_path = os.path.abspath(dem_path)
    logger.info(f"Processing watershed with DEM: {dem_path}")

    # Breach depressions
    logger.info("Breaching depressions in DEM")
    if not os.path.exists(dem_path):
        raise RuntimeError(f"Input DEM not found: {dem_path}")
    wbt.breach_depressions(dem=dem_path, output=FILE_PATHS["filled_dem"])
    if not os.path.exists(FILE_PATHS["filled_dem"]):
        raise RuntimeError(f"Failed to create filled_dem.tif: {FILE_PATHS['filled_dem']}")

    # Compute D8 flow direction
    logger.info("Computing D8 flow direction")
    wbt.d8_pointer(dem=FILE_PATHS["filled_dem"], output=FILE_PATHS["flow_dir"])
    if not os.path.exists(FILE_PATHS["flow_dir"]):
        raise RuntimeError(f"Failed to create flow_dir.tif: {FILE_PATHS['flow_dir']}")

    # Compute D8 flow accumulation
    logger.info("Computing D8 flow accumulation")
    wbt.d8_flow_accumulation(FILE_PATHS["filled_dem"], FILE_PATHS["flow_acc"], out_type="cells")
    if not os.path.exists(FILE_PATHS["flow_acc"]):
        raise RuntimeError(f"Failed to create flow_acc.tif: {FILE_PATHS['flow_acc']}")

    # Read flow accumulation
    with rasterio.open(FILE_PATHS["flow_acc"]) as src:
        flow_acc_arr = src.read(1)
    max_acc = np.nanmax(flow_acc_arr)
    logger.info(f"Max flow-accumulation: {max_acc:.0f} cells")

    if max_acc < STREAM_THRESHOLD:
        logger.warning("No significant channels detected (flow_acc < threshold)")
        return False, None

    # Extract streams
    logger.info("Extracting streams")
    wbt.extract_streams(flow_accum=FILE_PATHS["flow_acc"], output=FILE_PATHS["streams"], threshold=STREAM_THRESHOLD)
    if not os.path.exists(FILE_PATHS["streams"]):
        raise RuntimeError(f"Failed to create streams.tif: {FILE_PATHS['streams']}")

    # Identify pour point
    with rasterio.open(FILE_PATHS["flow_acc"]) as src:
        flow_acc_arr = src.read(1)
        transform = src.transform
    idx_flat = np.nanargmax(flow_acc_arr)
    r, c = np.unravel_index(idx_flat, flow_acc_arr.shape)
    lon_pp, lat_pp = (
        transform.c + c * transform.a + transform.a/2,
        transform.f + r * transform.e + transform.e/2
    )
    logger.info(f"Pour point: row={r}, col={c}, lon={lon_pp:.6f}, lat={lat_pp:.6f}")

    # Create pour point shapefile
    gdf = gpd.GeoDataFrame(
        pd.DataFrame({'id': [1]}),
        geometry=[Point(lon_pp, lat_pp)],
        crs="EPSG:4326"
    )
    gdf.to_file(FILE_PATHS["pour_point_shp"])
    logger.info(f"Pour point shapefile saved: {FILE_PATHS['pour_point_shp']}")
    if not os.path.exists(FILE_PATHS["pour_point_shp"]):
        raise RuntimeError(f"Failed to create pour_point.shp: {FILE_PATHS['pour_point_shp']}")

    # Snap pour points
    logger.info("Snapping pour points")
    wbt.snap_pour_points(
        pour_pts=FILE_PATHS["pour_point_shp"],
        flow_accum=FILE_PATHS["flow_acc"],
        output=FILE_PATHS["snapped_pp_shp"],
        snap_dist=10
    )
    logger.info(f"Snapped pour point saved: {FILE_PATHS['snapped_pp_shp']}")
    if not os.path.exists(FILE_PATHS["snapped_pp_shp"]):
        raise RuntimeError(f"Failed to create snapped_pp_shp.shp: {FILE_PATHS['snapped_pp_shp']}")

    # Delineate watershed
    logger.info("Delineating watershed")
    wbt.watershed(
        d8_pntr=FILE_PATHS["flow_dir"],
        pour_pts=FILE_PATHS["snapped_pp_shp"],
        output=FILE_PATHS["watershed_tif"]
    )
    logger.info(f"Watershed saved: {FILE_PATHS['watershed_tif']}")
    if not os.path.exists(FILE_PATHS["watershed_tif"]):
        raise RuntimeError(f"Failed to create watershed.tif: {FILE_PATHS['watershed_tif']}")

    # Calculate watershed area
    with rasterio.open(FILE_PATHS["watershed_tif"]) as src:
        ws = src.read(1)
        watershed_area_m2 = np.sum(ws > 0) * CELL_AREA_M2
    return True, float(watershed_area_m2)

def process_landcover():
    """Process landcover to compute C-factor within the watershed."""
    esa_path = os.path.abspath("merged_landcover.tif")
    if not os.path.exists(esa_path):
        logger.error("Landcover file 'merged_landcover.tif' not found")
        raise FileNotFoundError("Landcover file 'merged_landcover.tif' not found")

    with rasterio.open(FILE_PATHS["watershed_tif"]) as src_ws:
        ws = src_ws.read(1)
        ws_transform = src_ws.transform
        ws_crs = src_ws.crs
        ws_bounds = src_ws.bounds

    with rasterio.open(esa_path) as src_lc:
        if src_lc.crs != ws_crs:
            logger.error("CRS mismatch between watershed and landcover")
            raise RuntimeError("CRS mismatch: reproject landcover first")
        window = from_bounds(
            ws_bounds.left, ws_bounds.bottom, ws_bounds.right, ws_bounds.top,
            transform=src_lc.transform
        )
        window = window.round_offsets().round_shape()
        lc_window = src_lc.read(1, window=window)
        lc_window_transform = src_lc.window_transform(window)
        lc_meta = src_lc.meta.copy()

    lc_meta.update({
        "height": lc_window.shape[0],
        "width": lc_window.shape[1],
        "transform": lc_window_transform
    })

    C_window = np.full(lc_window.shape, np.nan, dtype=np.float32)
    for cls, cval in C_LOOKUP.items():
        C_window[lc_window == cls] = cval

    nan_mask = np.isnan(C_window)
    if np.any(nan_mask):
        mean_val = np.nanmean(C_window)
        C_window[nan_mask] = mean_val
        logger.info(f"Filled NaN values with mean C-factor: {mean_val:.2f}")

    with rasterio.open(FILE_PATHS["watershed_tif"]) as src_ws:
        ws_mask = src_ws.read(1, window=window)
    C_window[ws_mask == 0] = np.nan

    plt.figure(figsize=(10, 6))
    plt.title("Landcover C-factor")
    plt.imshow(C_window, cmap="RdYlGn")
    plt.colorbar(label="C-factor")
    plt.savefig(FILE_PATHS["landcover_c_factor_png"], dpi=300, bbox_inches='tight')
    plt.close()

    rows, cols = np.where(~np.isnan(C_window))
    values = C_window[rows, cols]
    mean_c_factor = np.mean(values)
    logger.info(f"Mean C-factor: {mean_c_factor:.2f}")

    with rasterio.open(FILE_PATHS["c_factor_tif"], "w", **lc_meta) as dst:
        dst.write(C_window, 1)
    logger.info(f"C-factor raster saved: {FILE_PATHS['c_factor_tif']}")

    return float(mean_c_factor)

def calculate_peak_runoff(watershed_area_m2, rainfall_intensity_inch_per_hour, mean_c_factor):
    """Calculate peak runoff Q (cubic feet per second) using Q = CIA."""
    watershed_area_acres = watershed_area_m2 * 0.000247105
    Q_feet3_s = mean_c_factor * rainfall_intensity_inch_per_hour * watershed_area_acres
    logger.info(f"Calculated Q_feet3_s: {Q_feet3_s:.2f} ft³/s (C={mean_c_factor:.2f}, "
                f"I={rainfall_intensity_inch_per_hour:.2f} inch/hr, A={watershed_area_acres:.2f} acres)")
    return float(Q_feet3_s)

def calculate_flood_depth(Q_feet3_s, flood_h):
    """Calculate flood depth and inundation mask."""
    with rasterio.open(FILE_PATHS["filled_dem"]) as src:
        dem = src.read(1)
        transform = src.transform
        profile = src.profile
        nodata = src.nodata if src.nodata is not None else -9999
        dem = np.where(dem == nodata, np.nan, dem)

    V_total_m3 = Q_feet3_s * flood_h * 3600 * 0.0283168  # Convert ft³ to m³
    water_depth = np.zeros_like(dem, dtype=np.float32)
    remaining_volume = V_total_m3

    while remaining_volume > 0:
        min_elevation = np.nanmin(dem + water_depth)
        flood_cells = (dem + water_depth == min_elevation)
        num_flood_cells = np.sum(flood_cells)
        volume_per_meter = num_flood_cells * CELL_AREA_M2

        if remaining_volume >= volume_per_meter:
            water_depth[flood_cells] += 1
            remaining_volume -= volume_per_meter
        else:
            water_depth[flood_cells] += remaining_volume / volume_per_meter
            remaining_volume = 0

    flood_depth = water_depth
    inundation_mask = (flood_depth > 0).astype(np.uint8)

    flood_depth_profile = profile.copy()
    flood_depth_profile.update(dtype="float32", count=1, nodata=np.nan)
    with rasterio.open(FILE_PATHS["flood_depth"], "w", **flood_depth_profile) as dst:
        dst.write(flood_depth, 1)

    inundation_profile = profile.copy()
    inundation_profile.update(dtype="uint8", count=1, nodata=0)
    with rasterio.open(FILE_PATHS["inundation_mask"], "w", **inundation_profile) as dst:
        dst.write(inundation_mask, 1)

    plt.figure(figsize=(10, 8))
    plt.imshow(flood_depth, cmap="Blues", extent=(
        transform[2], transform[2] + dem.shape[1] * transform[0],
        transform[5] + dem.shape[0] * transform[4], transform[5]
    ))
    plt.colorbar(label="Flood Depth (m)")
    plt.title("Flood Depth Map")
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.tight_layout()
    plt.savefig(FILE_PATHS["flood_depth_png"], dpi=300, bbox_inches='tight')
    plt.close()

    logger.info(f"Flood depth saved: {FILE_PATHS['flood_depth']}")
    logger.info(f"Inundation mask saved: {FILE_PATHS['inundation_mask']}")
    logger.info(f"Flood depth map saved: {FILE_PATHS['flood_depth_png']}")

    flooded_area_m2 = np.sum(inundation_mask) * CELL_AREA_M2
    flooded_area_km2 = flooded_area_m2 / 1e6
    flooded_volume_m3 = np.nansum(flood_depth * CELL_AREA_M2)
    logger.info(f"Total Flooded Area: {flooded_area_km2:.2f} km²")
    logger.info(f"Total Flooded Volume: {flooded_volume_m3:.2f} m³")

    return float(flooded_area_km2), float(flooded_volume_m3)

def create_3d_visualization():
    """Create a 3D visualization using PyVista."""
    pv.set_jupyter_backend('trame')
    with rasterio.open(FILE_PATHS["filled_dem"]) as src:
        dem = src.read(1)
        transform = src.transform
        nodata = src.nodata if src.nodata is not None else -9999
        dem = np.where(dem == nodata, np.nan, dem)

    with rasterio.open(FILE_PATHS["flood_depth"]) as src:
        flood_depth = src.read(1)

    if flood_depth.shape != dem.shape:
        scale_y = dem.shape[0] / flood_depth.shape[0]
        scale_x = dem.shape[1] / flood_depth.shape[1]
        flood_depth_resized = zoom(flood_depth, (scale_y, scale_x), order=1)
    else:
        flood_depth_resized = flood_depth

    rows, cols = dem.shape
    x = np.arange(cols)
    y = np.arange(rows)
    x, y = np.meshgrid(x, y)
    z = dem

    grid = pv.StructuredGrid(x, y, z)
    flood_depth_flattened = flood_depth_resized.ravel()
    flooded_elevation = np.where(flood_depth_resized > 0, dem + flood_depth_resized, np.nan)
    grid["Flood Depth"] = np.nan_to_num(flood_depth_flattened, nan=0)
    grid["Flooded Elevation"] = np.nan_to_num(flooded_elevation.ravel(), nan=dem.ravel())

    plotter = pv.Plotter()
    plotter.add_mesh(grid, scalars="Flooded Elevation", cmap="terrain", opacity=0.8, show_edges=False)
    flood_mask = flood_depth_resized > 0
    flood_points = np.column_stack((x[flood_mask], y[flood_mask], flooded_elevation[flood_mask]))
    flood_cloud = pv.PolyData(flood_points)
    plotter.add_mesh(flood_cloud, color="blue", point_size=5, render_points_as_spheres=True, label="Flooded Areas")
    plotter.add_legend()
    plotter.add_axes()
    plotter.show_grid()
    plotter.set_background("white")

    try:
        plotter.export_html(FILE_PATHS["flood_visualization"])
        logger.info(f"3D visualization saved: {FILE_PATHS['flood_visualization']}")
    except Exception as e:
        logger.error(f"Failed to export 3D visualization: {str(e)}")
        raise

@app.route('/process', methods=["POST"])
def process():
    """Main processing endpoint."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No JSON data provided"}), 400

        address = data.get("address")
        flood_h = float(data.get("duration", 150))
        rainfall_intensity = float(data.get("rainfall_intensity", DEFAULT_RAINFALL_INTENSITY))

        if not address:
            return jsonify({"status": "error", "message": "Address is required"}), 400

        lat, lon = geocode_location(address)
        west, south, east, north = get_bbox(lat, lon)
        dem_path = download_dem_opentopo(west, south, east, north)
        watershed_success, watershed_area_m2 = process_watershed(dem_path)

        if not watershed_success:
            return jsonify({
                "status": "error",
                "message": "No significant channels detected in the watershed"
            }), 400

        mean_c_factor = process_landcover()
        Q_feet3_s = calculate_peak_runoff(watershed_area_m2, rainfall_intensity, mean_c_factor)
        flooded_area_km2, flooded_volume_m3 = calculate_flood_depth(Q_feet3_s, flood_h)
        create_3d_visualization()

        response = {
            "status": "success",
            "files": [
                f"/download/{os.path.basename(FILE_PATHS['flood_depth'])}",
                f"/download/{os.path.basename(FILE_PATHS['flood_depth_png'])}",
                f"/download/{os.path.basename(FILE_PATHS['landcover_c_factor_png'])}",
                f"/download/{os.path.basename(FILE_PATHS['streams'])}",
                f"/download/{os.path.basename(FILE_PATHS['flood_visualization'])}"
            ],
            "metadata": {
                "flooded_area_km2": float(round(flooded_area_km2, 2)),
                "flooded_volume_m3": float(round(flooded_volume_m3, 2)),
                "latitude": float(round(lat, 6)),
                "longitude": float(round(lon, 6)),
                "bounding_box": {
                    "west": float(round(west, 6)),
                    "south": float(round(south, 6)),
                    "east": float(round(east, 6)),
                    "north": float(round(north, 6))
                },
                "peak_runoff_cfs": float(round(Q_feet3_s, 2)),
                "mean_c_factor": float(round(mean_c_factor, 2)),
                "rainfall_intensity": float(rainfall_intensity),
                "watershed_area_km2": float(round(watershed_area_m2 / 1e6, 2))
            }
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/download/<path:filename>", methods=["GET"])
def download(filename):
    """Serve files from the output directory."""
    safe_path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(safe_path):
        return jsonify({"status": "error", "message": f"File {filename} not found"}), 404
    return send_from_directory(
        OUTPUT_DIR, filename,
        as_attachment=not filename.endswith(".html")
    )

if __name__ == "__main__":
    logger.info("Starting Flask application")
    app.run(debug=True)