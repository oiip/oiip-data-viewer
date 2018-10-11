/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import * as actionTypes from "constants/actionTypes";
import { mapState } from "reducers/models/map";
import mapCore from "_core/reducers/map";
import MapReducer from "reducers/reducerFunctions/MapReducer";

export default function map(state = mapState, action, opt_reducer = MapReducer) {
    switch (action.type) {
        case actionTypes.ADD_LAYER:
            return opt_reducer.addLayer(state, action);

        case actionTypes.REMOVE_LAYER:
            return opt_reducer.removeLayer(state, action);

        case actionTypes.SET_LAYER_LOADING:
            return opt_reducer.setLayerLoading(state, action);

        case actionTypes.SET_INSITU_LAYER_COLOR:
            return opt_reducer.setInsituVectorLayerColor(state, action);

        case actionTypes.ZOOM_TO_LAYER:
            return opt_reducer.zoomToLayer(state, action);

        case actionTypes.ENABLE_AREA_SELECTION:
            return opt_reducer.enableAreaSelection(state, action);

        case actionTypes.DISABLE_AREA_SELECTION:
            return opt_reducer.disableAreaSelection(state, action);

        case actionTypes.REMOVE_ALL_AREA_SELECTIONS:
            return opt_reducer.removeAllAreaSelections(state, action);

        case actionTypes.SET_TRACK_ERROR_ACTIVE:
            return opt_reducer.setTrackErrorActive(state, action);

        case actionTypes.SET_DATE_INTERVAL:
            return opt_reducer.setDateInterval(state, action);

        case actionTypes.SET_ANIMATION_OPEN:
            return opt_reducer.setAnimationOpen(state, action);

        case actionTypes.SET_ANIMATION_PLAYING:
            return opt_reducer.setAnimationPlaying(state, action);

        case actionTypes.STOP_ANIMATION:
            return opt_reducer.stopAnimation(state, action);

        case actionTypes.STEP_ANIMATION:
            return opt_reducer.stepAnimation(state, action);

        case actionTypes.SET_ANIMATION_START_DATE:
            return opt_reducer.setAnimationStartDate(state, action);

        case actionTypes.SET_ANIMATION_END_DATE:
            return opt_reducer.setAnimationEndDate(state, action);

        case actionTypes.SET_ANIMATION_DATE_RANGE:
            return opt_reducer.setAnimationDateRange(state, action);

        case actionTypes.FILL_ANIMATION_BUFFER:
            return opt_reducer.fillAnimationBuffer(state, action);

        case actionTypes.EMPTY_ANIMATION_BUFFER:
            return opt_reducer.emptyAnimationBuffer(state, action);

        case actionTypes.CHECK_ANIMATION_BUFFER:
            return opt_reducer.checkAnimationBuffer(state, action);

        case actionTypes.CHECK_INITIAL_ANIMATION_BUFFER:
            return opt_reducer.checkInitialAnimationBuffer(state, action);

        case actionTypes.CHECK_NEXT_FRAME:
            return opt_reducer.checkNextAnimationFrame(state, action);

        case actionTypes.SET_ANIMATION_SPEED:
            return opt_reducer.setAnimationSpeed(state, action);

        case actionTypes.SET_INSITU_LAYER_TITLES:
            return opt_reducer.setInsituLayerTitles(state, action);

        default:
            return mapCore.call(this, state, action, opt_reducer);
    }
}
