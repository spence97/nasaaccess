from tethys_sdk.base import TethysAppBase, url_map_maker


class Nasaaccess(TethysAppBase):
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
                url='nasaaccess',
                controller='nasaaccess.controllers.home'
            ),
            UrlMap(
                name='download_files',
                url='nasaaccess/download',
                controller='nasaaccess.controllers.download_files'
            )
        )

        return url_maps
