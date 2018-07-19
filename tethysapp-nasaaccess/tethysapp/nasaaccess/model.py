from django.db import models

# Model for the Upload Shapefiles form
class Shapefiles(models.Model):
    shapefile = models.FileField(upload_to='nasaaccess_data/shapefiles')

# Model for the Upload DEM files form
class DEMfiles(models.Model):
    DEMfile = models.FileField(upload_to='nasaaccess_data/DEMfiles/')

# Model for data access form
class accessCode(models.Model):
    access_code = models.CharField(max_length=6)

