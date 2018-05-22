from django.forms import ModelForm
from .model import Shapefiles, DEMfiles


class UploadShpForm(ModelForm):
    class Meta:
        model = Shapefiles
        fields = ('shapefile',)

class UploadDEMForm(ModelForm):
    class Meta:
        model = DEMfiles
        fields = ('DEMfile',)

