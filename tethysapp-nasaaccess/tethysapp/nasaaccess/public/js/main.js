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
        download,
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
    }

    init_map = function() {
        var projection = ol.proj.get('EPSG:4326');
        var baseLayer = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
                imagerySet: 'AerialWithLabels', // Options 'Aerial', 'AerialWithLabels', 'Road',
            }),
            title: 'baselayer'
        });

//        featureOverlayStream = new ol.layer.Vector({
//            source: new ol.source.Vector(),
//            title: 'stream_overlay'
//        });

        featureOverlaySubbasin = new ol.layer.Vector({
            source: new ol.source.Vector(),
            title: 'subbasin_overlay',
            opacity: .5,
        });

        var view = new ol.View({
            center: [104.5, 17.5],
            projection: projection,
            zoom: 6.8
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

    geojson_list = []

    init_events = function(){
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


        map.on("singleclick",function(evt){


            if (map.getTargetElement().style.cursor == "pointer") {

                var clickCoord = evt.coordinate;
                var view = map.getView();
                var viewResolution = view.getResolution();

                var wms_url = current_layer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), {'INFO_FORMAT': 'application/json'}); //Get the wms url for the clicked point
                if (wms_url) {
                    //Retrieving the details for clicked point via the url
                    $.ajax({
                        type: "GET",
                        url: wms_url,
                        dataType: 'json',
                        success: function (result) {
                           geojson_list.push(result)
                           console.log(geojson_list)
                           var streamID = parseFloat(result["features"][0]["properties"]["Subbasin"]);

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

                           var subbasinVectorSource = new ol.source.Vector({
                                format: new ol.format.GeoJSON(),
                                url: 'http://localhost:8080/geoserver/wms/ows?service=wfs&version=2.0.0&request=getfeature&typename=swat_mekong:subbasin&CQL_FILTER=Subbasin='+streamID+'&outputFormat=application/json&srsname=EPSG:4326&,EPSG:4326',
                                strategy: ol.loadingstrategy.bbox
                           });


                           var color = '#0dd8c0';
                           color = ol.color.asArray(color);
                           color = color.slice();
                           color[3] = 0.5;
                           featureOverlaySubbasin = new ol.layer.Vector({
                                source: subbasinVectorSource,
                                style: new ol.style.Style({
                                    stroke: new ol.style.Stroke({
                                        color: '#000000',
                                        width: 1
                                    }),
                                    fill: new ol.style.Fill({
                                        color: color
                                    })
                                }),
                                title: 'subbasin_overlay'
                           });

                           map.addLayer(featureOverlaySubbasin);
//                           map.addLayer(featureOverlayStream);
                        },
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            console.log(Error);
                        }
                    }).done(function(value) {

                    });
                }
            }

        });

        map.on('pointermove', function(evt) {
            if (evt.dragging) {
                return;
            }
            var pixel = map.getEventPixel(evt.originalEvent);
            var hit = map.forEachLayerAtPixel(pixel, function(layer) {
                if (layer != layers[0]&& layer != layers[1]){
                    current_layer = layer;
                    return true;}
            });
            map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });

    };


    add_streams = function(){
    var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>swat_mekong:reach</Name><UserStyle><FeatureTypeStyle><Rule>\
        <Name>rule1</Name>\
        <Title>Blue Line</Title>\
        <Abstract>A solid blue line with a 2 pixel width</Abstract>\
        <LineSymbolizer>\
            <Stroke>\
                <CssParameter name="stroke">#418ff4</CssParameter>\
                <CssParameter name="stroke-width">2</CssParameter>\
            </Stroke>\
        </LineSymbolizer>\
        </Rule>\
        </FeatureTypeStyle>\
        </UserStyle>\
        </NamedLayer>\
        </StyledLayerDescriptor>';



    wms_source = new ol.source.ImageWMS({
        url: 'http://localhost:8080/geoserver/wms',
        params: {'LAYERS':'swat_mekong:reach','SLD_BODY':sld_string},
        serverType: 'geoserver',
        crossOrigin: 'Anonymous'
    });

    streams_layer = new ol.layer.Image({
        source: wms_source,
        title: 'streams'
    });


    map.addLayer(streams_layer);

    };

    add_basins = function(){
        var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>swat_mekong:subbasin</Name><UserStyle><FeatureTypeStyle><Rule>\
            <PolygonSymbolizer>\
            <Name>rule1</Name>\
            <Title>Watersheds</Title>\
            <Abstract></Abstract>\
            <Fill>\
              <CssParameter name="fill">#a9c5ce</CssParameter>\
              <CssParameter name="fill-opacity">.5</CssParameter>\
            </Fill>\
            <Stroke>\
              <CssParameter name="stroke">#2d2c2c</CssParameter>\
              <CssParameter name="stroke-width">.5</CssParameter>\
            </Stroke>\
            </PolygonSymbolizer>\
            </Rule>\
            </FeatureTypeStyle>\
            </UserStyle>\
            </NamedLayer>\
            </StyledLayerDescriptor>';

        wms_source = new ol.source.ImageWMS({
            url: 'http://localhost:8080/geoserver/wms',
            params: {'LAYERS':'swat_mekong:subbasin','SLD_BODY':sld_string},
            serverType: 'geoserver',
            crossOrigin: 'Anonymous'
        });

        basin_layer = new ol.layer.Image({
            source: wms_source,
            title: 'subbasins'
        });


        map.addLayer(basin_layer);

    };

    init_all = function(){
        init_map();
        add_basins();
        add_streams();
        init_events();
    };

    download = function() {
        var start = $('#start_pick').val();
        console.log(start)
        var end = $('#end_pick').val();
        console.log(end)
        var models = [];
        $('.chk:checked').each(function() {
             models.push( $( this ).val());
        });
        console.log(models)

        $.ajax({
            type: 'POST',
            url: "/apps/nasaaccess/download/",
            data: {
                'startDate': start,
                'endDate': end,
                'models': models,
            },
        }).done(function() {

        });
    }

    clear_selection = function() {
        var layers = map.getLayers();
        console.log(layers)
        var length = layers.getLength(), l;
        console.log(length)
        for (var i = 0; i < length; i++) {
            l = layers.item(i);
            var lt = l.get('title');
            console.log(lt)
            if (lt === 'subbasin_overlay') {
                map.removeLayer(l);
            }
        }
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

        $('#download_file').click(function() {
            download();
        });

        $('#clear_btn').click(function() {
            clear_selection();
        });

    });




    return public_interface;


}());// End of package wrapper