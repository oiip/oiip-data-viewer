/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";
import moment from "moment";
import MapReducerCore from "_core/reducers/reducerFunctions/MapReducer";
import { layerModel } from "reducers/models/map";
import { alert as alertCore } from "_core/reducers/models/alert";
import * as appStringsCore from "_core/constants/appStrings";
import * as appStrings from "constants/appStrings";
import appConfig from "constants/appConfig";
import MiscUtil from "utils/MiscUtil";

//IMPORTANT: Note that with Redux, state should NEVER be changed.
//State is considered immutable. Instead,
//create a copy of the state passed and set new values on the copy.

export default class MapReducer extends MapReducerCore {
    static getLayerModel() {
        return layerModel;
    }

    static setMapDate(state, action) {
        state = MapReducerCore.setMapDate(state, action);

        let size = state.get("dateIntervalSize");
        let scale = state.get("dateIntervalScale");
        let date = moment.utc(state.get("date"));

        return state.set("intervalDate", date.subtract(size, scale).toDate());
    }

    static setDateInterval(state, action) {
        let alerts = state.get("alerts");
        if (state.getIn(["animation", "initiated"])) {
            if (state.getIn(["animation", "isPlaying"])) {
                alerts = alerts.push(
                    alertCore.merge({
                        title: appStrings.ALERTS.ANIMATION_NO_CHANGE_STEP.title,
                        body: appStrings.ALERTS.ANIMATION_NO_CHANGE_STEP.formatString,
                        severity: appStrings.ALERTS.ANIMATION_NO_CHANGE_STEP.severity,
                        time: new Date()
                    })
                );
            }
            state = this.stopAnimation(state, {});
        }

        let size = parseInt(action.size);
        let scale = action.scale;

        try {
            let intervalDate = moment.utc(state.get("date")).subtract(size, scale);
            if (intervalDate.isValid()) {
                // let intervalMs = moment.duration(size, scale).asMilliseconds();

                // update each map
                state.get("maps").forEach(map => {
                    if (map.setMapDateInterval({ size, scale })) {
                        // update each layer on the map
                        state.get("layers").forEach(layerSection => {
                            layerSection.forEach(layer => {
                                if (
                                    layer.get("isActive") &&
                                    layer.get("updateParameters").get("time")
                                ) {
                                    map.updateLayer(layer);
                                }
                            });
                        });
                    }
                });

                return state
                    .set("dateIntervalSize", size)
                    .set("dateIntervalScale", scale)
                    .set("intervalDate", intervalDate.toDate())
                    .set("alerts", alerts);
            }
        } catch (err) {
            console.warn("Error in MapReducer.setDateInterval: ", err);
            return state;
        }
    }

    static setLayerLoading(state, action) {
        let actionLayer = action.layer;
        if (typeof actionLayer === "string") {
            actionLayer = this.findLayerById(state, actionLayer);
        }
        if (typeof actionLayer !== "undefined") {
            state = state.setIn(
                ["layers", actionLayer.get("type"), actionLayer.get("id"), "isLoading"],
                action.isLoading
            );
        }
        return state;
    }

    static setInsituLayerTitles(state, action) {
        if (typeof action.titleField !== "undefined") {
            let dataLayers = state
                .getIn(["layers", appStrings.LAYER_GROUP_TYPE_INSITU_DATA])
                .map(layer => {
                    if (typeof layer.getIn(["insituMeta", action.titleField]) !== "undefined") {
                        return layer.set("title", layer.getIn(["insituMeta", action.titleField]));
                    }
                    return layer;
                });
            return state
                .setIn(["layers", appStrings.LAYER_GROUP_TYPE_INSITU_DATA], dataLayers)
                .set("insituLayerTitleField", action.titleField);
        }
        return state;
    }

    static setLayerActive(state, action) {
        // turn off the other data layers first
        if (action.active) {
            // resolve layer from id if necessary
            let actionLayer = action.layer;
            if (typeof actionLayer === "string") {
                actionLayer = this.findLayerById(state, actionLayer);
            }
            if (typeof actionLayer !== "undefined") {
                if (actionLayer.get("type") === appStringsCore.LAYER_GROUP_TYPE_DATA) {
                    let dataLayers = state.getIn(["layers", appStringsCore.LAYER_GROUP_TYPE_DATA]);
                    dataLayers.map((layer, id) => {
                        if (layer.get("isActive")) {
                            state = MapReducerCore.setLayerActive(state, {
                                layer: id,
                                active: false
                            });
                        }
                    });
                } else if (actionLayer.get("type") === appStrings.LAYER_GROUP_TYPE_INSITU_DATA) {
                    // set the color of this vector layer
                    let dataLayers = state.getIn([
                        "layers",
                        appStrings.LAYER_GROUP_TYPE_INSITU_DATA
                    ]);

                    let colorIndex = MiscUtil.getRandomInt(
                        0,
                        appConfig.INSITU_VECTOR_COLORS.length
                    );
                    let color = appConfig.INSITU_VECTOR_COLORS[colorIndex];
                    state = state
                        .setIn(
                            [
                                "layers",
                                appStrings.LAYER_GROUP_TYPE_INSITU_DATA,
                                actionLayer.get("id"),
                                "vectorColor"
                            ],
                            color
                        )
                        .setIn(
                            [
                                "layers",
                                appStrings.LAYER_GROUP_TYPE_INSITU_DATA,
                                actionLayer.get("id"),
                                "isLoading"
                            ],
                            true
                        );
                }
            }
        }

        state = MapReducerCore.setLayerActive(state, action);

        // check if we need to stop and clear the animation
        let alerts = state.get("alerts");
        if (state.getIn(["animation", "initiated"])) {
            alerts = alerts.push(
                alertCore.merge({
                    title: appStrings.ALERTS.ANIMATION_NO_LAYER_TOGGLE.title,
                    body: appStrings.ALERTS.ANIMATION_NO_LAYER_TOGGLE.formatString,
                    severity: appStrings.ALERTS.ANIMATION_NO_LAYER_TOGGLE.severity,
                    time: new Date()
                })
            );
            state = this.stopAnimation(state, {}).set("alerts", alerts);
        }

        return state;
    }

    static setTrackErrorActive(state, action) {
        // resolve layer from id if necessary
        let actionLayer = action.layer;
        if (typeof actionLayer === "string") {
            actionLayer = this.findLayerById(state, actionLayer);
        }
        if (typeof actionLayer !== "undefined") {
            state = state.setIn(
                ["layers", actionLayer.get("type"), actionLayer.get("id"), "isErrorActive"],
                action.isActive
            );
        }
        return state;
    }

    static pixelHover(state, action) {
        let pixelCoordinate = state.getIn(["view", "pixelHoverCoordinate"]).set("isValid", false);
        state.get("maps").forEach(map => {
            if (map.isActive) {
                let data = [];
                let coords = map.getLatLonFromPixelCoordinate(action.pixel);
                if (coords.isValid) {
                    // find data if any
                    data = map.getDataAtPoint(coords, action.pixel, state.get("palettes"));
                    data = data !== false ? data : [];
                    data = Immutable.fromJS(
                        data.map(entry => {
                            entry.layer = this.findLayerById(state, entry.layerId);
                            return entry;
                        })
                    );

                    // extract reference layer data
                    let refData = data.filter(entry => {
                        return (
                            entry.getIn(["layer", "type"]) ===
                            appStrings.LAYER_GROUP_TYPE_DATA_REFERENCE
                        );
                    });

                    data = data
                        .filterNot(entry => {
                            return (
                                entry.getIn(["layer", "type"]) ===
                                appStrings.LAYER_GROUP_TYPE_DATA_REFERENCE
                            );
                        })
                        .slice(0, 1);

                    state = state.setIn(["view", "refHoverData"], refData);

                    // set the coordinate as valid
                    pixelCoordinate = pixelCoordinate
                        .set("lat", coords.lat)
                        .set("lon", coords.lon)
                        .set("x", action.pixel[0])
                        .set("y", action.pixel[1])
                        .set("data", data)
                        .set("showData", data.size > 0)
                        .set("isValid", true);
                } else {
                    pixelCoordinate = pixelCoordinate.set("isValid", false);
                }
            }
            return true;
        });
        return state.setIn(["view", "pixelHoverCoordinate"], pixelCoordinate);
    }

    static pixelClick(state, action) {
        let pixelCoordinate = state.getIn(["view", "pixelClickCoordinate"]).set("isValid", false);
        state.get("maps").forEach(map => {
            if (map.isActive) {
                let data = [];
                let pixel = map.getPixelFromClickEvent(action.clickEvt);
                if (pixel) {
                    let coords = map.getLatLonFromPixelCoordinate(pixel);
                    if (coords.isValid) {
                        // find data if any
                        data = map.getDataAtPoint(coords, pixel, state.get("palettes"));
                        data = data !== false ? data : [];
                        data = Immutable.fromJS(
                            data.map(entry => {
                                entry.layer = this.findLayerById(state, entry.layerId);
                                return entry;
                            })
                        );

                        data = data
                            .filterNot(entry => {
                                return (
                                    entry.getIn(["layer", "type"]) ===
                                    appStrings.LAYER_GROUP_TYPE_DATA_REFERENCE
                                );
                            })
                            .slice(0, 1);

                        // set the coordinate as valid
                        pixelCoordinate = pixelCoordinate
                            .set("lat", coords.lat)
                            .set("lon", coords.lon)
                            .set("x", pixel[0])
                            .set("y", pixel[1])
                            .set("data", data)
                            .set("showData", data.size > 0)
                            .set("isValid", true);

                        let dateStr = data.getIn([0, "properties", "position_date_time", 0]);
                        if (typeof dateStr !== "undefined") {
                            // let date = moment.utc(dateStr, data.getIn([0, "layer", "timeFormat"]));
                            let date = moment.utc(dateStr);
                            state = MapReducer.setMapDate(state, { date: date.toDate() });
                        }
                    } else {
                        pixelCoordinate = pixelCoordinate.set("isValid", false);
                    }
                }
            }
            return true;
        });

        return state.setIn(["view", "pixelClickCoordinate"], pixelCoordinate);
    }

    static addLayer(state, action) {
        if (typeof action.layer !== "undefined") {
            let mergedLayer = this.getLayerModel().mergeDeep(action.layer);
            if (
                typeof mergedLayer.get("id") !== "undefined" &&
                typeof state.getIn(["layers", mergedLayer.get("type")]) !== "undefined"
            ) {
                state = state.setIn(
                    ["layers", mergedLayer.get("type"), mergedLayer.get("id")],
                    mergedLayer
                );
            }

            return this.setLayerActive(state, {
                layer: mergedLayer.get("id"),
                active: action.setActive
            });
        }

        return state;
    }

    static removeLayer(state, action) {
        if (state.hasIn(["layers", action.layer.get("type"), action.layer.get("id")])) {
            state = this.setLayerActive(state, {
                layer: action.layer.get("id"),
                active: false
            });
            return state.deleteIn(["layers", action.layer.get("type"), action.layer.get("id")]);
        }
        return state;
    }

    static setInsituVectorLayerColor(state, action) {
        // resolve layer from id if necessary
        let actionLayer = action.layer;
        if (typeof actionLayer === "string") {
            actionLayer = this.findLayerById(state, actionLayer);
        }

        if (typeof actionLayer !== "undefined") {
            let anySucceed = state.get("maps").reduce((acc, map) => {
                if (map.setVectorLayerColor(actionLayer, action.color)) {
                    return true;
                }
                return acc;
            }, false);

            if (anySucceed) {
                state = state.setIn(
                    ["layers", actionLayer.get("type"), actionLayer.get("id"), "vectorColor"],
                    action.color
                );
            }
        }

        return state;
    }

    static zoomToLayer(state, action) {
        // resolve layer from id if necessary
        let actionLayer = action.layer;
        if (typeof actionLayer === "string") {
            actionLayer = this.findLayerById(state, actionLayer);
        }

        if (typeof actionLayer !== "undefined") {
            let anySucceed = state.get("maps").reduce((acc, map) => {
                if (map.zoomToLayer(actionLayer, action.pad)) {
                    return true;
                }
                return acc;
            }, false);
        }

        return state;
    }

    static enableAreaSelection(state, action) {
        action.delayClickEnable = false;
        state = this.disableMeasuring(state, action);
        state = this.disableDrawing(state, action);
        state = this.disableAreaSelection(state, action);

        // For each map, enable drawing
        let anySucceed = state.get("maps").reduce((acc, map) => {
            if (map.isActive) {
                if (map.enableAreaSelection(action.geometryType)) {
                    return true;
                }
            }
            return acc;
        }, false);

        if (anySucceed) {
            return state
                .setIn(["areaSelection", "isAreaSelectionEnabled"], true)
                .setIn(["areaSelection", "geometryType"], action.geometryType);
        }
        return state;
    }

    static enableMeasuring(state, action) {
        state = this.disableAreaSelection(state, { delayClickEnable: false });
        return MapReducerCore.enableMeasuring(state, action);
    }

    static disableAreaSelection(state, action) {
        // For each map, disable drawing
        let anySucceed = state.get("maps").reduce((acc, map) => {
            if (map.disableAreaSelection(action.delayClickEnable)) {
                return true;
            }
            return acc;
        }, false);

        if (anySucceed) {
            return state
                .setIn(["areaSelection", "isAreaSelectionEnabled"], false)
                .setIn(["areaSelection", "geometryType"], "");
        }
        return state;
    }

    static removeAllAreaSelections(state, action) {
        state = this.disableAreaSelection(state, action);
        state = this.disableDrawing(state, action);
        state = this.disableMeasuring(state, action);

        let alerts = state.get("alerts");
        state.get("maps").forEach(map => {
            if (!map.removeAllAreaSelections()) {
                let contextStr = map.is3D ? "3D" : "2D";
                alerts = alerts.push(
                    alertCore.merge({
                        title: appStrings.ALERTS.GEOMETRY_REMOVAL_FAILED.title,
                        body: appStrings.ALERTS.GEOMETRY_REMOVAL_FAILED.formatString.replace(
                            "{MAP}",
                            contextStr
                        ),
                        severity: appStrings.ALERTS.GEOMETRY_REMOVAL_FAILED.severity,
                        time: new Date()
                    })
                );
            }
        });

        return state.set("alerts", alerts);
    }

    static addGeometryToMap(state, action) {
        if (
            action.interactionType === appStrings.INTERACTION_AREA_SELECTION ||
            action.interactionType === appStrings.INTERACTION_AREA_DISPLAY
        ) {
            let alerts = state.get("alerts");
            // Add geometry to each inactive map
            state.get("maps").forEach(map => {
                // Only add geometry to inactive maps unless it's an area selection
                if (!map.addGeometry(action.geometry, action.interactionType, action.geodesic)) {
                    let contextStr = map.is3D ? "3D" : "2D";
                    alerts = alerts.push(
                        alertCore.merge({
                            title: appStringsCore.ALERTS.GEOMETRY_SYNC_FAILED.title,
                            body: appStringsCore.ALERTS.GEOMETRY_SYNC_FAILED.formatString.replace(
                                "{MAP}",
                                contextStr
                            ),
                            severity: appStringsCore.ALERTS.GEOMETRY_SYNC_FAILED.severity,
                            time: new Date()
                        })
                    );
                }
            });
            return state.set("alerts", alerts);
        } else {
            return MapReducerCore.addGeometryToMap(state, action);
        }
    }

    static removeGeometry(state, action) {
        if (
            action.interactionType === appStrings.INTERACTION_AREA_SELECTION ||
            action.interactionType === appStrings.INTERACTION_AREA_DISPLAY
        ) {
            let alerts = state.get("alerts");
            // Add geometry to each inactive map
            state.get("maps").forEach(map => {
                // Only add geometry to inactive maps unless it's an area selection
                if (!map.removeGeometry(action.geometry, action.interactionType)) {
                    let contextStr = map.is3D ? "3D" : "2D";
                    alerts = alerts.push(
                        alertCore.merge({
                            title: appStringsCore.ALERTS.GEOMETRY_SYNC_FAILED.title,
                            body: appStringsCore.ALERTS.GEOMETRY_SYNC_FAILED.formatString.replace(
                                "{MAP}",
                                contextStr
                            ),
                            severity: appStringsCore.ALERTS.GEOMETRY_SYNC_FAILED.severity,
                            time: new Date()
                        })
                    );
                }
            });
            return state.set("alerts", alerts);
        } else {
            return state;
        }
    }

    static setAnimationOpen(state, action) {
        // state = this.setAnimationStartDate(state, { date: moment.utc(state.get("date")).subtract(1, 'week').toDate() });
        // state = this.setAnimationEndDate(state, { date: moment.utc(state.get("date")).add(1, 'week').toDate() });
        if (action.isOpen && action.updateRange) {
            state = this.setAnimationStartDate(state, {
                date: moment
                    .utc(state.get("date"))
                    .subtract(2, "week")
                    .toDate()
            });
            state = this.setAnimationEndDate(state, {
                date: moment.utc(state.get("date"))
            });
        }

        return state.setIn(["animation", "isOpen"], action.isOpen);
    }

    static setAnimationCollapsed(state, action) {
        return state.setIn(["animation", "isCollapsed"], action.isCollapsed);
    }

    static setAnimationPlaying(state, action) {
        return state.setIn(["animation", "isPlaying"], action.isPlaying);
    }

    static fillAnimationBuffer(state, action) {
        let alerts = state.get("alerts");

        // get an array of layers that will animate (active and time dependant)
        let animateTypes = [
            appStringsCore.LAYER_GIBS_RASTER,
            appStringsCore.LAYER_WMTS_RASTER,
            appStringsCore.LAYER_XYZ_RASTER,
            appStrings.LAYER_MULTI_FILE_VECTOR_KML
        ];
        let timeLayers = state
            .getIn(["layers", appStringsCore.LAYER_GROUP_TYPE_DATA])
            .filter(layer => {
                return layer.get("isActive") && layer.getIn(["updateParameters", "time"]);
            });

        // filter layers we can/cannot animate
        let layersToBuffer = timeLayers.filter(layer => {
            return animateTypes.indexOf(layer.get("handleAs")) !== -1;
        });
        let layersToRemove = timeLayers.filter(layer => {
            return animateTypes.indexOf(layer.get("handleAs")) === -1;
        });

        // validate step size
        let stepSize = action.stepResolution.split("/");
        let stepDate = moment.utc(action.startDate).add(stepSize[0], stepSize[1]);
        let framesAvailable = !stepDate.isAfter(moment.utc(action.endDate));
        if (framesAvailable) {
            // if (layersToBuffer.size > 0) {
            // remove layers we cannot animate
            layersToRemove.forEach(layer => {
                MapReducerCore.setLayerActive(state, { layer, active: false });
                alerts = alerts.push(
                    alertCore.merge({
                        title: appStrings.ALERTS.NON_ANIMATION_LAYER.title,
                        body: appStrings.ALERTS.NON_ANIMATION_LAYER.formatString.replace(
                            "{LAYER}",
                            layer.get("title")
                        ),
                        severity: appStrings.ALERTS.NON_ANIMATION_LAYER.severity,
                        time: new Date()
                    })
                );
            });

            // send the layers off to buffer
            let anySucceed = state.get("maps").reduce((acc, map) => {
                // only animate on the active map
                if (map.isActive) {
                    if (
                        map.fillAnimationBuffer(
                            layersToBuffer,
                            action.startDate,
                            action.endDate,
                            action.stepResolution,
                            action.callback
                        )
                    ) {
                        return true;
                    } else {
                        // catch errors
                        let contextStr = map.is3D ? "3D" : "2D";
                        alerts = alerts.push(
                            alertCore.merge({
                                title: appStrings.ALERTS.FILL_BUFFER_FAILED.title,
                                body: appStrings.ALERTS.FILL_BUFFER_FAILED.formatString.replace(
                                    "{MAP}",
                                    contextStr
                                ),
                                severity: appStrings.ALERTS.FILL_BUFFER_FAILED.severity,
                                time: new Date()
                            })
                        );
                    }
                }
                return acc;
            }, false);

            if (anySucceed) {
                // signal that buffering has begun
                state = state.setIn(["animation", "initiated"], true);

                // begin checking the initial buffer
                state = this.checkInitialAnimationBuffer(state, {});
            }
            // }
            // else {
            //     state = this.stopAnimation(state, {});
            //     alerts = alerts.push(
            //         alertCore.merge({
            //             title: appStrings.ALERTS.NO_ANIMATION_LAYERS.title,
            //             body: appStrings.ALERTS.NO_ANIMATION_LAYERS.formatString,
            //             severity: appStrings.ALERTS.NO_ANIMATION_LAYERS.severity,
            //             time: new Date()
            //         })
            //     );
            // }
        } else {
            state = this.stopAnimation(state, {});
            alerts = alerts.push(
                alertCore.merge({
                    title: appStrings.ALERTS.NO_STEP_FRAMES.title,
                    body: appStrings.ALERTS.NO_STEP_FRAMES.formatString,
                    severity: appStrings.ALERTS.NO_STEP_FRAMES.severity,
                    time: new Date()
                })
            );
        }

        return state.set("alerts", alerts);
    }

    static emptyAnimationBuffer(state, action) {
        let alerts = state.get("alerts");

        let anySucceed = state.get("maps").reduce((acc, map) => {
            // clear all maps' buffers (just in case)
            if (map.clearAnimationBuffer()) {
                return true;
            } else {
                // catch errors
                let contextStr = map.is3D ? "3D" : "2D";
                alerts = alerts.push(
                    alertCore.merge({
                        title: appStrings.ALERTS.CLEAR_BUFFER_FAILED.title,
                        body: appStrings.ALERTS.CLEAR_BUFFER_FAILED.formatString.replace(
                            "{MAP}",
                            contextStr
                        ),
                        severity: appStrings.ALERTS.CLEAR_BUFFER_FAILED.severity,
                        time: new Date()
                    })
                );
            }
            return acc;
        }, false);

        return state.set("alerts", alerts);
    }

    static stopAnimation(state, action) {
        // empty the animation buffer
        state = this.emptyAnimationBuffer(state, {});

        // upate state variables
        state = state
            .setIn(["animation", "isPlaying"], false)
            .setIn(["animation", "initiated"], false)
            .setIn(["animation", "bufferLoaded"], false)
            .setIn(["animation", "initialBufferLoaded"], false)
            .setIn(["animation", "nextFrameLoaded"], false)
            .setIn(["animation", "previousFrameLoaded"], false)
            .setIn(["animation", "bufferFramesTotal"], 0)
            .setIn(["animation", "bufferFramesLoaded"], 0)
            .setIn(["animation", "bufferTilesTotal"], 0)
            .setIn(["animation", "bufferTilesLoaded"], 0);

        // don't need to reactivate layers if we are opening the panel for the first time
        if (state.getIn(["animation", "isOpen"])) {
            // get an array of layers that must be reactivated (were active, time dependant, and non-raster)
            let animateTypes = [
                appStringsCore.LAYER_GIBS_RASTER,
                appStringsCore.LAYER_WMTS_RASTER,
                appStringsCore.LAYER_XYZ_RASTER
            ];
            let layersToReactivate = state
                .getIn(["layers", appStringsCore.LAYER_GROUP_TYPE_DATA])
                .filter(layer => {
                    return (
                        layer.get("isActive") &&
                        layer.getIn(["updateParameters", "time"]) &&
                        animateTypes.indexOf(layer.get("handleAs")) === -1
                    );
                });

            // reactivate the layers and adjust opacity
            layersToReactivate.forEach(layer => {
                state = MapReducerCore.setLayerActive(state, {
                    layer: layer.set("isActive", false),
                    active: true
                });
                state = MapReducerCore.setLayerOpacity(state, {
                    layer,
                    opacity: layer.get("opacity")
                });
            });
        }

        return state;
    }

    static stepAnimation(state, action) {
        let nextFrame = false;

        // check frames
        state = this.checkNextAnimationFrame(state, {});
        state = this.checkPreviousAnimationFrame(state, {});

        if (action.forward) {
            // verify frame is loaded
            if (state.getIn(["animation", "nextFrameLoaded"])) {
                nextFrame = state.get("maps").reduce((acc, map) => {
                    let frame = map.nextAnimationFrame();
                    if (frame) {
                        return frame;
                    }
                    return acc;
                }, false);
            } else {
                state = this.checkAnimationBuffer(state, {});
            }
        } else {
            // verify frame is loaded
            if (state.getIn(["animation", "previousFrameLoaded"])) {
                nextFrame = state.get("maps").reduce((acc, map) => {
                    let frame = map.previousAnimationFrame();
                    if (frame) {
                        return frame;
                    }
                    return acc;
                }, false);
            } else {
                state = this.checkAnimationBuffer(state, {});
            }
        }

        // update the current frame reference
        if (nextFrame) {
            let nextDate = nextFrame.get("date");
            state = this.setMapDate(state, { date: nextDate });
        }
        return state;
    }

    static checkAnimationBuffer(state, action) {
        state = this.checkNextAnimationFrame(state, {});
        state = this.checkPreviousAnimationFrame(state, {});

        let bufferStatus = state.get("maps").reduce((acc, map) => {
            // check only active map
            if (map.isActive) {
                return map.getBufferStatus();
            }
            return acc;
        }, false);

        if (bufferStatus) {
            return state
                .setIn(["animation", "bufferLoaded"], bufferStatus.isLoaded)
                .setIn(["animation", "bufferFramesTotal"], bufferStatus.framesTotal)
                .setIn(["animation", "bufferFramesLoaded"], bufferStatus.framesLoaded)
                .setIn(["animation", "bufferTilesTotal"], bufferStatus.tilesTotal)
                .setIn(["animation", "bufferTilesLoaded"], bufferStatus.tilesLoaded);
        }
        return state;
    }

    static checkInitialAnimationBuffer(state, action) {
        // verify the buffer has been filled at least once
        if (!state.getIn(["animation", "initialBufferLoaded"])) {
            state = this.checkAnimationBuffer(state, {});
            state = state.setIn(
                ["animation", "initialBufferLoaded"],
                state.getIn(["animation", "bufferLoaded"])
            );
            state = this.setAnimationPlaying(state, {
                isPlaying: state.getIn(["animation", "bufferLoaded"])
            });
        }
        return state;
    }

    static checkNextAnimationFrame(state, action) {
        let nextFrameLoaded = state.get("maps").reduce((acc, map) => {
            // check only active map
            if (map.isActive) {
                let status = map.getNextFrameStatus();
                if (status.isLoaded) {
                    return acc;
                }
                return false;
            }
            return acc;
        }, true);

        return state.setIn(["animation", "nextFrameLoaded"], nextFrameLoaded);
    }

    static checkPreviousAnimationFrame(state, action) {
        let previousFrameLoaded = state.get("maps").reduce((acc, map) => {
            // check only active map
            if (map.isActive) {
                let status = map.getPreviousFrameStatus();
                if (status.isLoaded) {
                    return acc;
                }
                return false;
            }
            return acc;
        }, true);

        return state.setIn(["animation", "previousFrameLoaded"], previousFrameLoaded);
    }

    static setAnimationStartDate(state, action) {
        state = this.stopAnimation(state, {});

        let alerts = state.get("alerts");

        let date = action.date;
        if (typeof date === "string") {
            if (date.toLowerCase() === "today") {
                date = moment.utc().startOf("day");
            } else {
                date = moment.utc(date, "YYYY-MM-DD", true);
            }
        } else {
            date = moment.utc(date);
        }

        if (date.isValid()) {
            let minDate = moment.utc(appConfig.MIN_DATE);
            let maxDate = moment.utc(state.getIn(["animation", "endDate"]));
            if (date.isBefore(minDate)) {
                date = minDate;
            } else if (date.isAfter(maxDate)) {
                date = maxDate;
            }
            state = state.setIn(["animation", "startDate"], date.toDate());
        } else {
            alerts = alerts.push(
                alertCore.merge({
                    title: appStrings.ALERTS.ANIMATION_BAD_DATE.title,
                    body: appStrings.ALERTS.ANIMATION_BAD_DATE.formatString.replace(
                        "{STARTEND}",
                        "start"
                    ),
                    severity: appStrings.ALERTS.ANIMATION_BAD_DATE.severity,
                    time: new Date()
                })
            );
        }

        return state.set("alerts", alerts);
    }

    static setAnimationEndDate(state, action) {
        state = this.stopAnimation(state, {});

        let alerts = state.get("alerts");

        let date = action.date;
        if (typeof date === "string") {
            if (date.toLowerCase() === "today") {
                date = moment.utc().startOf("day");
            } else {
                date = moment.utc(date, "YYYY-MM-DD", true);
            }
        } else {
            date = moment.utc(date);
        }

        if (date.isValid()) {
            let minDate = moment.utc(state.getIn(["animation", "startDate"]));
            let maxDate = moment.utc(appConfig.MAX_DATE);
            if (date.isBefore(minDate)) {
                date = minDate;
            } else if (date.isAfter(maxDate)) {
                date = maxDate;
            }
            state = state.setIn(["animation", "endDate"], date.toDate());
        } else {
            alerts = alerts.push(
                alertCore.merge({
                    title: appStrings.ALERTS.ANIMATION_BAD_DATE.title,
                    body: appStrings.ALERTS.ANIMATION_BAD_DATE.formatString.replace(
                        "{STARTEND}",
                        "end"
                    ),
                    severity: appStrings.ALERTS.ANIMATION_BAD_DATE.severity,
                    time: new Date()
                })
            );
        }

        return state.set("alerts", alerts);
    }

    static setAnimationDateRange(state, action) {
        let alerts = state.get("alerts");
        if (state.getIn(["animation", "initiated"]) && state.getIn(["animation", "isPlaying"])) {
            alerts = alerts.push(
                alertCore.merge({
                    title: appStrings.ALERTS.ANIMATION_NO_LAYER_TOGGLE.title,
                    body: appStrings.ALERTS.ANIMATION_NO_LAYER_TOGGLE.formatString,
                    severity: appStrings.ALERTS.ANIMATION_NO_LAYER_TOGGLE.severity,
                    time: new Date()
                })
            );
        }

        state = this.stopAnimation(state, {});

        let startDate = action.startDate;
        if (typeof startDate === "string") {
            if (startDate.toLowerCase() === "today") {
                startDate = moment.utc().startOf("day");
            } else {
                startDate = moment.utc(startDate, "YYYY-MM-DD", true);
            }
        } else {
            startDate = moment.utc(startDate);
        }
        let endDate = action.endDate;
        if (typeof endDate === "string") {
            if (endDate.toLowerCase() === "today") {
                endDate = moment.utc().startOf("day");
            } else {
                endDate = moment.utc(endDate, "YYYY-MM-DD", true);
            }
        } else {
            endDate = moment.utc(endDate);
        }

        if (startDate.isValid() && endDate.isValid() && startDate.isSameOrBefore(endDate)) {
            let minDate = moment.utc(appConfig.MIN_DATE);
            let maxDate = moment.utc(appConfig.MAX_DATE);
            if (startDate.isBefore(minDate)) {
                startDate = minDate;
            } else if (startDate.isAfter(maxDate)) {
                startDate = maxDate;
            }
            if (endDate.isBefore(minDate)) {
                endDate = minDate;
            } else if (endDate.isAfter(maxDate)) {
                endDate = maxDate;
            }

            state = state
                .setIn(["animation", "startDate"], startDate.toDate())
                .setIn(["animation", "endDate"], endDate.toDate());
        } else {
            alerts = alerts.push(
                alertCore.merge({
                    title: appStrings.ALERTS.ANIMATION_BAD_DATE.title,
                    body: appStrings.ALERTS.ANIMATION_BAD_DATE.formatString.replace(
                        "{STARTEND}",
                        "start or end"
                    ),
                    severity: appStrings.ALERTS.ANIMATION_BAD_DATE.severity,
                    time: new Date()
                })
            );
        }
        return state.set("alerts", alerts);
    }

    static setAnimationSpeed(state, action) {
        return state.setIn(["animation", "speed"], action.speed);
    }
}
