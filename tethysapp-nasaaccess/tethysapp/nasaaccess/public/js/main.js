/*****************************************************************************
 * FILE:    SWAT Viewer MAIN JS
 * DATE:    3/28/18
 * AUTHOR: Spencer McDonald
 * COPYRIGHT:
 * LICENSE:
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/

var LIBRARY_OBJECT = (function() {
    // Wrap the library in a package function
    "use strict"; // And enable strict mode for this library

    /************************************************************************
     *                      MODULE LEVEL / GLOBAL VARIABLES
     *************************************************************************/
        var current_layer,
        element,
        layers,
        map,
        public_interface,			// Object returned by the module
        variable_data,
        wms_workspace,
        geoserver_url = 'http://localhost:8080/geoserver/wms',
        wms_url,
        wms_layer,
        wms_source,
        basin_layer,
        streams_layer,
        featureOverlayStream,
        featureOverlaySubbasin,
        subbasin_overlay_layers,
        geojson_list;

    /************************************************************************
     *                    PRIVATE FUNCTION DECLARATIONS
     *************************************************************************/
    var add_basins,
        add_streams,
        init_events,
        init_all,
        init_map,
        nasaaccess,
        clear_selection,
        getCookie;




    /************************************************************************
     *                    PRIVATE FUNCTION IMPLEMENTATIONS
     *************************************************************************/

    //Get a CSRF cookie for request
    getCookie = function(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    //find if method is csrf safe
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    //add csrf token to appropriate ajax requests
    $(function() {
        $.ajaxSetup({
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
                }
            }
        });
    }); //document ready


    //send data to database with error messages
    function ajax_update_database(ajax_url, ajax_data) {
        //backslash at end of url is required
        if (ajax_url.substr(-1) !== "/") {
            ajax_url = ajax_url.concat("/");
        }
        //update database
        var xhr = jQuery.ajax({
            type: "POST",
            url: ajax_url,
            dataType: "json",
            data: ajax_data
        });
        xhr.done(function(data) {
            if("success" in data) {
                // console.log("success");
            } else {
                console.log(xhr.responseText);
            }
        })
        .fail(function(xhr, status, error) {
            console.log(xhr.responseText);
        });

        return xhr;
        console.log(xhr)
    }

    init_map = function() {

//      Set initial map projection, basemap, center, and zoom
        var projection = ol.proj.get('EPSG:4326');
        var baseLayer = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
                imagerySet: 'AerialWithLabels', // Options 'Aerial', 'AerialWithLabels', 'Road',
            }),
            title: 'baselayer'
        });


        var view = new ol.View({
            center: [101.5, 14.5],
            projection: projection,
            zoom: 5.3
        });
        wms_source = new ol.source.ImageWMS();

        wms_layer = new ol.layer.Image({
            source: wms_source
        });

        layers = [baseLayer];

        map = new ol.Map({
            target: document.getElementById("map"),
            layers: layers,
            view: view
        });

        map.crossOrigin = 'anonymous';



    };


    init_events = function(){
//      Set map interactions
        (function () {
            var target, observer, config;
            // select the target node
            target = $('#app-content-wrapper')[0];

            observer = new MutationObserver(function () {
                window.setTimeout(function () {
                    map.updateSize();
                }, 350);
            });
            $(window).on('resize', function () {
                map.updateSize();
            });

            config = {attributes: true};

            observer.observe(target, config);
        }());

    };


    add_basins = function(){
//      Get the selected value from the select watershed drop down
        var layer = ($('#select_watershed').val()).split('.')[0];
//      Set the view based on the layer extent
        if (layer === 'lower_mekong') {
            var view = new ol.View({
                center: [104.5, 17.5],
                projection: 'EPSG:4326',
                zoom: 6.5
            });

            map.setView(view)

        } else {
            var layerParams
            var layer_xml
            var bbox
            var srs


            var wms_url = geoserver_url + "?service=WMS&version=1.1.1&request=GetCapabilities&"
            $.ajax({
                type: "GET",
                url: wms_url,
                dataType: 'xml',
                success: function (xml) {
//                  Get the projection and extent of the selected layer from the wms capabilities xml file
                    var layers = xml.getElementsByTagName("Layer");
                    var parser = new ol.format.WMSCapabilities();
                    var result = parser.read(xml);
                    var layers = result['Capability']['Layer']['Layer']
                    for (var i=0; i<layers.length; i++) {
                        if(layers[i].Title == layer) {
                            layer_xml = xml.getElementsByTagName('Layer')[i+1]
                            console.log(layer_xml)
                            layerParams = layers[i]
                        }
                    }
                    srs = layer_xml.getElementsByTagName('SRS')[0].innerHTML
                    bbox = layerParams.BoundingBox[0].extent
                    console.log(srs, bbox)
                    var new_extent = ol.proj.transformExtent(bbox, srs, 'EPSG:4326');
                    var center = ol.extent.getCenter(new_extent)
                    console.log(center)
//                  Create a new view using the extent of the new selected layer
                    var view = new ol.View({
                        center: center,
                        projection: 'EPSG:4326',
                        extent: new_extent,
                        zoom: 6
                    });
//                  Move the map to center on the selected watershed
                    map.setView(view)
                    map.getView().fit(new_extent, map.getSize());
                }
            });
        }



//      Display styling for the selected watershed boundaries
        var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>nasaaccess:'+ layer + '</Name><UserStyle><FeatureTypeStyle><Rule>\
            <PolygonSymbolizer>\
            <Name>rule1</Name>\
            <Title>Watersheds</Title>\
            <Abstract></Abstract>\
            <Fill>\
              <CssParameter name="fill">#ccd5e8</CssParameter>\
              <CssParameter name="fill-opacity">0</CssParameter>\
            </Fill>\
            <Stroke>\
              <CssParameter name="stroke">#ffffff</CssParameter>\
              <CssParameter name="stroke-width">1.5</CssParameter>\
            </Stroke>\
            </PolygonSymbolizer>\
            </Rule>\
            </FeatureTypeStyle>\
            </UserStyle>\
            </NamedLayer>\
            </StyledLayerDescriptor>';
//      Identify the wms source url, workspace, and datastore
        wms_source = new ol.source.ImageWMS({
            url: geoserver_url,
            params: {'LAYERS':'nasaaccess:' + layer,'SLD_BODY':sld_string},
            serverType: 'geoserver',
            crossOrigin: 'Anonymous',
        });

        basin_layer = new ol.layer.Image({
            source: wms_source,
            title: 'subbasins'
        });

//      add the selected layer to the map
        map.addLayer(basin_layer);


    };

    init_all = function(){
        init_map();
        init_events();
    };

    nasaaccess = function() {
//      Get the values from the nasaaccess form and pass them to the run_nasaaccess python controller
        var start = $('#start_pick').val();
        var end = $('#end_pick').val();
        var models = [];
        $('.chk:checked').each(function() {
             models.push( $( this ).val());
        });
        var watershed = $('#select_watershed').val();
        var dem = $('#select_dem').val();
        console.log(start,end,models,watershed,dem)
        $.ajax({
            type: 'POST',
            url: "/apps/nasaaccess/run/",
            data: {
                'startDate': start,
                'endDate': end,
                'models': models,
                'watershed': watershed,
                'dem': dem
            },
        }).done(function() {

        });
    }


    /************************************************************************
     *                        DEFINE PUBLIC INTERFACE
     *************************************************************************/

    public_interface = {

    };

    /************************************************************************
     *                  INITIALIZATION / CONSTRUCTOR
     *************************************************************************/

    // Initialization: jQuery function that gets called when
    // the DOM tree finishes loading

    $(function() {
        init_all();

        $('#nasaaccess').click(function() {
            console.log('NASA ACCESS!!!!')
            nasaaccess();
        });

        $('#select_watershed').change(function() {
            map.removeLayer(basin_layer);
            add_basins();
        });

        $('#addShp').click(function() {
            console.log('Add Watershed')
            $("#shp-modal").modal('show');
        })

        $('#addDem').click(function() {
            console.log('Add DEM')
            $("#dem-modal").modal('show');
        })


    });




    return public_interface;


}());// End of package wrapper

//        map.on("singleclick",function(evt){
//
//
//            if (map.getTargetElement().style.cursor == "pointer") {
//
//                var clickCoord = evt.coordinate;
//                var view = map.getView();
//                var viewResolution = view.getResolution();
//
//                var wms_url = current_layer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), {'INFO_FORMAT': 'application/json'}); //Get the wms url for the clicked point
//                if (wms_url) {
//                    //Retrieving the details for clicked point via the url
//                    $.ajax({
//                        type: "GET",
//                        url: wms_url,
//                        dataType: 'json',
//                        success: function (result) {
//                            console.log(result)
//                           var streamID = parseFloat(result["features"][0]["properties"]["Subbasin"]);
//                           var subbasinVectorSource = new ol.source.Vector({
//                                format: new ol.format.GeoJSON(),
//                                url: 'http://localhost:8080/geoserver/wms/ows?service=wfs&version=2.0.0&request=getfeature&typename=swat_mekong:subbasin&CQL_FILTER=Subbasin='+streamID+'&outputFormat=application/json&srsname=EPSG:4326&,EPSG:4326',
//                                strategy: ol.loadingstrategy.bbox
//                           });
//
//
//                           var color = '#0dd8c0';
//                           color = ol.color.asArray(color);
//                           color = color.slice();
//                           color[3] = 0.5;
//                           featureOverlaySubbasin = new ol.layer.Vector({
//                                source: subbasinVectorSource,
//                                style: new ol.style.Style({
//                                    stroke: new ol.style.Stroke({
//                                        color: '#000000',
//                                        width: 1
//                                    }),
//                                    fill: new ol.style.Fill({
//                                        color: color
//                                    })
//                                }),
//                                title: 'subbasin_overlay'
//                           });
//
//                           map.addLayer(featureOverlaySubbasin);
////                           map.addLayer(featureOverlayStream);
//                        },
//                        error: function (XMLHttpRequest, textStatus, errorThrown) {
//                            console.log(Error);
//                        }
//                    }).done(function(value) {
//
//                    });
//                }
//            }
//
//        });
//
//        map.on('pointermove', function(evt) {
//            if (evt.dragging) {
//                return;
//            }
//            var pixel = map.getEventPixel(evt.originalEvent);
//            var hit = map.forEachLayerAtPixel(pixel, function(layer) {
//                if (layer != layers[0]&& layer != layers[1]){
//                    current_layer = layer;
//                    return true;}
//            });
//            map.getTargetElement().style.cursor = hit ? 'pointer' : '';
//        });


//                           var streamVectorSource = new ol.source.Vector({
//                                format: new ol.format.GeoJSON(),
//                                url: 'http://localhost:8080/geoserver/wms/ows?service=wfs&version=2.0.0&request=getfeature&typename=swat_mekong:reach&CQL_FILTER=Subbasin='+streamID+'&outputFormat=application/json&srsname=EPSG:4326&,EPSG:4326',
//                                strategy: ol.loadingstrategy.bbox
//                           });
//
//                           featureOverlayStream = new ol.layer.Vector({
//                                source: streamVectorSource,
//                                style: new ol.style.Style({
//                                    stroke: new ol.style.Stroke({
//                                        color: '#1500ff',
//                                        width: 4
//                                    })
//                                }),
//                                title: 'stream_overlay'
//                           });


//    add_streams = function(){
//    var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>swat_mekong:reach</Name><UserStyle><FeatureTypeStyle><Rule>\
//        <Name>rule1</Name>\
//        <Title>Blue Line</Title>\
//        <Abstract>A solid blue line with a 2 pixel width</Abstract>\
//        <LineSymbolizer>\
//            <Stroke>\
//                <CssParameter name="stroke">#418ff4</CssParameter>\
//                <CssParameter name="stroke-width">2</CssParameter>\
//            </Stroke>\
//        </LineSymbolizer>\
//        </Rule>\
//        </FeatureTypeStyle>\
//        </UserStyle>\
//        </NamedLayer>\
//        </StyledLayerDescriptor>';
//
//
//
//    wms_source = new ol.source.ImageWMS({
//        url: 'http://localhost:8080/geoserver/wms',
//        params: {'LAYERS':'swat_mekong:reach','SLD_BODY':sld_string},
//        serverType: 'geoserver',
//        crossOrigin: 'Anonymous'
//    });
//
//    streams_layer = new ol.layer.Image({
//        source: wms_source,
//        title: 'streams'
//    });