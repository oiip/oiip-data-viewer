/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Ol_Has from "ol/has";
import Ol_Interaction_Draw from "ol/interaction/draw";
import Ol_Layer_Vector from "ol/layer/vector";
import Ol_Layer_Group from "ol/layer/group";
import Ol_Layer_Image from "ol/layer/image";
import Ol_Layer_VectorTile from "ol/layer/vectortile";
import Ol_Source_Vector from "ol/source/vector";
import Ol_Source_VectorTile from "ol/source/vectortile";
import Ol_Source_ImageCanvas from "ol/source/imagecanvas";
import Ol_Format_KML from "ol/format/kml";
import Ol_Format_MVT from "ol/format/mvt";
import Ol_Style from "ol/style/style";
import Ol_Style_Stroke from "ol/style/stroke";
import Ol_Style_Fill from "ol/style/fill";
import Ol_Style_RegularShape from "ol/style/regularshape";
import Ol_Collection from "ol/collection";
import Ol_Observable from "ol/observable";
import Ol_Style_Circle from "ol/style/circle";
import Ol_Feature from "ol/feature";
import Ol_Geom_Polygon from "ol/geom/polygon";
import Ol_FeatureLoader from "ol/featureloader";
import Ol_Format_GeoJSON from "ol/format/geojson";
import Ol_Geom_MultiLineString from "ol/geom/multilinestring";
import Ol_Geom_Point from "ol/geom/point";
import Ol_TileGrid from "ol/tilegrid/tilegrid";
import moment from "moment";
import MapWrapperOpenlayersCore from "_core/utils/MapWrapperOpenlayers";
import AnimationBuffer from "utils/AnimationBuffer";
import TileLoadingQueue from "utils/TileLoadingQueue";
import appConfig from "constants/appConfig";
import * as appStrings from "constants/appStrings";
import * as appStringsCore from "_core/constants/appStrings";
import MiscUtil from "utils/MiscUtil";
import MapUtil from "utils/MapUtil";

const kmlLayerExtents = JSON.parse(require("default-data/kmlExtents.json"));
const TILE_STATE_IDLE = 0; // loading states found in ol.tile.js
const TILE_STATE_LOADING = 1;
const TILE_STATE_LOADED = 2;
const TILE_STATE_ERROR = 3;
const TILE_STATE_EMPTY = 4;
const TILE_STATE_ABORT = 5;
const NO_LOAD_STATES = [TILE_STATE_LOADING, TILE_STATE_LOADED, TILE_STATE_ERROR, TILE_STATE_EMPTY];
const LOAD_COMPLETE_STATES = [TILE_STATE_LOADED, TILE_STATE_ERROR, TILE_STATE_EMPTY];
let _tilesLoading = 0;

export default class MapWrapperOpenlayers extends MapWrapperOpenlayersCore {
    initStaticClasses(container, options) {
        MapWrapperOpenlayersCore.prototype.initStaticClasses.call(this, container, options);
        this.miscUtil = MiscUtil;
        this.mapUtil = MapUtil;
    }

    initObjects(container, options) {
        MapWrapperOpenlayersCore.prototype.initObjects.call(this, container, options);
        this.animationBuffer = new AnimationBuffer(22);
        this.tileLoadingQueue = new TileLoadingQueue();
        this.layerLoadCallback = undefined;
        this.dateInterval = { scale: "day", size: 1 };
    }

    setMapDateInterval(interval) {
        if (typeof interval !== "undefined") {
            this.dateInterval = interval;
            return true;
        }
        return false;
    }

    setLayerLoadCallback(callback) {
        if (typeof callback === "function") {
            this.layerLoadCallback = callback;
        }
    }

    createMap(container, options) {
        let map = MapWrapperOpenlayersCore.prototype.createMap.call(this, container, options);

        if (map) {
            // create area display layer
            let areaDisplayNormalSource = new Ol_Source_Vector({ wrapX: true });
            let areaDisplayNormalLayer = new Ol_Layer_Vector({
                source: areaDisplayNormalSource,
                extent: appConfig.DEFAULT_MAP_EXTENT,
                style: this.areaDisplayNormalStyle
            });
            let areaDisplayLayer = new Ol_Layer_Group({
                extent: appConfig.DEFAULT_MAP_EXTENT,
                layers: [areaDisplayNormalLayer],
                visible: true
            });
            areaDisplayLayer.set("_layerId", "_area_display_layer");
            areaDisplayLayer.set("_layerType", appStringsCore.LAYER_GROUP_TYPE_REFERENCE);
            map.addLayer(areaDisplayLayer);

            // create point highlight layer
            let pointHighlightSource = new Ol_Source_Vector({ wrapX: true });
            let pointHighlightLayer = new Ol_Layer_Vector({
                source: pointHighlightSource,
                renderMode: "image",
                style: this.pointHighlightStyle
            });
            pointHighlightLayer.set("_layerId", "_point_highlight_layer");
            pointHighlightLayer.set("_layerType", appStringsCore.LAYER_GROUP_TYPE_REFERENCE);
            map.addLayer(pointHighlightLayer);

            map.on("precompose", function(evt) {
                evt.context.imageSmoothingEnabled = false;
                evt.context.webkitImageSmoothingEnabled = false;
                evt.context.mozImageSmoothingEnabled = false;
                evt.context.msImageSmoothingEnabled = false;
            });
        }
        return map;
    }

    configureStyles(container, options) {
        MapWrapperOpenlayersCore.prototype.configureStyles.call(this, container, options);
        let defaultDrawingStyleCore = this.defaultDrawingStyle;

        this.defaultDrawingStyle = (
            feature,
            resolution,
            measureType = appStringsCore.MEASURE_DISTANCE
        ) => {
            return defaultDrawingStyleCore(feature, resolution, measureType);
        };

        this.pointHighlightStyle = (feature, resolution) => {
            let color = feature.get("_color") || "#FF0000";
            if (feature.get("_isFirst")) {
                return [
                    new Ol_Style({
                        image: new Ol_Style_RegularShape({
                            fill: new Ol_Style_Fill({
                                color: "#fff"
                            }),
                            points: 3,
                            stroke: new Ol_Style_Stroke({
                                color: "#000"
                            }),
                            rotation: Math.PI,
                            radius: 13
                        }),
                        zIndex: 2
                    }),
                    new Ol_Style({
                        image: new Ol_Style_RegularShape({
                            fill: new Ol_Style_Fill({
                                color: color
                            }),
                            points: 3,
                            stroke: new Ol_Style_Stroke({
                                color: "#000"
                            }),
                            rotation: Math.PI,
                            radius: 8
                        }),
                        zIndex: 2
                    })
                ];
            } else if (feature.get("_isLast")) {
                return [
                    new Ol_Style({
                        image: new Ol_Style_RegularShape({
                            fill: new Ol_Style_Fill({
                                color: "#fff"
                            }),
                            points: 3,
                            stroke: new Ol_Style_Stroke({
                                color: "#000"
                            }),
                            radius: 13
                        }),
                        zIndex: 2
                    }),
                    new Ol_Style({
                        image: new Ol_Style_RegularShape({
                            fill: new Ol_Style_Fill({
                                color: color
                            }),
                            points: 3,
                            stroke: new Ol_Style_Stroke({
                                color: "#000"
                            }),
                            radius: 8
                        }),
                        zIndex: 2
                    })
                ];
            } else {
                return [
                    new Ol_Style({
                        stroke: new Ol_Style_Stroke({
                            color: "#000",
                            width: 9.75
                        }),
                        zIndex: 2
                    }),
                    new Ol_Style({
                        stroke: new Ol_Style_Stroke({
                            color: "#fff",
                            width: 8.5
                        }),
                        zIndex: 2
                    }),
                    new Ol_Style({
                        image: new Ol_Style_Circle({
                            fill: new Ol_Style_Fill({ color: "#fff" }),
                            stroke: new Ol_Style_Stroke({
                                color: "#000"
                            }),
                            radius: 7
                        }),
                        stroke: new Ol_Style_Stroke({
                            color: "#000",
                            width: 5.25
                        }),
                        zIndex: 2
                    }),
                    new Ol_Style({
                        image: new Ol_Style_Circle({
                            fill: new Ol_Style_Fill({
                                color: color
                            }),
                            stroke: new Ol_Style_Stroke({
                                color: "#000"
                            }),
                            radius: 4
                        }),
                        stroke: new Ol_Style_Stroke({
                            color: color,
                            width: 4
                        }),
                        zIndex: 2
                    })
                ];
            }
        };
    }

    setExtent(extent, padView = false) {
        try {
            if (extent) {
                let mapSize = this.map.getSize() || [];
                this.map.getView().fit(extent, {
                    size: mapSize,
                    constrainResolution: false,
                    padding: padView ? [70, 70, 70, 70] : undefined
                });
                return true;
            }
            return false;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.setExtent:", err);
            return false;
        }
    }

    deactivateLayer(layer) {
        let mapLayers = this.map.getLayers().getArray();
        let mapLayer = this.miscUtil.findObjectInArray(
            mapLayers,
            "_layerId",
            "_point_highlight_layer"
        );
        if (mapLayer) {
            let source = mapLayer.getSource();
            let layerId = layer.get("id");
            let currFeatureList = source.getFeatures();
            for (let i = 0; i < currFeatureList.length; ++i) {
                let feature = currFeatureList[i];
                if (feature.get("_layerId") === layerId) {
                    source.removeFeature(feature);
                }
            }
        }
        return MapWrapperOpenlayersCore.prototype.deactivateLayer.call(this, layer);
    }

    createLayer(layer, date, fromCache = true) {
        let mapLayer = false;

        // pull from cache if possible
        let cacheHash = this.getCacheHash(layer, date);
        if (fromCache && this.layerCache.get(cacheHash)) {
            let cachedLayer = this.layerCache.get(cacheHash);
            cachedLayer.setOpacity(layer.get("opacity"));
            cachedLayer.setVisible(layer.get("isActive"));

            // update the style
            if (layer.get("handleAs") === appStrings.LAYER_VECTOR_POINT_TRACK) {
                cachedLayer.setStyle(
                    this.createVectorPointTrackLayerStyles(layer.get("vectorColor"))
                );
            }

            if (cachedLayer.getSource().get("_hasLoaded")) {
                // run async to avoid reducer block
                window.requestAnimationFrame(() => {
                    // run the call back (if it exists)
                    if (typeof this.layerLoadCallback === "function") {
                        this.layerLoadCallback(layer);
                    }
                });
            }

            return cachedLayer;
        }

        // create a new layer
        switch (layer.get("handleAs")) {
            case appStrings.LAYER_VECTOR_TILE_TRACK:
                mapLayer = this.createVectorTileTrackLayer(layer, fromCache);
                break;
            case appStrings.LAYER_VECTOR_POINT_TRACK:
                mapLayer = this.createVectorPointTrackLayer(layer, fromCache);
                break;
            case appStrings.LAYER_VECTOR_TILE_TRACK_ERROR:
                mapLayer = this.createVectorTileTrackLayer(layer, fromCache);
                break;
            case appStrings.LAYER_MULTI_FILE_VECTOR_KML:
                mapLayer = this.createMultiFileKmlLayer(layer, fromCache);
                break;
            case appStrings.LAYER_VECTOR_TILE_OUTLINE:
                mapLayer = this.createVectorTileOutline(layer, fromCache);
                break;
            default:
                mapLayer = MapWrapperOpenlayersCore.prototype.createLayer.call(
                    this,
                    layer,
                    false // we don't want the parent class using the wrong cache key
                );
                break;
        }

        if (mapLayer) {
            mapLayer.set("_layerId", layer.get("id"));
            mapLayer.set("_layerType", layer.get("type"));
            mapLayer.set("_layerRef", layer);
            if (date) {
                mapLayer.set("_layerTime", moment.utc(date).format(layer.get("timeFormat")));
                mapLayer.set("_layerCacheHash", this.getCacheHash(layer, date));
            } else {
                mapLayer.set("_layerCacheHash", this.getCacheHash(layer));
                mapLayer.set(
                    "_layerTime",
                    moment.utc(this.mapDate).format(layer.get("timeFormat"))
                );
            }
        }

        return mapLayer;
    }

    createMultiFileKmlLayer(layer, fromCache = true) {
        try {
            // pull from cache if possible
            let cacheHash = this.getCacheHash(layer);
            if (fromCache && this.layerCache.get(cacheHash)) {
                let cachedLayer = this.layerCache.get(cacheHash);
                cachedLayer.setOpacity(layer.get("opacity"));
                cachedLayer.setVisible(layer.get("isActive"));
                return cachedLayer;
            }

            // create a layer grouping
            let mapLayer = new Ol_Layer_Group({
                opacity: layer.get("opacity"),
                visible: layer.get("isActive")
            });

            // source for dummy canvas layer
            let imageSource = new Ol_Source_ImageCanvas({
                canvasFunction: (extent, resolution, pixelRatio, size, projection) => {
                    return this.multiFileKmlCanvasFunction(
                        layer,
                        mapLayer,
                        extent,
                        resolution,
                        pixelRatio,
                        size,
                        projection
                    );
                },
                projection: this.map.getView().getProjection(),
                ratio: 1
            });
            imageSource.set("_dummyCanvas", true);

            // dummy canvas image layer to track map movements
            let imageLayer = new Ol_Layer_Image({
                source: imageSource
            });

            // add a canvas layer that will find intersecting KMLs on each map move
            mapLayer.setLayers(new Ol_Collection([imageLayer]));

            // return the layer group
            return mapLayer;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.createMultiFileKmlLayer:", err);
            return false;
        }
    }

    multiFileKmlCanvasFunction(layer, mapLayer, extent, resolution, pixelRatio, size, projection) {
        // manage extent wrapping
        let viewExtentsArr = [];
        let cExtentA = this.mapUtil.constrainCoordinates([extent[0], extent[1]]);
        let cExtentB = this.mapUtil.constrainCoordinates([extent[2], extent[3]]);
        let cExtent = [cExtentA[0], cExtentA[1], cExtentB[0], cExtentB[1]];
        let extentWidth = extent[2] - extent[0];
        if (extentWidth >= 360) {
            viewExtentsArr = [[-180, cExtent[1], 180, cExtent[3]]];
        } else {
            // check for extents  across the dateline
            if (cExtent[0] > cExtent[2]) {
                viewExtentsArr = [
                    [cExtent[0], cExtent[1], 180, cExtent[3]],
                    [-180, cExtent[1], cExtent[2], cExtent[3]]
                ];
            } else {
                viewExtentsArr = [cExtent];
            }
        }

        // create the canvas
        let canvas = document.createElement("canvas");
        let canvasWidth = size[0],
            canvasHeight = size[1];
        canvas.setAttribute("width", canvasWidth);
        canvas.setAttribute("height", canvasHeight);

        let layerTileExtentsList = this.getExtentsListForLayer(layer);
        if (layerTileExtentsList) {
            // find the zoom ids we want
            let zoom = Math.max(1, Math.round(this.getZoom()) - 1);
            let tileEntries = viewExtentsArr.reduce(
                (acc, extentEntry) => {
                    let entries = this.mapUtil.findTileExtentsInView(
                        layerTileExtentsList,
                        extentEntry,
                        zoom
                    );
                    acc.tiles = acc.tiles.concat(entries.tiles);
                    acc.foundZoom = entries.foundZoom;
                    return acc;
                },
                { tiles: [], foundZoom: 0 }
            );
            let tiles = tileEntries.tiles;
            let allTileCoords = tiles.map(tile => {
                return tile.tileCoord.join(",");
            });
            let foundZoom = tileEntries.foundZoom;

            // remove all vector layers currently in the layer group
            let prevLayers = {};
            let layerGroup = mapLayer.getLayers();
            while (layerGroup.getLength() > 1) {
                try {
                    let tmpLayer = layerGroup.pop();
                    prevLayers[tmpLayer.getSource().getUrl()] = tmpLayer;
                } catch (e) {
                    console.warn("Error in MapWrapperOpenlayers.multiFileKmlCanvasFunction: ", e);
                }
            }

            // extract date string to use
            let timeStr =
                typeof mapLayer.get("_layerTime") !== "undefined"
                    ? mapLayer.get("_layerTime")
                    : moment.utc(this.mapDate).format(layer.get("timeFormat"));

            // construct the vector layers in view
            let baseUrl = layer.get("url");
            for (let i = 0; i < tiles.length; ++i) {
                let tile = tiles[i];
                let tileCoord = tile.tileCoord;
                let tileExtent = tile.extent;

                // generate tile url
                let tileUrl = baseUrl
                    .split("{Z}")
                    .join(tileCoord[0])
                    .split("{X}")
                    .join(tileCoord[1])
                    .split("{Y}")
                    .join(tileCoord[2])
                    .split("{TIME}")
                    .join(timeStr);

                let _context = this;
                let tileLayer = prevLayers[tileUrl];
                if (typeof tileLayer === "undefined") {
                    // construct the vector layer for this tile
                    let tileFormat = new Ol_Format_KML();
                    let source = new Ol_Source_Vector({
                        url: tileUrl,
                        format: tileFormat,
                        loader: Ol_FeatureLoader.loadFeaturesXhr(
                            tileUrl,
                            tileFormat,
                            function(features, dataProjection) {
                                this.addFeatures(features);
                                this.set("_loadingState", TILE_STATE_LOADED);
                                mapLayer.dispatchEvent(appStrings.VECTOR_FEATURE_LOAD);
                            },
                            function(err) {
                                console.warn("Error in vector feature loader", err);
                                this.set("_loadingState", TILE_STATE_ERROR);
                                mapLayer.dispatchEvent(appStrings.VECTOR_FEATURE_LOAD);
                            }
                        )
                    });
                    source.on("addfeature", event => {
                        let feature = event.feature;
                        let geometry = feature.getGeometry();
                        if (geometry.getType() === "LineString") {
                            let coords = this.mapUtil.deconstrainLineStringArrow(
                                geometry.getCoordinates()
                            );
                            geometry.setCoordinates(coords);
                        }
                    });
                    source.set("_loadingState", TILE_STATE_IDLE);

                    tileLayer = new Ol_Layer_Vector({
                        opacity: 1,
                        visible: true,
                        renderMode: "image",
                        source: source
                    });
                }

                tileLayer.set("_tileCoord", tileCoord.join(","));
                layerGroup.push(tileLayer);
            }

            mapLayer.setLayers(layerGroup);
        }

        mapLayer.set("_lastExtentChecked", JSON.stringify(extent));

        return canvas;
    }

    getExtentsListForLayer(layer) {
        switch (layer.get("id")) {
            case appStrings.CURRENTS_VECTOR_COLOR:
                return kmlLayerExtents.CURRENTS_EXTENTS;
            case appStrings.CURRENTS_VECTOR_BLACK:
                return kmlLayerExtents.CURRENTS_EXTENTS;
            default:
                console.warn(
                    "Error in MapWrapperOpenlayers.getExtentsListForLayer: could not match layer id to extent list - ",
                    layer.get("id")
                );
                return false;
        }
    }

    addLayerToCache(mapLayer, updateStrategy = appStrings.TILE_LAYER_UPDATE_STRATEGIES.TILE) {
        try {
            if (
                mapLayer.get("_layerRef").get("handleAs") !== appStrings.LAYER_MULTI_FILE_VECTOR_KML
            ) {
                return MapWrapperOpenlayersCore.prototype.addLayerToCache.call(
                    this,
                    mapLayer,
                    updateStrategy
                );
            }
            return true;
        } catch (err) {
            console.warn("Error in MapWrapper_openlayer.addLayerToCache: ", err);
            return false;
        }
    }

    createVectorTileOutline(layer, fromCache = true) {
        try {
            let options = layer.get("wmtsOptions").toJS();

            let outlineLayer = new Ol_Layer_VectorTile({
                transition: 0,
                renderMode: "image",
                // overlaps: false,
                source: new Ol_Source_VectorTile({
                    format: new Ol_Format_MVT(),
                    projection: "EPSG:4326",
                    tileGrid: new Ol_TileGrid({
                        extent: options.extents,
                        origin: options.tileGrid.origin,
                        resolutions: options.tileGrid.resolutions,
                        matrixIds: options.tileGrid.matrixIds,
                        tileSize: options.tileGrid.tileSize
                    }),
                    url: layer.get("url")
                }),
                style: function(feature) {
                    return [
                        new Ol_Style({
                            stroke: new Ol_Style_Stroke({
                                color: "#212121",
                                width: 2.5
                            })
                        }),
                        new Ol_Style({
                            stroke: new Ol_Style_Stroke({
                                color: "#FFFFFF",
                                width: 0.75
                            })
                        })
                    ];
                }
            });

            return outlineLayer;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.createVectorTileOutline:", err);
            return false;
        }
    }

    createVectorPointTrackLayer(layer, fromCache = true) {
        try {
            let layerSource = this.createVectorPointTrackSource(
                layer,
                {
                    url: layer.get("url")
                },
                fromCache
            );

            return new Ol_Layer_Vector({
                source: layerSource,
                renderMode: "image",
                opacity: layer.get("opacity"),
                visible: layer.get("isActive"),
                style: this.createVectorPointTrackLayerStyles(layer.get("vectorColor"))
            });
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.createVectorPointTrackLayer:", err);
            return false;
        }
    }

    createVectorTileTrackLayer(layer, fromCache = true) {
        try {
            let options = layer.get("wmtsOptions").toJS();
            return new Ol_Layer_VectorTile({
                declutter: true,
                transition: 0,
                source: new Ol_Source_VectorTile({
                    format: new Ol_Format_MVT(),
                    projection: "EPSG:4326",
                    tileGrid: new Ol_TileGrid({
                        extent: options.extents,
                        origin: options.tileGrid.origin,
                        resolutions: options.tileGrid.resolutions,
                        matrixIds: options.tileGrid.matrixIds,
                        tileSize: options.tileGrid.tileSize
                    }),
                    url: layer.get("url")
                }),
                style: new Ol_Style({
                    stroke: new Ol_Style_Stroke({
                        color: "rgba(0,0,0,0.4)"
                    }),
                    fill: new Ol_Style_Fill({
                        color: "rgba(255,255,255,0.4)"
                    })
                })
            });
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.createVectorTileTrackLayer:", err);
            return false;
        }
    }

    createVectorPointTrackSource(layer, options, fromCache = true) {
        // try to pull from cache
        let cacheHash = this.getCacheHash(layer) + "_source";
        let cacheSource = this.layerCache.get(cacheHash);
        if (fromCache && cacheSource) {
            if (cacheSource.get("_hasLoaded")) {
                // highlight the points
                this.highlightTrackPoints(
                    cacheSource.getFeatures(),
                    layer.get("timeFormat"),
                    layer.get("vectorColor")
                );

                // run async to avoid reducer block
                window.requestAnimationFrame(() => {
                    // run the call back (if it exists)
                    if (typeof this.layerLoadCallback === "function") {
                        this.layerLoadCallback(layer);
                    }
                });
            }

            return cacheSource;
        }

        // customize the layer url if needed
        if (
            typeof options.url !== "undefined" &&
            typeof layer.getIn(["urlFunctions", appStrings.MAP_LIB_2D]) !== "undefined"
        ) {
            let urlFunction = this.tileHandler.getUrlFunction(
                layer.getIn(["urlFunctions", appStrings.MAP_LIB_2D])
            );
            options.url = urlFunction({
                layer: layer,
                url: options.url
            });
        }

        let geojsonFormat = new Ol_Format_GeoJSON();
        let _context = this;
        let source = new Ol_Source_Vector({
            url: options.url,
            loader: function(extent, resolution, projection) {
                MiscUtil.asyncFetch({
                    url: options.url,
                    handleAs: appStringsCore.FILE_TYPE_JSON
                }).then(
                    data => {
                        let linePoints = [];
                        let featuresToAdd = [];
                        let featureMap = {};

                        // we'll do this dumb but easy for now
                        // TODO - collapse this into a single pass

                        // combine repeat locations and build the points for the line
                        let features = data.features;
                        for (let i = 0; i < features.length; ++i) {
                            let feature = features[i];
                            let coords = feature.geometry.coordinates;

                            if (Math.abs(coords[0]) <= 180 && Math.abs(coords[1]) <= 90) {
                                if (i < features.length - 1) {
                                    let nextFeature = features[i + 1];
                                    let nextCoords = nextFeature.geometry.coordinates;

                                    if (
                                        Math.abs(nextCoords[0]) <= 180 &&
                                        Math.abs(nextCoords[1]) <= 90 &&
                                        (coords[0] !== nextCoords[0] || coords[1] !== nextCoords[1])
                                    ) {
                                        linePoints.push([coords, nextCoords]);
                                    }
                                }

                                let coordStr = coords.join(",");
                                let dateStr = new Date(feature.properties["position_date_time"]);
                                let combinedFeature = featureMap[coordStr];
                                if (typeof combinedFeature === "undefined") {
                                    combinedFeature = new Ol_Feature({
                                        geometry: new Ol_Geom_Point(coords)
                                    });
                                    combinedFeature.set("_layerId", layer.get("id"));
                                    combinedFeature.set("position_date_time", [dateStr]);
                                    featureMap[coordStr] = combinedFeature;
                                    featuresToAdd.push(combinedFeature);
                                } else {
                                    combinedFeature.get("position_date_time").push(dateStr);
                                }
                            }
                        }

                        // mark the start and end point
                        featuresToAdd[0].set("_isFirst", true);
                        featuresToAdd[featuresToAdd.length - 1].set("_isLast", true);

                        // create the connecting line
                        featuresToAdd.push(
                            new Ol_Feature({
                                geometry: new Ol_Geom_MultiLineString(linePoints)
                            })
                        );

                        // add features to the layer
                        if (featuresToAdd.length > 0) {
                            this.addFeatures(featuresToAdd);
                        }

                        // highlight track oints
                        _context.highlightTrackPoints(
                            featuresToAdd,
                            layer.get("timeFormat"),
                            layer.get("vectorColor")
                        );

                        source.set("_hasLoaded", true);

                        // console.log("Point Reduction", features.length, featuresToAdd.length);

                        // run the call back (if it exists)
                        if (typeof _context.layerLoadCallback === "function") {
                            _context.layerLoadCallback(layer);
                        }
                    },
                    err => {
                        console.warn("Error fetching vector data", err);
                    }
                );
            },
            format: geojsonFormat
        });

        // cache the source
        this.layerCache.set(cacheHash, source);

        return source;
    }

    createVectorPointTrackLayerStyles(color = false) {
        return (feature, resolution) => {
            if (feature.get("_isFirst")) {
                return new Ol_Style({
                    image: new Ol_Style_RegularShape({
                        fill: new Ol_Style_Fill({
                            color: color
                        }),
                        points: 3,
                        stroke: new Ol_Style_Stroke({
                            color: color === "#000000" || color === "#3e2723" ? "#fff" : "#000"
                        }),
                        rotation: Math.PI,
                        radius: 7
                    }),
                    zIndex: 2
                });
            } else if (feature.get("_isLast")) {
                return new Ol_Style({
                    image: new Ol_Style_RegularShape({
                        fill: new Ol_Style_Fill({
                            color: color
                        }),
                        points: 3,
                        stroke: new Ol_Style_Stroke({
                            color: color === "#000000" || color === "#3e2723" ? "#fff" : "#000"
                        }),
                        radius: 7
                    }),
                    zIndex: 2
                });
            } else if (resolution > 0.017578125) {
                return new Ol_Style({
                    fill: new Ol_Style_Fill({
                        color: color
                    }),
                    stroke: new Ol_Style_Stroke({
                        color: color,
                        width: 2
                    })
                });
            } else {
                return new Ol_Style({
                    fill: new Ol_Style_Fill({
                        color: color
                    }),
                    stroke: new Ol_Style_Stroke({
                        color: color,
                        width: 1
                    }),
                    image: new Ol_Style_Circle({
                        radius: 4,
                        fill: new Ol_Style_Fill({
                            color: color
                        })
                    })
                });
            }
        };
    }

    setVectorLayerColor(layer, color) {
        let mapLayers = this.map.getLayers().getArray();
        let mapLayer = this.miscUtil.findObjectInArray(mapLayers, "_layerId", layer.get("id"));
        if (!mapLayer) {
            console.warn(
                "Error in MapWrapperOpenLayers.setVectorLayerColor: Could not find corresponding map layer",
                layer
            );
            return false;
        }

        mapLayer.setStyle(this.createVectorPointTrackLayerStyles(color));
        this.updateLayer(layer, color);
        return true;
    }

    zoomToLayer(layer, extraPad = false) {
        try {
            let mapLayers = this.map.getLayers().getArray();
            let mapLayer = this.miscUtil.findObjectInArray(mapLayers, "_layerId", layer.get("id"));
            if (!mapLayer) {
                console.warn(
                    "Error in MapWrapperOpenLayers.zoomToLayer: Could not find corresponding map layer",
                    layer
                );
                return false;
            }

            let source = mapLayer.getSource();
            if (typeof source.getExtent === "function") {
                let extent = source.getExtent();
                let padding = [60, 60, 60, 60];
                if (extraPad) {
                    padding[1] = padding[1] + 600;
                }
                this.map.getView().fit(extent, {
                    size: this.map.getSize() || [],
                    padding: padding,
                    duration: 350,
                    constrainResolution: false
                });
            }

            return true;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.zoomToLayer: ", err);
            return false;
        }
    }

    getDataAtPoint(coords, pixel, palettes) {
        try {
            let data = []; // the collection of pixel data to return
            let coord = this.map.getCoordinateFromPixel(pixel);
            this.map.forEachLayerAtPixel(
                pixel,
                mapLayer => {
                    if (mapLayer) {
                        let feature = mapLayer
                            .getSource()
                            .getClosestFeatureToCoordinate(coord, feature => {
                                return feature.getGeometry() instanceof Ol_Geom_Point;
                            });
                        if (feature.getGeometry() instanceof Ol_Geom_Point) {
                            data.push({
                                layerId: mapLayer.get("_layerId"),
                                properties: feature.getProperties(),
                                coords: feature.getGeometry().getCoordinates()
                            });
                            return false;
                        }
                    }
                },
                undefined,
                mapLayer => {
                    return (
                        mapLayer.getVisible() &&
                        mapLayer.get("_layerType") === appStrings.LAYER_GROUP_TYPE_INSITU_DATA
                    );
                }
            );

            this.map.forEachFeatureAtPixel(
                pixel,
                (feature, mapLayer) => {
                    data.push({
                        layerId: mapLayer.get("_layerId"),
                        properties: feature.getProperties(),
                        coords: coord
                    });
                },
                {
                    layerFilter: mapLayer => {
                        return (
                            mapLayer.getVisible() &&
                            mapLayer.get("_layerType") ===
                                appStrings.LAYER_GROUP_TYPE_DATA_REFERENCE
                        );
                    }
                }
            );

            return data;

            // return data;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.getDataAtPoint:", err);
            return [];
        }
    }

    getLatLonFromPixelCoordinate(pixel, constrainCoords = true) {
        try {
            let coordinate = this.map.getCoordinateFromPixel(pixel);
            coordinate = constrainCoords
                ? this.mapUtil.constrainCoordinates(coordinate)
                : coordinate;
            if (
                typeof coordinate[0] !== "undefined" &&
                typeof coordinate[1] !== "undefined" &&
                !isNaN(coordinate[0]) &&
                !isNaN(coordinate[0])
            ) {
                return {
                    lat: coordinate[0],
                    lon: coordinate[1],
                    isValid: coordinate[1] <= 90 && coordinate[1] >= -90
                };
            }
            return false;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.getLatLonFromPixelCoordinate:", err);
            return false;
        }
    }

    addDrawHandler(geometryType, onDrawEnd, interactionType) {
        if (interactionType === appStrings.INTERACTION_AREA_SELECTION) {
            try {
                if (geometryType === appStrings.GEOMETRY_BOX) {
                    let mapLayers = this.map.getLayers().getArray();
                    let mapLayer = this.miscUtil.findObjectInArray(
                        mapLayers,
                        "_layerId",
                        "_vector_drawings"
                    );
                    if (mapLayer) {
                        let shapeType = appStringsCore.SHAPE_AREA;
                        let drawStyle = (feature, resolution) => {
                            return this.defaultDrawingStyle(feature, resolution, shapeType);
                        };

                        let drawInteraction = new Ol_Interaction_Draw({
                            source: mapLayer.getSource(),
                            type: "Circle",
                            geometryFunction: Ol_Interaction_Draw.createBox(),
                            style: drawStyle,
                            wrapX: true
                        });
                        // let drawInteraction = new Ol_Interaction_Extent({
                        //     // source: mapLayer.getSource(),
                        //     boxStyle: [
                        //         new Ol_Style({
                        //             stroke: new Ol_Style_Stroke({
                        //                 lineDash: [15, 10],
                        //                 color: appConfig.GEOMETRY_OUTLINE_COLOR,
                        //                 width: appConfig.GEOMETRY_STROKE_WEIGHT + 1
                        //             })
                        //         }),
                        //         new Ol_Style({
                        //             stroke: new Ol_Style_Stroke({
                        //                 lineDash: [15, 10],
                        //                 color: appConfig.GEOMETRY_STROKE_COLOR,
                        //                 width: appConfig.GEOMETRY_STROKE_WEIGHT
                        //             })
                        //         })
                        //     ],
                        //     wrapX: true
                        // });

                        // Set callback
                        drawInteraction.on("drawend", event => {
                            if (typeof onDrawEnd === "function") {
                                // store type of feature and id for later reference
                                let geometry = this.retrieveGeometryFromEvent(event, geometryType);
                                event.feature.set("interactionType", interactionType);
                                event.feature.setId(geometry.id);
                                onDrawEnd(geometry, event);
                            }
                        });

                        // drawInteraction.on("extentchanged", event => {
                        //     if (typeof onDrawEnd === "function" && event.extent) {
                        //         // store type of feature and id for later reference
                        //         // let geometry = this.retrieveGeometryFromEvent(event, geometryType);
                        //         let geometry = {
                        //             type: appStrings.GEOMETRY_BOX,
                        //             id: Math.random(),
                        //             proj: this.map
                        //                 .getView()
                        //                 .getProjection()
                        //                 .getCode(),
                        //             coordinates: event.extent.map(x => parseFloat(x.toFixed(3))),
                        //             coordinateType: appStringsCore.COORDINATE_TYPE_CARTOGRAPHIC
                        //         };
                        //         // event.feature.set("interactionType", interactionType);
                        //         // event.feature.setId(geometry.id);
                        //         onDrawEnd(geometry, event);
                        //     }
                        // });

                        // Disable
                        drawInteraction.setActive(false);

                        // Set properties we'll need
                        drawInteraction.set("_id", interactionType + geometryType);
                        drawInteraction.set(interactionType, true);

                        // Add to map
                        this.map.addInteraction(drawInteraction);

                        return true;
                    }
                }

                return false;
            } catch (err) {
                console.warn("Error in MapWrapperOpenlayers.addDrawHandler:", err);
                return false;
            }
        } else {
            return MapWrapperOpenlayersCore.prototype.addDrawHandler.call(
                this,
                geometryType,
                onDrawEnd,
                interactionType
            );
        }
    }

    retrieveGeometryFromEvent(event, geometryType) {
        if (geometryType === appStrings.GEOMETRY_BOX) {
            let coords = event.feature.getGeometry().getCoordinates()[0];
            let minX = coords[0][0];
            let minY = coords[0][1];
            let maxX = coords[0][0];
            let maxY = coords[0][1];
            for (let i = 0; i < coords.length; ++i) {
                let c = coords[i];
                if (c[0] < minX) {
                    minX = c[0];
                }
                if (c[0] > maxX) {
                    maxX = c[0];
                }
                if (c[1] < minY) {
                    minY = c[1];
                }
                if (c[1] > maxY) {
                    maxY = c[1];
                }
            }

            let extent = MapUtil.constrainExtent([minX, minY, maxX, maxY], false);

            return {
                type: appStrings.GEOMETRY_BOX,
                id: Math.random(),
                proj: this.map
                    .getView()
                    .getProjection()
                    .getCode(),
                coordinates: extent.map(x => parseFloat(x.toFixed(3))),
                coordinateType: appStringsCore.COORDINATE_TYPE_CARTOGRAPHIC
            };
        } else {
            return MapWrapperOpenlayersCore.prototype.retrieveGeometryFromEvent.call(
                this,
                event,
                geometryType
            );
        }
    }

    enableAreaSelection(geometryType) {
        try {
            // remove double-click zoom while drawing so we can double-click complete
            this.setDoubleClickZoomEnabled(false);

            // Get drawHandler by geometryType
            let drawInteraction = this.miscUtil.findObjectInArray(
                this.map.getInteractions().getArray(),
                "_id",
                appStrings.INTERACTION_AREA_SELECTION + geometryType
            );
            if (drawInteraction) {
                // Call setActive(true) on handler to enable
                drawInteraction.setActive(true);
                // Check that handler is active
                return drawInteraction.getActive();
            }
            return false;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.enableAreaSelection:", err);
            return false;
        }
    }

    disableAreaSelection(delayDblClickEnable = true) {
        try {
            // Call setActive(false) on all handlers
            let drawInteractions = this.miscUtil.findAllMatchingObjectsInArray(
                this.map.getInteractions().getArray(),
                appStrings.INTERACTION_AREA_SELECTION,
                true
            );
            drawInteractions.map(handler => {
                handler.setActive(false);

                // Check that handler is not active
                if (handler.getActive()) {
                    console.warn("could not disable openlayers draw handler:", handler.get("_id"));
                }
            });

            // re-enable double-click zoom
            if (delayDblClickEnable) {
                setTimeout(() => {
                    this.setDoubleClickZoomEnabled(true);
                }, 251);
            } else {
                this.setDoubleClickZoomEnabled(true);
            }
            return true;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.disableAreaSelection:", err);
            return false;
        }
    }

    completeAreaSelection() {
        try {
            let drawInteractions = this.miscUtil.findAllMatchingObjectsInArray(
                this.map.getInteractions().getArray(),
                appStrings.INTERACTION_AREA_SELECTION,
                true
            );
            drawInteractions.map(handler => {
                if (handler.getActive()) {
                    handler.finishDrawing();
                }
            });
            return true;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.completeAreaSelection:", err);
            return false;
        }
    }

    removeAllAreaSelections() {
        let mapLayers = this.map.getLayers().getArray();
        let mapLayer = this.miscUtil.findObjectInArray(mapLayers, "_layerId", "_vector_drawings");
        if (!mapLayer) {
            console.warn("could not remove all geometries in openlayers map");
            return false;
        }
        // Remove geometries
        let mapLayerFeatures = mapLayer.getSource().getFeatures();
        let featuresToRemove = mapLayerFeatures.filter(
            x => x.get("interactionType") === appStrings.INTERACTION_AREA_SELECTION
        );
        for (let i = 0; i < featuresToRemove.length; i++) {
            mapLayer.getSource().removeFeature(featuresToRemove[i]);
        }
        return (
            mapLayer
                .getSource()
                .getFeatures()
                .filter(x => x.get("interactionType") === appStrings.INTERACTION_AREA_SELECTION)
                .length === 0
        );
    }

    addGeometry(geometry, interactionType, geodesic = false) {
        if (interactionType === appStrings.INTERACTION_AREA_SELECTION) {
            this.removeAllAreaSelections();

            if (geometry.coordinates.length !== 4) {
                return true;
            }

            let mapLayers = this.map.getLayers().getArray();
            let mapLayer = this.miscUtil.findObjectInArray(
                mapLayers,
                "_layerId",
                "_vector_drawings"
            );
            if (!mapLayer) {
                console.warn("could not find drawing layer in openlayers map");
                return false;
            }
            return this.addGeometryToMapLayer(geometry, interactionType, mapLayer);
        } else if (interactionType === appStrings.INTERACTION_AREA_DISPLAY) {
            if (geometry.coordinates.length !== 4) {
                return true;
            }
            let mapLayers = this.map.getLayers().getArray();
            let mapLayer = this.miscUtil.findObjectInArray(
                mapLayers,
                "_layerId",
                "_area_display_layer"
            );
            if (!mapLayer) {
                console.warn("could not find area display layer in openlayers map");
                return false;
            }
            return this.addGeometryToMapLayer(
                geometry,
                interactionType,
                mapLayer.getLayers().item(0)
            );
        } else {
            return MapWrapperOpenlayersCore.prototype.addGeometry.call(
                this,
                geometry,
                interactionType,
                geodesic
            );
        }
    }

    addGeometryToMapLayer(geometry, interactionType, mapLayer) {
        if (geometry.type === appStrings.GEOMETRY_BOX) {
            if (geometry.coordinateType === appStringsCore.COORDINATE_TYPE_CARTOGRAPHIC) {
                let minLon = geometry.coordinates[0];
                let maxLon = geometry.coordinates[2];
                let minLat = geometry.coordinates[1];
                let maxLat = geometry.coordinates[3];

                // deal with wrap
                minLon = MapUtil.constrainCoordinates([minLon, 0], false)[0];
                maxLon = MapUtil.constrainCoordinates([maxLon, 0], false)[0];
                if (minLon > maxLon) {
                    minLon = MapUtil.deconstrainLongitude(minLon);
                }

                let ulCoord = [minLon, maxLat];
                let urCoord = [maxLon, maxLat];
                let blCoord = [minLon, minLat];
                let brCoord = [maxLon, minLat];

                let lineStringFeature = new Ol_Feature({
                    geometry: new Ol_Geom_Polygon([[ulCoord, urCoord, brCoord, blCoord]])
                });

                lineStringFeature.set("interactionType", interactionType);
                lineStringFeature.setId(geometry.id);
                mapLayer.getSource().addFeature(lineStringFeature);
                return true;
            } else {
                console.warn(
                    "Unsupported geometry coordinateType ",
                    geometry.coordinateType,
                    " for openlayers lineString"
                );
                return false;
            }
        }
        return false;
    }

    removeGeometry(geometry, interactionType) {
        if (interactionType === appStrings.INTERACTION_AREA_SELECTION) {
            let mapLayers = this.map.getLayers().getArray();
            let mapLayer = this.miscUtil.findObjectInArray(
                mapLayers,
                "_layerId",
                "_vector_drawings"
            );
            if (!mapLayer) {
                console.warn("could not find drawing layer in openlayers map");
                return false;
            }
            let source = mapLayer.getSource();
            let feature = source.getFeatureById(geometry.id);
            if (typeof geometry === "undefined") {
                console.warn("could not feature with id: ", geometry.id);
                return false;
            }

            source.removeFeature(feature);

            return true;
        } else if (interactionType === appStrings.INTERACTION_AREA_DISPLAY) {
            let mapLayers = this.map.getLayers().getArray();
            let mapLayer = this.miscUtil.findObjectInArray(
                mapLayers,
                "_layerId",
                "_area_display_layer"
            );
            if (!mapLayer) {
                console.warn("could not find area display layer in openlayers map");
                return false;
            }

            let outerSource = mapLayer
                .getLayers()
                .item(0)
                .getSource();
            let innerSource = mapLayer
                .getLayers()
                .item(1)
                .getSource();

            let outerFeature = outerSource.getFeatureById(geometry.id);
            let innerFeature = innerSource.getFeatureById(geometry.id);
            if (typeof outerFeature === "undefined" || typeof innerFeature === "undefined") {
                console.warn("could not feature with id: ", geometry.id);
                return true;
            }

            outerSource.removeFeature(outerFeature);
            innerSource.removeFeature(innerFeature);

            return true;
        } else {
            console.warn(
                "Failed to remove geometry for unknown interaction type: ",
                interactionType
            );
            return true;
        }
    }

    recolorLayer(layer, paletteMap) {
        try {
            let mapLayers = this.map.getLayers().getArray();
            let mapLayer = this.miscUtil.findObjectInArray(mapLayers, "_layerId", layer.get("id"));
            this.tileHandler.setLayerPaletteMap(layer.get("id"), paletteMap);
            this.clearCacheForLayer(layer.get("id"));
            if (mapLayer) {
                mapLayer.set("_layerRef", layer);
                mapLayer.getSource().refresh();
            }
            return true;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.recolorLayer:", err);
            return false;
        }
    }

    updateLayer(layer, color = false) {
        try {
            if (layer.get("handleAs") === appStrings.LAYER_VECTOR_POINT_TRACK) {
                let mapLayers = this.map.getLayers().getArray();
                let mapLayer = this.miscUtil.findObjectInArray(
                    mapLayers,
                    "_layerId",
                    layer.get("id")
                );
                if (mapLayer) {
                    // update the layer
                    this.setLayerRefInfo(layer, mapLayer);

                    this.highlightTrackPoints(
                        mapLayer.getSource().getFeatures(),
                        layer.get("timeFormat"),
                        color || layer.get("vectorColor")
                    );
                }

                return true;
            } else {
                return MapWrapperOpenlayersCore.prototype.updateLayer.call(this, layer);
            }
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.updateLayer:", err);
            return false;
        }
    }

    highlightTrackPoints(features, timeFormat = "YYYY-MM-DD", color = "#000") {
        let mapLayers = this.map.getLayers().getArray();
        let mapLayer = this.miscUtil.findObjectInArray(
            mapLayers,
            "_layerId",
            "_point_highlight_layer"
        );
        if (!mapLayer) {
            console.warn("could not find point highlight layer in openlayers map");
            return false;
        }
        let source = mapLayer.getSource();

        if (features.length > 0) {
            let date = moment.utc(this.mapDate);
            let endTime = date.valueOf();
            let startTime = date
                .subtract(this.dateInterval.size, this.dateInterval.scale)
                .valueOf();
            let refFeature = features[0];
            let layerId = refFeature.get("_layerId");
            let highlightFeatures = [];
            if (layerId) {
                let currFeatureList = source.getFeatures();
                for (let i = 0; i < currFeatureList.length; ++i) {
                    let feature = currFeatureList[i];
                    if (feature.get("_layerId") === layerId) {
                        source.removeFeature(feature);
                    }
                }
            }

            for (let i = 0; i < features.length; ++i) {
                let feature = features[i];
                if (feature.getGeometry() instanceof Ol_Geom_Point) {
                    let featureTimeArr = feature.get("position_date_time") || [];
                    for (let j = 0; j < featureTimeArr.length; ++j) {
                        if (featureTimeArr[j] > startTime && featureTimeArr[j] <= endTime) {
                            let highlightFeature = feature.clone();
                            highlightFeature.set("_color", color);
                            highlightFeature.set("_matchIndex", j);
                            highlightFeatures.push(highlightFeature);
                            break;
                        }
                    }
                }
            }

            // aggregate multiple points into a line
            if (highlightFeatures.length > 1) {
                highlightFeatures.sort((a, b) => {
                    return (
                        a.get("position_date_time")[a.get("_matchIndex")] -
                        b.get("position_date_time")[b.get("_matchIndex")]
                    );
                });
                let linePoints = highlightFeatures.map((feature, i) => {
                    if (i < highlightFeatures.length - 1) {
                        let nextFeature = highlightFeatures[i + 1];
                        return [
                            feature.getGeometry().getCoordinates(),
                            nextFeature.getGeometry().getCoordinates()
                        ];
                    } else {
                        return [
                            feature.getGeometry().getCoordinates(),
                            feature.getGeometry().getCoordinates()
                        ];
                    }
                });

                let lineFeature = new Ol_Feature({
                    geometry: new Ol_Geom_MultiLineString(linePoints)
                });
                lineFeature.set("_color", highlightFeatures[0].get("_color"));
                lineFeature.set("_layerId", highlightFeatures[0].get("_layerId"));
                source.addFeature(lineFeature);
            } else {
                source.addFeatures(highlightFeatures);
            }
        }
    }

    clearCacheForLayer(layerId) {
        this.layerCache.clearByKeyMatch(layerId);
    }

    handleTileLoad(layer, mapLayer, tile, url, origFunc) {
        MapWrapperOpenlayersCore.prototype.handleTileLoad.call(
            this,
            mapLayer.get("_layerRef"),
            mapLayer,
            tile,
            url,
            origFunc
        );
    }

    fillAnimationBuffer(layersToBuffer, startDate, endDate, stepResolution, callback = false) {
        try {
            // make sure the previous buffer is cleared
            this.animationBuffer.clear();

            // make sure the previous tile loading queue is clear
            this.tileLoadingQueue.clear(true);

            // clear the tile loading counter
            _tilesLoading = 0;

            // sort the array of layers according to current display order
            layersToBuffer = layersToBuffer.sort((a, b) => {
                let indexA = this.getLayerIndex(a);
                let indexB = this.getLayerIndex(b);

                return indexA - indexB;
            });

            // initialize the buffer with the new animation config
            this.animationBuffer.initializeBuffer({
                layers: layersToBuffer,
                startDate: startDate,
                endDate: endDate,
                stepResolution: stepResolution,
                createLayer: (layer, date) => {
                    return this.createBufferLayer(layer, date, callback);
                },
                checkLayerStatus: mapLayer => {
                    return this.loadTiles(mapLayer);
                },
                clearFrameLayer: mapLayer => {
                    return this.clearBufferLayer(mapLayer);
                }
            });

            // start the buffering
            this.animationBuffer.bufferLayers();
            return true;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.fillAnimationBuffer:", err);
            return false;
        }
    }

    clearAnimationBuffer() {
        try {
            // remove the current frame from the map
            this.clearDisplay();

            // clear the buffer
            this.animationBuffer.clear();

            // clear the loading queue
            this.tileLoadingQueue.clear(true);

            // reset counter
            _tilesLoading = 0;

            return true;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.clearAnimationBuffer:", err);
            return false;
        }
    }

    nextAnimationFrame() {
        try {
            // get the next frame
            return this.animationBuffer.getNextFrame();
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.nextAnimationFrame:", err);
            return false;
        }
    }

    previousAnimationFrame() {
        try {
            // return the frame object
            return this.animationBuffer.getPreviousFrame();
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.previousAnimationFrame:", err);
            return false;
        }
    }

    getBufferStatus() {
        this.tileLoadingQueue.clear();
        return this.animationBuffer.getBufferStatus();
    }

    getCurrentFrameStatus() {
        return this.animationBuffer.getCurrentFrameStatus();
    }

    getNextFrameStatus() {
        return this.animationBuffer.getNextFrameStatus();
    }

    getPreviousFrameStatus() {
        return this.animationBuffer.getPreviousFrameStatus();
    }

    clearDisplay() {
        try {
            this.animationBuffer.getMapLayers().forEach(mapLayer => {
                this.clearLayerTileListeners(mapLayer);
            });

            return true;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.clearDisplay:", err);
            return false;
        }
    }

    createBufferLayer(layer, date, callback = false) {
        try {
            // create a new layer for the map
            let mapLayer = this.createLayer(layer, date);
            let status = this.getLoadingStatus(mapLayer);

            if (
                mapLayer.get("_layerRef").get("handleAs") === appStrings.LAYER_MULTI_FILE_VECTOR_KML
            ) {
                this.addMultiFileKMLLoadListeners(mapLayer, callback);

                // prep the canvas with tiles
                mapLayer
                    .getLayers()
                    .item(0)
                    .getSource()
                    .getImage(
                        this.getExtent(),
                        this.map.getView().getResolution(),
                        1,
                        this.map.getView().getProjection()
                    );
            } else {
                this.addRasterLayerLoadListeners(mapLayer, callback);
            }

            // // add the layer to cache for faster access later
            // this.layerCache.set(mapLayer.get("_layerCacheHash"), mapLayer);

            // check if this is coming from the cache
            if (!status.isLoaded) {
                // begin loading tiles for this source
                this.loadTiles(mapLayer);
            }

            return mapLayer;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.createBufferLayer:", err);
            return false;
        }
    }

    addRasterLayerLoadListeners(mapLayer, callback = false) {
        // handle the tile loading complete
        let tileComplete = () => {
            // load more tiles
            _tilesLoading = this.tileLoadingQueue.loadMoreTiles(_tilesLoading - 1);

            // run the callback
            if (callback && typeof callback === "function") {
                callback();
            }
        };

        // start listening for the tile load events
        let source = mapLayer.getSource();
        if (typeof source.get("_tileLoadEndListener") === "undefined") {
            source.set("_tileLoadEndListener", source.on("tileloadend", () => tileComplete()));
        }
        if (typeof source.get("_tileLoadErrorListener") === "undefined") {
            source.set("_tileLoadErrorListener", source.on("tileloaderror", () => tileComplete()));
        }
    }

    addMultiFileKMLLoadListeners(mapLayer, callback = false) {
        // handle the tile loading complete
        let tileComplete = () => {
            // load more tiles
            _tilesLoading = this.tileLoadingQueue.loadMoreTiles(_tilesLoading - 1);

            // run the callback
            if (callback && typeof callback === "function") {
                callback();
            }
        };

        if (typeof mapLayer.get("_tileLoadEndListener") === "undefined") {
            mapLayer.set(
                "_tileLoadEndListener",
                mapLayer.on(appStrings.VECTOR_FEATURE_LOAD, () => tileComplete())
            );
        }
    }

    clearBufferLayer(mapLayer) {
        try {
            this.clearLayerTileListeners(mapLayer);
            return true;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.clearBufferLayer: ", err);
            throw err;
        }
    }

    clearLayerTileListeners(mapLayer) {
        Ol_Observable.unByKey(mapLayer.getSource().get("_tileLoadEndListener"));
        mapLayer.getSource().unset("_tileLoadEndListener");
        Ol_Observable.unByKey(mapLayer.getSource().get("_tileLoadErrorListener"));
        mapLayer.getSource().unset("_tileLoadErrorListener");
    }

    loadTiles(mapLayer) {
        // add the layer to cache for faster access later
        let layerInCache = this.layerCache.get(mapLayer.get("_layerCacheHash")) !== false;
        if (!layerInCache) {
            this.layerCache.set(mapLayer.get("_layerCacheHash"), mapLayer);
        }

        return this.loadRasterLayerTiles(mapLayer);
    }

    loadRasterLayerTiles(mapLayer) {
        let source = mapLayer.getSource();

        // to determine if all tiles are loaded, we check if all the expected tiles
        // are in the tileCache and have a loaded state
        let tilesTotal = 0;
        let tilesLoaded = 0;
        let tileGrid = source.getTileGrid();
        let extent = this.map.getView().calculateExtent(this.map.getSize());
        let resolution = this.map.getView().getResolution();
        let zoom = tileGrid.getZForResolution(resolution);
        tileGrid.forEachTileCoord(extent, zoom, tileCoord => {
            // If the tile has not been created, it should create a new one. If the tile has been created
            // it should return a cached reference to that tile
            let tile = source.getTile(
                tileCoord[0],
                tileCoord[1],
                tileCoord[2],
                Ol_Has.DEVICE_PIXEL_RATIO,
                source.getProjection()
            );
            if (LOAD_COMPLETE_STATES.indexOf(tile.state) !== -1) {
                tilesLoaded++;
            } else if (NO_LOAD_STATES.indexOf(tile.state) === -1) {
                this.tileLoadingQueue.enqueue(
                    mapLayer.get("_layerCacheHash") + tileCoord.join("/"),
                    tile
                );
            }
            tilesTotal++;
        });

        let isLoaded = tilesTotal === tilesLoaded && tilesTotal !== 0;

        // load more tiles
        _tilesLoading = this.tileLoadingQueue.loadMoreTiles(_tilesLoading);

        return { isLoaded, tilesTotal, tilesLoaded };
    }

    getLoadingStatus(mapLayer) {
        return this.getRasterLayerLoadingStatus(mapLayer);
    }

    getRasterLayerLoadingStatus(mapLayer) {
        let source = mapLayer.getSource();

        // to determine if all tiles are loaded, we check if all the expected tiles
        // are in the tileCache and have a loaded state
        let tilesTotal = 0;
        let tilesLoaded = 0;
        let tileGrid = source.getTileGrid();
        let extent = this.map.getView().calculateExtent(this.map.getSize());
        let resolution = this.map.getView().getResolution();
        let zoom = tileGrid.getZForResolution(resolution);
        tileGrid.forEachTileCoord(extent, zoom, tileCoord => {
            let tileCoordStr = tileCoord.join("/");
            if (
                source.tileCache.containsKey(tileCoordStr) &&
                LOAD_COMPLETE_STATES.indexOf(source.tileCache.get(tileCoordStr).state) !== -1
            ) {
                tilesLoaded++;
            }
            tilesTotal++;
        });

        let isLoaded = tilesTotal === tilesLoaded && tilesTotal !== 0;

        return { isLoaded, tilesTotal, tilesLoaded };
    }

    getCacheHash(layer, date = false) {
        if (date) {
            return layer.get("id") + moment.utc(date).format(layer.get("timeFormat"));
        } else {
            return layer.get("id") + moment.utc(this.mapDate).format(layer.get("timeFormat"));
        }
    }

    getLayerIndex(layer) {
        try {
            let mapLayers = this.map.getLayers().getArray();
            let mapLayerWithIndex = this.miscUtil.findObjectWithIndexInArray(
                mapLayers,
                "_layerId",
                layer.get("id")
            );
            if (mapLayerWithIndex) {
                return mapLayerWithIndex.index;
            }
            return -1;
        } catch (err) {
            console.warn("Error in MapWrapperOpenlayers.getLayerIndex:", err);
            return false;
        }
    }

    findTopInsertIndexForLayer(mapLayer) {
        let mapLayers = this.map.getLayers();
        let index = mapLayers.getLength();

        if (mapLayer.get("_layerType") === appStringsCore.LAYER_GROUP_TYPE_REFERENCE) {
            // referece layers always on top
            return index;
        } else if (mapLayer.get("_layerType") === appStringsCore.LAYER_GROUP_TYPE_BASEMAP) {
            // basemaps always on bottom
            return 0;
        } else if (
            mapLayer.get("_layerType") === appStrings.LAYER_GROUP_TYPE_INSITU_DATA ||
            mapLayer.get("_layerType") === appStrings.LAYER_GROUP_TYPE_INSITU_DATA_ERROR
        ) {
            // data layers in the middle
            for (let i = index - 1; i >= 0; --i) {
                let compareLayer = mapLayers.item(i);
                if (
                    compareLayer.get("_layerType") === appStrings.LAYER_GROUP_TYPE_DATA_REFERENCE ||
                    compareLayer.get("_layerType") === appStringsCore.LAYER_GROUP_TYPE_DATA ||
                    compareLayer.get("_layerType") === appStringsCore.LAYER_GROUP_TYPE_BASEMAP
                ) {
                    return i + 1;
                }
            }
            index = 0;
        } else {
            // data layers in the middle
            for (let i = index - 1; i >= 0; --i) {
                let compareLayer = mapLayers.item(i);
                if (
                    compareLayer.get("_layerType") === appStringsCore.LAYER_GROUP_TYPE_DATA ||
                    compareLayer.get("_layerType") === appStringsCore.LAYER_GROUP_TYPE_BASEMAP
                ) {
                    return i + 1;
                }
            }
            index = 0;
        }
        return index;
    }
}
