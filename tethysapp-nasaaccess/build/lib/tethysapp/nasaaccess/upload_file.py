from tethys_sdk.services import get_spatial_dataset_engine
import os
from .config import data_path

WORKSPACE = 'nasaaccess'
GEOSERVER_URI = 'http://www.example.com/nasaaccess'

def upload_shapefile(id):

    '''
    Check to see if shapefile is on geoserver. If not, upload it.
    '''
    geoserver_engine = get_spatial_dataset_engine(name='default')
    response = geoserver_engine.get_layer(id, debug=True)
    if response['success'] == False:
        print('Shapefile was not found on geoserver. Uploading it now from app workspace')

        #Create the workspace if it does not already exist
        response = geoserver_engine.list_workspaces()
        if response['success']:
            workspaces = response['result']
            if WORKSPACE not in workspaces:
                geoserver_engine.create_workspace(workspace_id=WORKSPACE, uri=GEOSERVER_URI)

        #Create a string with the path to the zip archive
        zip_archive = os.path.join(data_path, 'shapefiles', id + '.zip')

        # Upload shapefile to the workspaces
        store = id
        store_id = WORKSPACE + ':' + store
        geoserver_engine.create_shapefile_resource(
            store_id=store_id,
            shapefile_zip=zip_archive,
            overwrite=True
        )

