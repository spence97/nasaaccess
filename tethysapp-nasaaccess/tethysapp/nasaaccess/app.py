from tethys_sdk.base import TethysAppBase, url_map_maker


class nasaaccess(TethysAppBase):
    """
    Tethys app class for NASA Access.
    """

    name = 'NASA Access'
    index = 'nasaaccess:home'
    icon = 'nasaaccess/images/NASA_logo.png'
    package = 'nasaaccess'
    root_url = 'nasaaccess'
    color = '#2c3e50'
    description = 'Place a brief description of your app here.'
    tags = ''
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='nasaaccess/',
                controller='nasaaccess.controllers.home'
            ),
            UrlMap(
                name='download_files',
                url='nasaaccess/run',
                controller='nasaaccess.controllers.run_nasaaccess'
            ),
            UrlMap(
                name='upload_shapefiles',
                url='nasaaccess/upload_shp',
                controller='nasaaccess.controllers.upload_shapefiles'
            ),
            UrlMap(
                name='upload_tiffiles',
                url='nasaaccess/upload_dem',
                controller='nasaaccess.controllers.upload_tiffiles'
            )
        )

        return url_maps
