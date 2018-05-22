import os
from django.shortcuts import render
from tethys_sdk.gizmos import *
from django.http import JsonResponse, HttpResponseRedirect
import datetime
from shutil import copyfile
from .forms import UploadShpForm, UploadDEMForm
from .upload_file import upload_shapefile
from .app import nasaaccess as app

def home(request):
    """
    Controller for the app home page.
    """

    # Get available Shapefiles and DEM files from app workspace and use them as options in drop down menus
    app_workspace = app.get_app_workspace()
    shapefile_path = os.path.join(app_workspace.path, 'spatial_files', 'shapefiles')
    dem_path = os.path.join(app_workspace.path, 'spatial_files', 'DEMs')

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
    return json_dict



def upload_shapefiles(request):

    """
    Controller to upload new shapefiles to app server and publish to geoserver
    """

    if request.method == 'POST':
        form = UploadShpForm(request.POST, request.FILES)
        id = request.FILES['shapefile'].name.split('.')[0] # Get name of the watershed from the shapefile name
        project_directory = os.path.dirname(__file__)
        app_workspace = os.path.join(project_directory, 'workspaces', 'app_workspace')
        temp_file_path = os.path.join('/Users/Student/Documents/tethys_temp_files', 'nasaaccess','shapefiles', id + '.zip')
        perm_file_path = os.path.join(app_workspace, 'spatial_files', 'shapefiles', id + '.zip')
        if form.is_valid():
            if os.path.isfile(perm_file_path):
                print('file already exists')
                upload_shapefile(id)
            else:
                print('saving shapefile to server')
                form.save() # Save the shapefile to the temp file path
                copyfile(temp_file_path, perm_file_path) # Copy the file from temp path to permanent file path in app workspace
                os.remove(temp_file_path) # Delete temporary file
                upload_shapefile(id) # Run upload_shapefile function to upload file to the geoserver
            return HttpResponseRedirect('../') # Return to Home page
    else:
        return HttpResponseRedirect('../') # Return to Home page


def upload_tiffiles(request):
    """
    Controller to upload new DEM files
    """

    app_workspace = app.get_app_workspace()
    temp_file_path = os.path.join('/Users/Student/Documents/tethys_temp_files', 'nasaaccess')
    dem_path = os.path.join(app_workspace, 'spatial_files', 'DEMs')

    if request.method == 'POST':
        form = UploadDEMForm(request.POST, request.FILES)
        id = request.FILES['DEMfile'].name
        print(id)
        app_workspace = app.get_app_workspace()
        temp_file_path = os.path.join('/Users/Student/Documents/tethys_temp_files', 'nasaaccess', id)
        perm_file_path = os.path.join(app_workspace, 'spatial_files', 'DEMs', id)
        if form.is_valid():
            form.save()
            copyfile(temp_file_path, perm_file_path)
            os.remove(temp_file_path)
            return HttpResponseRedirect('../')
    else:
        return HttpResponseRedirect('../')