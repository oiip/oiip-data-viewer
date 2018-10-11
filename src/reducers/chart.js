/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { chartState } from "reducers/models/chart";
import ChartReducer from "reducers/reducerFunctions/ChartReducer";
import * as actionTypes from "constants/actionTypes";

export default function chart(state = chartState, action, opt_reducer = ChartReducer) {
    switch (action.type) {
        case actionTypes.SET_CHART_TRACK_SELECTED:
            return opt_reducer.setTrackSelected(state, action);

        case actionTypes.SET_AXIS_VARIABLE:
            return opt_reducer.setAxisVariable(state, action);

        case actionTypes.INITIALIZE_CHART:
            return opt_reducer.initializeChart(state, action);

        case actionTypes.SET_CHART_DISPLAY_OPTIONS:
            return opt_reducer.setChartDisplayOptions(state, action);

        case actionTypes.CLOSE_CHART:
            return opt_reducer.closeChart(state, action);

        case actionTypes.SET_CHART_FORM_ERROR:
            return opt_reducer.setChartFormError(state, action);

        case actionTypes.UPDATE_CHART_DATA:
            return opt_reducer.updateChartData(state, action);

        case actionTypes.SET_CHART_LOADING:
            return opt_reducer.setChartLoading(state, action);

        case actionTypes.SET_CHART_FORM_VARIABLE_OPTIONS:
            return opt_reducer.setChartFormVariableOptions(state, action);

        case actionTypes.SET_CHART_WARNING:
            return opt_reducer.setChartWarning(state, action);

        default:
            return state;
    }
}
