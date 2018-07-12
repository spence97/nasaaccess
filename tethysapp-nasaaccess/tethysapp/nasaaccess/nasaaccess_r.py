import os
import random
import string
from .GLDASpolyCentroid import GLDASpolyCentroid
from .GPMpolyCentroid import GPMpolyCentroid
from .GPMswat import GPMswat
from .GLDASwat import GLDASwat
from .config import data_path

def nasaaccess_run(models, watershed, dem, start, end):
    shp_path = os.path.join(data_path, 'shapefiles', watershed + '.shp')
    print(shp_path)
    dem_path = os.path.join(data_path, 'DEMfiles', dem + '.tif')
    print(dem_path)
    unique_id = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    print(unique_id)
    unique_path = data_path + 'outputs/' + unique_id
    print(unique_path)
    os.makedirs(unique_path)

    for model in models:
        if model == 'GPMpolyCentroid':
            output_path = unique_path + '/GPMpolyCentroid/'
            os.makedirs(output_path)
            # GPMpolyCentroid(output_path, shp_path, dem_path, start, end)
        elif model == 'GPMswat':
            output_path = unique_path + '/GPMswat/'
            os.makedirs(output_path)
            # GPMswat(output_path, shp_path, dem_path, start, end)
        elif model == 'GLDASpolyCentroid':
            output_path = unique_path + '/GLDASpolyCentroid/'
            os.makedirs(output_path)
            # GLDASpolyCentroid(output_path, shp_path, dem_path, start, end)
        elif model == 'GLDASwat':
            output_path = unique_path + '/GLDASwat/'
            os.makedirs(output_path)
            # GLDASwat(output_path, shp_path, dem_path, start, end)


