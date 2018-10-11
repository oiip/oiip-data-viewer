/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";
import moment from "moment";

export default class AnimationBuffer {
    /*
        limit: integer maximum number of full maplayers to buffer
    */
    constructor(limit = 5, min = 7) {
        this._currentFrame = -1; // index of the most recently delivered frame
        this._bufferLimit = limit; // current and configured buffer limit
        this._bufferMin = min; // the minimum number of frames to buffer
        this._bufferList = Immutable.List(); // backing list
        this._layersPerFrame = 0;
    }

    setBufferLimit(limit) {
        if (typeof limit === "number") {
            limit = parseInt(limit);
            this._bufferLimit = parseInt(limit);
        }
    }

    initializeBuffer(options) {
        let layers = options.layers; // list of state model layers
        let startDate = options.startDate; // start date for the animation
        let endDate = options.endDate; // end date for the animation
        let stepResolution = options.stepResolution.split("/"); // step resolution ([int]/[resolution] see: http://momentjs.com/docs/#/manipulating/add/)
        let createLayer = options.createLayer; // callback function for creating/loading map layers
        let handleBufferLayerComplete = options.handleBufferLayerComplete; // callback function for removing map layers
        let checkLayerStatus = options.checkLayerStatus; // callback function for checking layer load status
        let clearFrameLayer = options.clearFrameLayer; // callback function for removing map layers from the view

        // clear the buffer
        this.clear();

        // set the endpoints
        let iterDate = moment.utc(startDate);
        endDate = moment.utc(endDate);

        // iterate through all the dates and build the buffer list
        while (iterDate.isBefore(endDate) || iterDate.isSame(endDate)) {
            this._bufferList = this._bufferList.push(
                Immutable.Map({
                    date: moment.utc(iterDate).toDate(),
                    layers: this.initializeLayersForDate(layers, iterDate.toDate())
                })
            );
            iterDate.add(stepResolution[0], stepResolution[1]);
        }

        // adjust the limit to make sure its reasonable
        this._layersPerFrame = layers.size;

        // store the create layer function
        this._createMapLayer = createLayer;

        // store the layer status function
        this._checkLayerStatus = checkLayerStatus;

        // store the remove layer callback function
        this._handleBufferLayerComplete = mapLayer => {
            if (typeof handleBufferLayerComplete === "function") {
                return handleBufferLayerComplete(mapLayer);
            }
            return true;
        };

        // store the frame clearing function
        this._clearFrameLayer = mapLayer => {
            if (typeof clearFrameLayer === "function") {
                return clearFrameLayer(mapLayer);
            }
            return true;
        };
    }

    initializeLayersForDate(layers, date) {
        // merge together a copy of all the layers for the buffer
        return layers.reduce((acc, layer) => {
            // merge in new layer object
            return acc.push(
                Immutable.Map({
                    layer: layer,
                    mapLayer: false
                })
            );
        }, Immutable.List());
    }

    bufferLayers() {
        // buffer one frame behind the current frame moving forward
        // maintain a list of all frames we need to buffer for
        // reference when clearing unneeded frames
        let bufferedFrames = Immutable.List();
        // let iter = this._currentFrame - 1;
        let iter = this._currentFrame;
        let bufferLimit = this.getBufferLimit();
        for (let i = 0; i < bufferLimit; ++i) {
            // handle wrap around
            if (iter >= this._bufferList.size) {
                iter = 0;
            } else if (iter < 0) {
                iter = this._bufferList.size - 1;
            }

            // create the corresponding map layer (if needed)
            bufferedFrames = bufferedFrames.push(iter);
            this._bufferList = this._bufferList.setIn(
                [iter, "layers"],
                this._bufferList.getIn([iter, "layers"]).map(layerEntry => {
                    // make sure we're not re-creating layers in mid-load
                    if (!layerEntry.get("mapLayer")) {
                        return layerEntry.set(
                            "mapLayer",
                            this._createMapLayer(
                                layerEntry.get("layer"),
                                this._bufferList.getIn([iter, "date"])
                            )
                        );
                    }
                    return layerEntry;
                })
            );
            iter++;
        }

        // clear the frame behind the animation
        // let unbufferFrame = this._currentFrame - 2; // -1 is still in buffer
        // if (unbufferFrame < 0) {
        //     unbufferFrame = this._bufferList.size + unbufferFrame; // wrap tail around
        // }
        // // make sure we don't clear a buffered frame
        // if (!bufferedFrames.includes(unbufferFrame) && unbufferFrame >= 0 && unbufferFrame < this._bufferList.size) {
        //     this.clearFrame(unbufferFrame);
        // }

        // clear the frame in front of the animation
        let unbufferFrame = this._currentFrame + (bufferLimit - 1); // we buffer one frame behind
        // unbufferFrame = this._currentFrame + (bufferLimit - 1); // we buffer one frame behind
        if (unbufferFrame >= this._bufferList.size) {
            unbufferFrame = unbufferFrame - this._bufferList.size; // wrap head around
        }
        // make sure we don't clear a buffered frame
        if (
            !bufferedFrames.includes(unbufferFrame) &&
            unbufferFrame >= 0 &&
            unbufferFrame < this._bufferList.size
        ) {
            this.clearFrame(unbufferFrame);
        }

        return true;
    }

    clearFrame(frame) {
        // remove the layer and clear the reference
        this._bufferList = this._bufferList.setIn(
            [frame, "layers"],
            this._bufferList.getIn([frame, "layers"]).map(layerEntry => {
                let mapLayer = layerEntry.get("mapLayer");
                if (mapLayer) {
                    this._clearFrameLayer(mapLayer);
                }
                return layerEntry.delete("mapLayer").set("mapLayer", false);
            })
        );
    }

    getBufferStatus() {
        let framesTotal = 0;
        let framesLoaded = 0;
        let tilesTotal = 0;
        let tilesLoaded = 0;

        // if we have no frames, we are not loaded
        if (this._bufferList.size > 0) {
            // start from the current frame and check the buffer going forward
            // let iter = this._currentFrame - 1;
            let iter = this._currentFrame;
            let bufferLimit = this.getBufferLimit();
            for (let i = 0; i < bufferLimit; ++i) {
                // handle wrap around
                if (iter >= this._bufferList.size) {
                    iter = 0;
                } else if (iter < 0) {
                    iter = this._bufferList.size - 1;
                }

                // check if the frame is loaded
                let frameStatus = this.getFrameStatus(iter);
                if (frameStatus.isLoaded) {
                    framesLoaded++;
                }
                tilesTotal += frameStatus.tilesTotal;
                tilesLoaded += frameStatus.tilesLoaded;
                framesTotal++;
                iter++;
            }
        }
        return {
            isLoaded: framesTotal === framesLoaded && framesTotal > 0,
            framesTotal,
            framesLoaded,
            tilesTotal,
            tilesLoaded
        };
    }

    getFrameStatus(frame) {
        let layersTotal = 0;
        let layersLoaded = 0;
        let tilesTotal = 0;
        let tilesLoaded = 0;
        // check the index is in range
        if (this._bufferList.get(frame)) {
            // check all layers in the frame
            this._bufferList.getIn([frame, "layers"]).forEach(layerEntry => {
                // check the object is there and get the load status
                let mapLayer = layerEntry.get("mapLayer");
                if (typeof mapLayer !== "undefined" && mapLayer) {
                    let status = this._checkLayerStatus(mapLayer);
                    if (status.isLoaded) {
                        layersLoaded++;
                        this._handleBufferLayerComplete(mapLayer);
                    }
                    tilesTotal += status.tilesTotal;
                    tilesLoaded += status.tilesLoaded;
                }
                layersTotal++;
            });
        }
        return {
            // isLoaded: layersTotal === layersLoaded && layersTotal > 0,
            isLoaded: layersTotal === layersLoaded,
            layersTotal,
            layersLoaded,
            tilesTotal,
            tilesLoaded
        };
    }

    getCurrentFrameStatus() {
        return this.getFrameStatus(this._currentFrame);
    }

    getNextFrameStatus() {
        let nextFrame = this._currentFrame + 1;
        if (nextFrame >= this._bufferList.size) {
            nextFrame = 0;
        }
        return this.getFrameStatus(nextFrame);
    }

    getPreviousFrameStatus() {
        let prevFrame = this._currentFrame - 1;
        if (prevFrame < 0) {
            prevFrame = this._bufferList.size - 1;
        }

        // return this.getFrameStatus(prevFrame);
        return this.getFrameStatus(this._currentFrame);
    }

    clear() {
        // clear the backing list
        this._bufferList = this._bufferList.clear();
        // reset the current frame
        this._currentFrame = -1;
        // reset the number of layers
        this._layersPerFrame = 0;
    }

    getCurrentFrame() {
        return this._bufferList.get(this._currentFrame);
    }

    getNextFrame() {
        let nextFrame = this._currentFrame + 1;
        if (nextFrame >= this._bufferList.size) {
            nextFrame = 0;
        }
        this._currentFrame = nextFrame;

        this.bufferLayers();

        return this._bufferList.get(this._currentFrame);
    }

    getPreviousFrame() {
        let prevFrame = this._currentFrame - 1;
        if (prevFrame < 0) {
            prevFrame = this._bufferList.size - 1;
        }
        this._currentFrame = prevFrame;

        this.bufferLayers();

        return this._bufferList.get(this._currentFrame);
    }

    getMapLayers() {
        // get a list of all the buffered map layers
        return this._bufferList.reduce((acc1, frame) => {
            let mapLayers = frame.get("layers").reduce((acc2, layerEntry) => {
                if (layerEntry.get("mapLayer")) {
                    return acc2.push(layerEntry.get("mapLayer"));
                }
                return acc2;
            }, Immutable.List());
            return acc1.concat(mapLayers);
        }, Immutable.List());
    }

    getBufferLimit() {
        let maxBuffer = this._bufferList.size * this._layersPerFrame;
        if (maxBuffer < this._bufferLimit) {
            return this._bufferList.size;
        }

        return Math.max(Math.floor(this._bufferLimit / this._layersPerFrame), this._bufferMin);
    }
}
