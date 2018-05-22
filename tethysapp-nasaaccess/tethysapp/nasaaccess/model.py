from django.db import models

# Model for the Upload Shapefiles form
class Shapefiles(models.Model):
    shapefile = models.FileField(upload_to='nasaaccess/shapefiles/')

# Model for the Upload DEM files form
class DEMfiles(models.Model):
    DEMfile = models.FileField(upload_to='nasaaccess/DEMfiles/')
