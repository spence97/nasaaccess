from django.shortcuts import render
from tethys_sdk.gizmos import *
from django.http import JsonResponse
import datetime

def home(request):
    """
    Controller for the app home page.
    """
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

    select_file = SelectInput(display_text='',
                              name='select_files',
                              multiple=True,
                              original=False,
                              options=[('GLDASpolyCentroid', 'GLDASpolyCentroid'), ('GLDASwat', 'GLDASwat'),
                                       ('GPMpolyCentroid', 'GPMpolyCentroid'), ('GPMswat', 'GPMswat')],
                              select2_options={'placeholder': 'Select Files to Download',
                                               'allowClear': False},
                              )


    context = {
        'start_pick': start_pick,
        'end_pick': end_pick,
        'select_file': select_file
    }

    return render(request, 'nasaaccess/home.html', context)

def download_files(request):

    """
    Controller to call nasaaccess R functions.
    """

    start = request.POST.get('startDate')
    end = request.POST.get(str('endDate'))
    models = request.POST.getlist('models[]')
    subbasins = request.POST.getlist('subbasins[]')

    print(start, end, models, subbasins)



    json_dict = JsonResponse({'startDate': start, 'endDate': end, 'models': models})
    return(json_dict)