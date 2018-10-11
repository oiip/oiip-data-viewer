/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";
import moment from "moment";
import appConfig from "constants/appConfig";
import ViewReducerCore from "_core/reducers/reducerFunctions/ViewReducer";
import { trackModel } from "reducers/models/view";
import SearchUtil from "utils/SearchUtil";

//IMPORTANT: Note that with Redux, state should NEVER be changed.
//State is considered immutable. Instead,
//create a copy of the state passed and set new values on the copy.

export default class ViewReducer extends ViewReducerCore {
    static setMainMenuTabIndex(state, action) {
        return state.set("mainMenuTabIndex", action.tabIndex);
    }

    static setMainMenuOpen(state, action) {
        return state.set("isMainMenuOpen", action.isOpen);
    }

    static setSearchDateRange(state, action) {
        return state
            .setIn(["layerSearch", "formOptions", "startDate"], action.startDate)
            .setIn(["layerSearch", "formOptions", "endDate"], action.endDate);
    }

    static setSearchSelectedArea(state, action) {
        return state.setIn(
            ["layerSearch", "formOptions", "selectedArea"],
            Immutable.List(action.selectedArea)
        );
    }

    static setSearchLoading(state, action) {
        return state.setIn(["layerSearch", "searchResults", "isLoading"], action.isLoading);
    }

    static setSearchResults(state, action) {
        let results = action.results.reduce((acc, entry) => {
            let track = trackModel.mergeDeep(entry);
            return acc.set(track.get("id"), track);
        }, Immutable.OrderedMap());

        return state.setIn(["layerSearch", "searchResults", "results"], results);
    }

    static setSearchFacets(state, action) {
        let facets = appConfig.LAYER_SEARCH.FACETS;
        for (let i = 0; i < facets.length; ++i) {
            let values = action.facets.get(facets[i].value);

            state = state.setIn(
                ["layerSearch", "formOptions", "searchFacets", facets[i].value],
                values.sortBy(entry => entry.get("label"))
            );
        }

        return state;
    }

    static setTrackSelected(state, action) {
        let selected = state.getIn(["layerSearch", "selectedTracks"]);
        if (action.isSelected) {
            selected = selected.add(action.trackId);
        } else {
            selected = selected.delete(action.trackId);
        }
        return state.setIn(["layerSearch", "selectedTracks"], selected);
    }

    static setSearchFacetSelected(state, action) {
        if (typeof action.facet !== "undefined") {
            let facet = action.facet;
            let path = ["layerSearch", "formOptions", "selectedFacets", facet.group];
            let set = state.getIn(path);
            if (action.isSelected) {
                return state.setIn(path, set.add(facet.value));
            } else {
                return state.setIn(path, set.delete(facet.value));
            }
        }
        return state;
    }

    static setSearchSortParameter(state, action) {
        if (typeof action.param !== "undefined") {
            return state.setIn(["layerSearch", "sortParameter"], action.param);
        }
        return state;
    }

    static clearSearchFacet(state, action) {
        if (typeof action.facetGroup !== "undefined") {
            return state.setIn(
                ["layerSearch", "formOptions", "selectedFacets", action.facetGroup],
                Immutable.Set()
            );
        } else {
            let facets = appConfig.LAYER_SEARCH.FACETS;
            for (let i = 0; i < facets.length; ++i) {
                state = state.setIn(
                    ["layerSearch", "formOptions", "selectedFacets", facets[i].value],
                    Immutable.Set()
                );
            }
            return state;
        }
    }

    static resetApplicationState(state, action) {
        state = this.setMainMenutabIndex(state, { tabIndex: 0 });
        state = this.setMainMenuOpen(state, { isOpen: true });
        state = this.setSearchDateRange(state, {
            startDate: moment.utc(appConfig.DEFAULT_DATE).subtract(2, "months").toDate,
            endDate: appConfig.DEFAULT_DATE
        });

        return ViewReducerCore.resetApplicationState(state, action);
    }

    static setLayerInfo(state, action) {
        return state.set("layerInfo", action.layer);
    }
}
