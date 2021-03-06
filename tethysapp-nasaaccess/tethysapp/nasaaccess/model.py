from django.db import models
from .config import data_path

# Model for the Upload Shapefiles form
class Shapefiles(models.Model):
    shapefile = models.FileField(upload_to=data_path + '/shapefiles/')

# Model for the Upload DEM files form
class DEMfiles(models.Model):
    DEMfile = models.FileField(upload_to=data_path + '/DEMfiles')
