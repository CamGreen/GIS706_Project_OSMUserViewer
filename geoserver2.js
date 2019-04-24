import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import {bbox as bboxStrategy} from 'ol/loadingstrategy.js';
import BingMaps from 'ol/source/BingMaps.js';
import Point from 'ol/geom/Point.js';
import VectorSource from 'ol/source/Vector.js';
import {Fill, RegularShape, Stroke, Style} from 'ol/style.js';
import OSM from 'ol/source.js';
import {defaults as defaultControls, ScaleLine} from 'ol/control.js';
import Overlay from 'ol/overlay.js';
import {Draw, Modify, Select, Snap} from 'ol/interaction.js';
import {WFS, GML} from 'ol/format.js';
import {Vector} from 'ol/source.js';
import {Condition} from 'ol/events.js';
import {click, pointerMove, altKeyOnly, doubleClick} from 'ol/events/condition.js';
import Feature from 'ol/Feature.js';

import 'ol/ol.css';

import 'ol-layerswitcher/src/ol-layerswitcher.css';
import LayerSwitcher from 'ol-layerswitcher/src/ol-layerswitcher.js';

import * as $ from 'jquery'


var baseurl = 'http://www.camerongreen.me:8081/geoserver/cameron_gis706app/ows?service=WFS&version=1.0.0&request=GetFeature';
var osm_points = baseurl + '&typeName=cameron_gis706app%3Aselect_point&outputFormat=application/json';
var osm_lines = baseurl + '&typeName=cameron_gis706app%3Aselect_lines&outputFormat=application/json';
var osm_polygons = baseurl + '&typeName=cameron_gis706app%3Aselect_polygon&outputFormat=application/json';

//Styling for point layer
var stroke = new Stroke({color: 'black', width: 0.5});
//var fill = new Fill({color: '#1f92e0'});
var fill = new Fill({color: 'rgba(253,192,134, 0.63)'});

//styling for polygon layer
var strokepoly = new Stroke({color: 'white', width: 0.5});
var fillpoly = new Fill({color: 'rgba(127,201,127, 0.5)'});

//styling for lines layer
var stroke_line =  new Fill({color: 'rgba(127,201,127, 0.63)'});
var fill_line =  new Fill({color: 'rgba(127,201,127, 0.63)'});


var selected_stroke = new Stroke({color: 'blue', width: 2});
var selected_fill = new Fill({color: 'green'});

var scaleLineControl = new ScaleLine();

var point_style = new Style({
    image: new RegularShape({
        fill: fill,
        stroke: stroke,
        points: 8,
        radius: 6,
        angle: Math.PI / 4
    })
});

var point_style_selected = new Style({
    image: new RegularShape({
        fill: selected_fill,
        stroke: selected_stroke,
        points: 3,
        radius: 10,
        rotation: Math.PI / 4,
        angle: 0
    })
});


var line_style = new Style({
    stroke: new Stroke({
        color: 'black',
        width: 1.5,
    })
});



var line_style_selected = new Style({
    stroke: new Stroke({
        color: '#00FF00',
        width: 4
    })
});

var polygon_style = new Style({
    stroke: strokepoly,
    fill: fillpoly
});

var polygon_style_selected = new Style({
  fill: selected_fill,
  stroke: selected_stroke
});

//Create a layer for the points
var points = new VectorLayer({
    id: 'points',
    title: 'OSM points',
    source: new VectorSource({
        format: new GeoJSON(),
        url: function(extent) {
            return osm_points + '&bbox=' + extent.join(',') + ',EPSG:3857';
        },
        strategy: bboxStrategy
    }),
    style: point_style
});

//Create a layer for the lines
var lines = new VectorLayer({
    title: 'OSM Lines',
    source: new VectorSource({
        format: new GeoJSON(),
        url: function(extent) {
            return osm_lines + '&bbox=' + extent.join(',') + ',EPSG:3857';
        },
        strategy: bboxStrategy
    }),
    style: line_style
});

//Create a layer for the lines
var polygons = new VectorLayer({
    title: 'OSM Polygons',
    source: new VectorSource({
        format: new GeoJSON(),
        url: function(extent) {
            return osm_polygons + '&bbox=' + extent.join(',') + ',EPSG:3857';
        },
        strategy: bboxStrategy
    }),
    style: polygon_style
});

var bing = new TileLayer({
    title: 'BingMaps Imagery',
    type: 'base',
    source: new BingMaps({
        imagerySet: 'Aerial',
        key: 'Ar62b-Q-Li-mKejP55VH3swF0OIBgOAXCA-WUOzaZS44krpPSBggEqXF3s-WrXPQ'
    })
});

//WFS-T code start
var formatWFS = new WFS();

var formatGML = new GML({
    featureNS: 'cameron_gis706app',
    featureType: 'select_point',
    srsName: 'EPSG:3857',
    geometryName: 'geometry'
});

var xs = new XMLSerializer();

var sourceWFS = new Vector({
    loader: function (extent) {
        $.ajax('http://www.camerongreen.me:8081/geoserver/cameron_gis706app/ows', {
            type: 'GET',
            data: {
                service: 'WFS',
                version: '1.0.0',
                request: 'GetFeature',
                typename: 'cameron_gis706app%3Aselect_point',
                srsname: 'EPSG:3857',
                bbox: extent.join(',') + ',EPSG:3857'
            }
        }).done(function (response) {
            sourceWFS.addFeatures(formatWFS.readFeatures(response));
        });
    },
    //strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ()),
    strategy: bboxStrategy,
    projection: 'EPSG:3857'
});

var layerWFS = new VectorLayer({
    source: sourceWFS
});

var interaction;

var interactionSelectPointerMove = new Select({
    condition: pointerMove
});

var interactionSelect = new Select({
    style: new Style({
        stroke: new Stroke({
            color: '#FF2828'
        })
    })
});

var interactionSnap = new Snap({
    source: layerWFS.getSource()
});
//WFS-T end

var map = new Map({
    controls: defaultControls().extend([
        scaleLineControl
    ]),
    interactions: [
       interactionSelectPointerMove
    ],
    layers: [bing, polygons, lines, points, layerWFS],
    target: document.getElementById('map'),
    view: new View({
      center: [2465336.18146, -4053437.02465],
      maxZoom: 19,
      minZoom: 11,
      zoom: 14
    })
});

var layerSwitcher = new LayerSwitcher({
        tipLabel: 'Legend' // Optional label for button
});
map.addControl(layerSwitcher);

//Selects a point when you click on it and changes the stylesheet
/*var selectInteraction = new Select({
    layers: function (layer) {
        return layer.get('id') == 'points';
    },
    style: [point_style_selected]
});

map.getInteractions().extend([selectInteraction]);*/

//Declaire the popup
const overlay = new Overlay({
    element: document.getElementById('popup-container'),
    positioning: 'bottom-center',
    offset: [0, -10],
    autoPan: true
});

map.addOverlay(overlay);

overlay.getElement().addEventListener('click', function() {
    overlay.setPosition();
});

//clicking problem starts here somewhere
map.on('dblclick', function(evt) {
    let markup = '';

    map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
        markup += `${markup && '<hr>'}<table>`;
        const properties = feature.getProperties();
        for (const property in properties) {
            if (properties[property] != null) {
              markup += `<tr><th>${property}</th><td>${properties[property]}</td></tr>`;
            }
        }
        markup += '</table>';
    }, {hitTolerance: 1});
    if (markup) {
        document.getElementById('popup-content').innerHTML = markup;
        overlay.setPosition(evt.coordinate);
    } else {
        overlay.setPosition();
    }
 });
//maybe ends somewhere here??

var userSearch = document.getElementById('userSearch');
userSearch.addEventListener('submit', function(e)
{
    var flag = document.getElementById('user_osmtype').value;
    

    if (flag == "osm_point") {
      var input = document.getElementById('osmusername').value;
      //alert(osm_points + '&cql_Filter=osm_user%20EQ%20%27' + input + '%27');

      var user_points = new VectorLayer({
          id: 'user_points',
          title: 'User points',
          source: new VectorSource({
              format: new GeoJSON(),
              url: function(extent) {
                  return osm_points + '&cql_Filter=osm_user%20EQ%20%27' + input + '%27';
              },
              strategy: bboxStrategy
          }),
          style: point_style_selected
      });

      map.addLayer(user_points);

      e.preventDefault();
    }

    //username line search
    else if (flag == "osm_line") {
        var input = document.getElementById('osmusername').value;
        //alert(osm_lines + '&cql_Filter=osm_user%20EQ%20%27' + input + '%27');

        var user_lines = new VectorLayer({
            id: 'user_lines',
            title: 'User Lines',
            source: new VectorSource({
                format: new GeoJSON(),
                url: function(extent) {
                    return osm_lines + '&cql_Filter=osm_user%20EQ%20%27' + input + '%27';
                },
                strategy: bboxStrategy
            }),
            style: line_style_selected
        });

        map.addLayer(user_lines);

        e.preventDefault();
    }

    //username polygon search
    else if (flag == "osm_polygon") {
        var input = document.getElementById('osmusername').value;
        //alert(osm_polygon + '&cql_Filter=osm_user%20EQ%20%27' + input + '%27');

        var user_polygons = new VectorLayer({
            id: 'user_polygons',
            title: 'User Polygons',
            source: new VectorSource({
                format: new GeoJSON(),
                url: function(extent) {
                    return osm_polygons + '&cql_Filter=osm_user%20EQ%20%27' + input + '%27';
                },
                strategy: bboxStrategy
            }),
            style: polygon_style_selected
        });

        map.addLayer(user_polygons);
        /*const properties = user_polygons.getProperties().length;
        alert(properties);
        for (const property in properties) {
            if (properties[property] == null)
              alert(properties[property]);
        }*/

        e.preventDefault();
    }

});

var userSearch = document.getElementById('userSearch');
userSearch.addEventListener('reset', function(e)
{
    var layersToRemove = [];
    map.getLayers().forEach(function (layer) {
        if (layer.get('id') === 'user_polygons') {
            layersToRemove.push(layer);
        } else if (layer.get('id') === 'user_lines') {
            layersToRemove.push(layer);
        } else if (layer.get('id') === 'user_points') {
            layersToRemove.push(layer);
        }
    });
 
    var len = layersToRemove.length;
    for(var i = 0; i < len; i++) {
        map.removeLayer(layersToRemove[i]);
    }
    e.preventDefault();
});

//date search
//date point
var dateSearch = document.getElementById('dateSearch');
dateSearch.addEventListener('submit', function(e)
{
  var flag = document.getElementById('time_osmtype').value;
  var date = document.getElementById('dday').value;
  var version = document.getElementById('version').value;
  var flag_multi = document.getElementById('multiquery').value;

  var cql_query = "";

  //alert(date);
  //alert(version);

  if (flag == "osm_point") {
    //alert(osm_points + '&cql_Filter=time%20EQ%20%27' + startDate + endDate + '%27');
      if (version == "" && date == "") {
          alert("Please complete either date or version");
      }
      else if (flag_multi == "multi_none" && version == ""){
          cql_query = osm_points + '&cql_Filter=time%20LIKE%20%27' + date + 'T%25%27';
      } else if (flag_multi == "multi_none" && date == "") {
          cql_query = osm_points + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27';
      } else if (flag_multi == "multi_and") {
          cql_query = osm_points + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27%20AND%20time%20LIKE%20%27' + date + 'T%25%27';
      } else if (flag_multi == "multi_or") {
          cql_query = osm_points + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27%20OR%20time%20LIKE%20%27' + date + 'T%25%27';
      }

      var date_points = new VectorLayer({
          id: 'date_points',
          title: 'Date points',
          source: new VectorSource({
              format: new GeoJSON(),
              url: function(extent) {
                  return cql_query;
              },
              strategy: bboxStrategy
          }),
          style: point_style_selected
      });

      map.addLayer(date_points);

      e.preventDefault();
}
    //date line
    else if (flag == "osm_line"){
    //alert(osm_lines + '&cql_Filter=time%20EQ%20%27' + startDate + endDate + '%27');

          if (version == "" && date == "") {
              alert("Please complete either date or version");
          }
          else if (flag_multi == "multi_none" && version == ""){
              cql_query = osm_lines + '&cql_Filter=time%20LIKE%20%27' + date + 'T%25%27';
          } else if (flag_multi == "multi_none" && date == "") {
              cql_query = osm_lines + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27';
          } else if (flag_multi == "multi_and") {
              cql_query = osm_lines + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27%20AND%20time%20LIKE%20%27' + date + 'T%25%27';
          } else if (flag_multi == "multi_or") {
              cql_query = osm_lines + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27%20OR%20time%20LIKE%20%27' + date + 'T%25%27';
          }

          var date_lines = new VectorLayer({
              id: 'date_lines',
              title: 'Date lines',
              source: new VectorSource({
                  format: new GeoJSON(),
                  url: function(extent) {
                      return cql_query;
                  },
                  strategy: bboxStrategy
              }),
              style: line_style_selected
          });

          map.addLayer(date_lines);

          //alert(cql_query);

          e.preventDefault();

    }

    //date polygon
    else if (flag == "osm_polygon"){
    //alert(osm_polygon + '&cql_Filter=time%20EQ%20%27' + startDate + endDate + '%27');

        if (version == "" && date == "") {
            alert("Please complete either date or version");
        }
        else if (flag_multi == "multi_none" && version == ""){
            cql_query = osm_polygons + '&cql_Filter=time%20LIKE%20%27' + date + 'T%25%27';
        } else if (flag_multi == "multi_none" && date == "") {
            cql_query = osm_polygons + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27';
        } else if (flag_multi == "multi_and") {
            cql_query = osm_polygons + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27%20AND%20time%20LIKE%20%27' + date + 'T%25%27';
        } else if (flag_multi == "multi_or") {
            cql_query = osm_polygons + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27%20OR%20time%20LIKE%20%27' + date + 'T%25%27';
        }

        var date_polygons = new VectorLayer({
            id: 'date_polygons',
            title: 'Date polygons',
            source: new VectorSource({
                format: new GeoJSON(),
                url: function(extent) {
                    return cql_query;
                },
                strategy: bboxStrategy
            }),
            style: polygon_style_selected
        });

        map.addLayer(date_polygons);

        e.preventDefault();
  }
});

var dateSearch = document.getElementById('dateSearch');
dateSearch.addEventListener('reset', function(e)
{
    var layersToRemove = [];
    map.getLayers().forEach(function (layer) {
        if (layer.get('id') === 'date_polygons') {
            layersToRemove.push(layer);
        } else if (layer.get('id') === 'date_lines') {
            layersToRemove.push(layer);
        } else if (layer.get('id') === 'date_points') {
            layersToRemove.push(layer);
        }
    });
 
    var len = layersToRemove.length;
    for(var i = 0; i < len; i++) {
        map.removeLayer(layersToRemove[i]);
    }
    e.preventDefault();
});


//version search
//version point
/*var versionSearch = document.getElementById('versionSearch');
versionSearch.addEventListener('submit', function(e)
{
  var flag = document.getElementById('version_osmtype').value;
  var version = document.getElementById('version').value;

  if (flag == "osm_point") {
    //alert(osm_points + '&cql_Filter=time%20EQ%20%27' + startDate + endDate + '%27');

    var version_points = new VectorLayer({
        id: 'version_points',
        title: 'Version points',
        source: new VectorSource({
            format: new GeoJSON(),
            url: function(extent) {
                return osm_points + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27';
            },
            strategy: bboxStrategy
        }),
        style: point_style_selected
    });

    map.addLayer(version_points);

    e.preventDefault();
}
    //version line
    else if (flag == "osm_line"){
    //alert(osm_lines + '&cql_Filter=time%20EQ%20%27' + startDate + endDate + '%27');

    var version_lines = new VectorLayer({
        id: 'version_lines',
        title: 'Version lines',
        source: new VectorSource({
            format: new GeoJSON(),
            url: function(extent) {
                return osm_lines + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27';
            },
            strategy: bboxStrategy
        }),
        style: line_style_selected
    });

    map.addLayer(version_lines);

    e.preventDefault();
    }

    //version polygon
    else if (flag == "osm_polygon"){
    //alert(osm_polygon + '&cql_Filter=time%20EQ%20%27' + startDate + endDate + '%27');

    var version_polygons = new VectorLayer({
        id: 'version_polygons',
        title: 'Version polygons',
        source: new VectorSource({
            format: new GeoJSON(),
            url: function(extent) {
                return osm_polygons + '&cql_Filter=osm_version%20EQ%20%27' + version + '%27';
            },
            strategy: bboxStrategy
        }),
        style: polygon_style_selected
    });

    map.addLayer(version_polygons);

    e.preventDefault();
  }
});*/


//WFS-T start
var dirty = {};
var transactWFS = function (mode, f) {
    var node;
    //alert("hello function");
    switch (mode) {
        case 'insert':
            node = formatWFS.writeTransaction([f], null, null, formatGML);
            break;
        case 'update':
            //alert("hello victoria");
            node = formatWFS.writeTransaction(null, [f], null, formatGML);
            break;
        case 'delete':
            node = formatWFS.writeTransaction(null, null, [f], formatGML);
            break;
    }
    var payload = xs.serializeToString(node);
    //alert(payload);
    $.ajax('http://www.camerongreen.me:8081/geoserver/cameron_gis706app/ows', {
        type: 'POST',
        dataType: 'xml',
        processData: false,
        contentType: 'text/xml',
        data: payload
    }).done(function() {
        sourceWFS.clear();
    });
}

//click event 
var btnEdit = document.getElementById('btnEdit');
var btnEdit_flag = false;
btnEdit.addEventListener('click', function(e)
{
    if (btnEdit_flag == false)
    {
        //alert("hello cameron");
        document.getElementById('btnEdit').style.color = '#0d47a1';
        btnEdit_flag = true;
        map.removeInteraction(interaction);
        interactionSelect.getFeatures().clear();
        map.removeInteraction(interactionSelect);

        map.addInteraction(interactionSelect);
        interaction = new Modify({
            features: interactionSelect.getFeatures()
        });
        map.addInteraction(interaction);
        map.addInteraction(interactionSnap);
        dirty = {};
        interactionSelect.getFeatures().on('add', function (e) {
            e.element.on('change', function (e) {
                dirty[e.target.getId()] = true;
            });
        });
        interactionSelect.getFeatures().on('remove', function (e) {
            var f = e.element;
            if (dirty[f.getId()]) {
                delete dirty[f.getId()];
                var featureProperties = f.getProperties();
                //alert(featureProperties);
                delete featureProperties.boundedBy;
                var clone = new Feature(featureProperties);
                clone.setId(f.getId());
                transactWFS('update', clone);
            }
        });
    }
    else if (btnEdit_flag == true)
    {
        document.getElementById('btnEdit').style.color = '#FFFFFF';
        btnEdit_flag = false;
    }
});
//WFS-T end
