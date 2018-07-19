from rpy2.robjects.packages import importr

base = importr('base')
# import rpy2's package module
import rpy2.robjects.packages as rpackages

# import R's utility package
utils = importr('utils')

# select a mirror for R packages
utils.chooseCRANmirror(ind=1) # select the first mirror in the list

# R package names
packnames = ('methods', 'sp', 'rgdal', 'raster', 'rgeos', 'XML', 'stringr', 'ncdf4', 'curl', 'RCurl')

# R vector of strings
from rpy2.robjects.vectors import StrVector

# Selectively install what needs to be install.
# We are fancy, just because we can.
names_to_install = []
for x in packnames:
    if not rpackages.isinstalled(x):
        names_to_install.append(x)
print(names_to_install)
if len(names_to_install) > 0:
    print(len(names_to_install))
    utils.install_packages(StrVector(names_to_install))

