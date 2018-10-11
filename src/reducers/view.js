/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import * as actionTypes from "constants/actionTypes";
import { viewState } from "reducers/models/view";
import viewCore from "_core/reducers/view";
import ViewReducer from "reducers/reducerFunctions/ViewReducer";

export default function view(state = viewState, action, opt_reducer = ViewReducer) {
    switch (action.type) {
        case actionTypes.SET_MAIN_MENU_TAB_INDEX:
            return opt_reducer.setMainMenuTabIndex(state, action);

        case actionTypes.SET_MAIN_MENU_OPEN:
            return opt_reducer.setMainMenuOpen(state, action);

        case actionTypes.SET_SEARCH_DATE_RANGE:
            return opt_reducer.setSearchDateRange(state, action);

        case actionTypes.SET_SEARCH_SELECTED_AREA:
            return opt_reducer.setSearchSelectedArea(state, action);

        case actionTypes.SET_SEARCH_LOADING:
            return opt_reducer.setSearchLoading(state, action);

        case actionTypes.SET_SEARCH_RESULTS:
            return opt_reducer.setSearchResults(state, action);

        case actionTypes.SET_TRACK_SELECTED:
            return opt_reducer.setTrackSelected(state, action);

        case actionTypes.SET_LAYER_INFO:
            return opt_reducer.setLayerInfo(state, action);

        case actionTypes.SET_SEARCH_FACETS:
            return opt_reducer.setSearchFacets(state, action);

        case actionTypes.SET_SEARCH_FACET_SELECTED:
            return opt_reducer.setSearchFacetSelected(state, action);

        case actionTypes.SET_SEARCH_SORT_PARAM:
            return opt_reducer.setSearchSortParameter(state, action);

        case actionTypes.CLEAR_SEARCH_FACET:
            return opt_reducer.clearSearchFacet(state, action);

        default:
            return viewCore.call(this, state, action, opt_reducer);
    }
}
