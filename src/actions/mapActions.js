/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";
import moment from "moment";
import * as types from "constants/actionTypes";
import * as typesCore from "_core/constants/actionTypes";
import * as appActions from "actions/appActions";
import * as chartActions from "actions/chartActions";
import * as mapActionsCore from "_core/actions/mapActions";

export function addLayer(layer, setActive = true) {
    return { type: types.ADD_LAYER, layer, setActive };
}

export function removeLayer(layer) {
    return { type: types.REMOVE_LAYER, layer };
}

export function setLayerLoading(layer, isLoading) {
    return { type: types.SET_LAYER_LOADING, layer, isLoading };
}

export function setInsituLayerColor(layer, color) {
    return { type: types.SET_INSITU_LAYER_COLOR, layer, color };
}

export function zoomToLayer(layer) {
    return (dispatch, getState) => {
        let state = getState();
        let pad = state.view.get("isMainMenuOpen");
        dispatch({ type: types.ZOOM_TO_LAYER, layer, pad });
    };
}

export function enableAreaSelection(geometryType) {
    return { type: types.ENABLE_AREA_SELECTION, geometryType };
}

export function disableAreaSelection() {
    return { type: types.DISABLE_AREA_SELECTION };
}

export function removeAllAreaSelections() {
    return { type: types.REMOVE_ALL_AREA_SELECTIONS };
}

export function removeGeometryFromMap(geometry, interactionType) {
    return { type: types.REMOVE_GEOMETRY_FROM_MAP, geometry, interactionType };
}

export function setSelectedArea(area, geometryType) {
    return dispatch => {
        dispatch(appActions.setSearchSelectedArea(area, geometryType));
    };
}

export function setDate(date) {
    return dispatch => {
        dispatch({ type: typesCore.SET_MAP_DATE, date });

        dispatch(chartActions.updateDateLinkedCharts());
    };
}

export function stepDate(forward) {
    return (dispatch, getState) => {
        let state = getState();
        let size = state.map.get("dateIntervalSize");
        let scale = state.map.get("dateIntervalScale");
        let date = moment.utc(state.map.get("date"));

        let nextDate = (forward ? date.add(size, scale) : date.subtract(size, scale)).toDate();

        dispatch(setDate(nextDate));
    };
}

export function setDateInterval(size, scale) {
    return dispatch => {
        dispatch({ type: types.SET_DATE_INTERVAL, size, scale });

        dispatch(chartActions.updateDateLinkedCharts());
    };
}

// set the animation component open or closed
export function setAnimationOpen(isOpen, updateRange = true) {
    return { type: types.SET_ANIMATION_OPEN, isOpen, updateRange };
}

// play or pause the animation
export function setAnimationPlaying(isPlaying) {
    return { type: types.SET_ANIMATION_PLAYING, isPlaying };
}

// stop playing, clear the buffer, reset the current date, etc
export function stopAnimation() {
    return { type: types.STOP_ANIMATION };
}

// step the animation forward or backward one frame
export function stepAnimation(forward) {
    return { type: types.STEP_ANIMATION, forward };
}

// set the start date for the animation
export function setAnimationStartDate(date) {
    return { type: types.SET_ANIMATION_START_DATE, date };
}

// set the end date of the animation
export function setAnimationEndDate(date) {
    return { type: types.SET_ANIMATION_END_DATE, date };
}

// set the date range of the animation
export function setAnimationDateRange(startDate, endDate) {
    return { type: types.SET_ANIMATION_DATE_RANGE, startDate, endDate };
}

// initialize and begin filling the animation buffer
export function fillAnimationBuffer(startDate, endDate, stepResolution, callback) {
    return { type: types.FILL_ANIMATION_BUFFER, startDate, endDate, stepResolution, callback };
}

// clear the animation buffer
export function emptyAnimationBuffer() {
    return { type: types.EMPTY_ANIMATION_BUFFER };
}

// check if the animation buffer is filled
export function checkBuffer() {
    return { type: types.CHECK_ANIMATION_BUFFER };
}

// check if the animation buffer is filled for the first time
export function checkInitialBuffer() {
    return { type: types.CHECK_INITIAL_ANIMATION_BUFFER };
}

// check if the next frame is loaded
export function checkNextFrame() {
    return { type: types.CHECK_NEXT_FRAME };
}

// update the delay between animation frames
export function setAnimationSpeed(speed) {
    return { type: types.SET_ANIMATION_SPEED, speed };
}

// update the step size between animation frames
export function setAnimationStepSize(stepSize) {
    return { type: types.SET_ANIMATION_STEP_SIZE, stepSize };
}

export function setAnimationExportOpen(isOpen) {
    return { type: types.SET_ANIMATION_EXPORT_OPEN, isOpen };
}

export function setAnimationExportSelectedArea(area, allowEmpty = false) {
    return { type: types.SET_ANIMATION_EXPORT_SELECTED_AREA, area: Immutable.List(area) };
}

export function setAnimationExportFileFormat(format) {
    return { type: types.SET_ANIMATION_EXPORT_FILE_FORMAT, format };
}

export function setAnimationExportResolution(resolution) {
    return { type: types.SET_ANIMATION_EXPORT_RESOLUTION, resolution };
}

export function setInsituLayerTitles(titleField) {
    return { type: types.SET_INSITU_LAYER_TITLES, titleField };
}
