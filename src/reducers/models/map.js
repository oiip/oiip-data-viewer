/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";
import moment from "moment";
import appConfig from "constants/appConfig";
import { mapState as mapStateCore, layerModel as layerModelCore } from "_core/reducers/models/map";

export const mapState = mapStateCore.mergeDeep(
    Immutable.fromJS({
        dateIntervalScale: "day",
        dateIntervalSize: 1,
        intervalDate: moment
            .utc(appConfig.DEFAULT_DATE)
            .subtract(1, "day")
            .toDate(),
        layers: {
            insitu_data: {},
            insitu_data_error: {},
            data_reference: {}
        },
        insituLayerTitleField: "platform",
        view: {
            pixelHoverCoordinate: {
                data: [],
                showData: true
            },
            refHoverData: []
        },
        areaSelection: {
            isAreaSelectionEnabled: false,
            geometryType: ""
        },
        animation: {
            isOpen: false, // true if widget should be open, false otherwise
            isCollapsed: false, // true if the widget should be collapsed, false otherwise
            isPlaying: false, // true if animation is playing, false otherwise
            initiated: false, // true if buffering has begin, false otherwise
            bufferLoaded: false, // true if the buffer is loaded, false otherwise
            bufferFramesTotal: 0, // number of frames in the buffer
            bufferFramesLoaded: 0, // number of frames loaded in the buffer
            bufferTilesTotal: 0, // number of tiles in the buffer
            bufferTilesLoaded: 0, // number of tiles loaded in the buffer
            initialBufferLoaded: false, // true if the buffer has loaded at least once, false otherwise
            nextFrameLoaded: false, // true if the next frame is loaded, false otherwise
            previousFrameLoaded: false, // true if the previous frame is loaded, false otherwise
            speed: appConfig.DEFAULT_ANIMAITON_SPEED, // ms delay between frames
            startDate: moment
                .utc(appConfig.DEFAULT_DATE)
                .subtract(1, "week")
                .toDate(), // date to begin animation
            endDate: appConfig.DEFAULT_DATE // date to end animation
        }
    })
);

export const layerModel = layerModelCore.mergeDeep(
    Immutable.fromJS({
        insituMeta: {},
        isLoading: false,
        isErrorActive: false,
        vectorColor: appConfig.INSITU_VECTOR_COLORS[0]
    })
);
