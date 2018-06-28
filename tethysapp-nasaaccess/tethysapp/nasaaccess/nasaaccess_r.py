# import rpy2.interactive as r
import os
from .app import nasaaccess as app

app_workspace = app.get_app_workspace()
shapefile_path = os.path.join(app_workspace.path, 'spatial_files', 'shapefiles')
DEMs_path = os.path.join(app_workspace.path, 'spatial_files', 'DEMs')

def gpmswat(watershed, dem, start, end):
    watershed_path = os.path.join(shapefile_path, watershed + '.zip')
    print(watershed_path)
    dem_path = os.path.join(DEMs_path, dem + '.tif')
    print(dem_path)
