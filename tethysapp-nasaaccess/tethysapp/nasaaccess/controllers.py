import os
from django.shortcuts import render
from tethys_sdk.gizmos import *
from django.http import JsonResponse, HttpResponseRedirect
import datetime
import zipfile
import shutil
from .forms import UploadShpForm, UploadDEMForm
from .upload_file import upload_shapefile
from .app import nasaaccess as app
from .config import temp_workspace, data_path
from .nasaaccess_r import gpmswat

def home(request):
    """
    Controller for the app home page.
    """

    # Get available Shapefiles and DEM files from app workspace and use them as options in drop down menus
    shapefile_path = os.path.join(data_path, 'shapefiles')
    dem_path = os.path.join(data_path, 'DEMfiles')

    shp_options = []
    shp_files = os.listdir(shapefile_path)
    for f in shp_files:
        name = f.split(".")[0]
        if name not in shp_options:
            shp_options.append((name,name))

    dem_options = []
    dem_files = os.listdir(dem_path)
    for f in dem_files:
        name = f.split(".")[0]
        dem_options.append((name, name))

    shpform = UploadShpForm()
    demform = UploadDEMForm()


    # Set date picker options
    start = 'Jan 01, 2000'
    end = datetime.datetime.now().strftime("%b %d, %Y")
    format = 'M d, yyyy'
    startView = 'decade'
    minView = 'days'

    start_pick = DatePicker(name='start_pick',
                            autoclose=True,
                            format=format,
                            min_view_mode=minView,
                            start_date=start,
                            end_date=end,
                            start_view=startView,
                            today_button=False,
                            initial='Start Date')

    end_pick = DatePicker(name='end_pick',
                          autoclose=True,
                          format=format,
                          min_view_mode=minView,
                          start_date=start,
                          end_date=end,
                          start_view=startView,
                          today_button=False,
                          initial='End Date'
                          )


    select_watershed = SelectInput(display_text='',
                              name='select_watershed',
                              multiple=False,
                              original=False,
                              options=shp_options,
                              select2_options={'placeholder': 'Select Boundary Shapefile',
                                               'allowClear': False},
                              )

    select_dem = SelectInput(display_text='',
                                   name='select_dem',
                                   multiple=False,
                                   original=False,
                                   options=dem_options,
                                   select2_options={'placeholder': 'Select DEM',
                                                    'allowClear': False},
                                   )


    context = {
        'start_pick': start_pick,
        'end_pick': end_pick,
        'shpform': shpform,
        'demform': demform,
        'select_watershed': select_watershed,
        'select_dem': select_dem
    }

    return render(request, 'nasaaccess/home.html', context)

def run_nasaaccess(request):

    """
    Controller to call nasaaccess R functions.
    """
    # Get selected parameters and pass them into nasaccess R scripts
    start = request.POST.get('startDate')
    end = request.POST.get(str('endDate'))
    models = request.POST.getlist('models[]')
    watershed = request.POST.get('watershed')
    dem = request.POST.get('dem')
    json_dict = JsonResponse({'startDate': start, 'endDate': end, 'models': models, 'Watershed': watershed, 'DEM': dem})
    print(json_dict)
    gpmswat(watershed, dem, start, end)
    return json_dict



def upload_shapefiles(request):

    """
    Controller to upload new shapefiles to app server and publish to geoserver
    """

    if request.method == 'POST':
        form = UploadShpForm(request.POST, request.FILES)
        id = request.FILES['shapefile'].name.split('.')[0] # Get name of the watershed from the shapefile name
        zip_path = os.path.join(data_path, 'shapefiles', id + '.zip')
        print(zip_path)
        new_dir = data_path + '/shapefiles/' + id
        print(new_dir)
        os.mkdir(new_dir)
        shapefile_path = os.path.join(new_dir)
        if form.is_valid():
            if os.path.isfile(shapefile_path):
                print('file already exists')
                upload_shapefile(id)
            else:
                print('saving shapefile to server')
                form.save() # Save the shapefile to the temp file path
                zip_ref = zipfile.ZipFile(zip_path, 'r')
                print(zip_ref)
                zip_ref.extractall(shapefile_path)
                zip_ref.close()
                prj_path = os.path.join(shapefile_path, id + '.prj')
                with open(prj_path) as f:
                    for line in f:
                        print(line)
                        if 'PROJCS[' in line:
                            print('Please project this file into the WGS 1984 Geographic Coordinate System before uploading your watershed')
                            shutil.rmtree(shapefile_path)
                            os.remove(zip_path)
                            return HttpResponseRedirect('../') # Return to Home page
                        else:
                            upload_shapefile(id) # Run upload_shapefile function to upload file to the geoserver
            return HttpResponseRedirect('../') # Return to Home page
    else:
        return HttpResponseRedirect('../') # Return to Home page


def upload_tiffiles(request):
    """
    Controller to upload new DEM files
    """


    if request.method == 'POST':
        form = UploadDEMForm(request.POST, request.FILES)
        id = request.FILES['DEMfile'].name
        print(id)
        # temp_file_path = os.path.join(temp_workspace,'DEMfiles', id)
        # DEM_path = os.path.join(data_path, 'DEMfiles', id)
        if form.is_valid():
            form.save()
            # copyfile(temp_file_path, perm_file_path)
            # os.remove(temp_file_path)
            return HttpResponseRedirect('../')
    else:
        return HttpResponseRedirect('../')