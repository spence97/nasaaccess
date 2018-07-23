import os
from django.http import HttpResponseRedirect
from django.shortcuts import render
from .forms import UploadFileForm

from .upload_file import copy_file
from .app import nasaaccess as app


app_workspace = app.get_app_workspace()
copy_path = os.path.join(app_workspace.path, 'spatial_files')
print(copy_path)

def upload_file(request):
    if request.method == 'POST':
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            copy_file(request.FILES['file'],copy_path)
            return HttpResponseRedirect('download/')
        else:
            form = UploadFileForm()