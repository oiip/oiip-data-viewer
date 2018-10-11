/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";
import * as types from "constants/actionTypes";
import * as mapActions from "actions/mapActions";
import * as chartActions from "actions/chartActions";
import * as appStrings from "constants/appStrings";
import * as appStringsCore from "_core/constants/appStrings";
import MapUtil from "utils/MapUtil";
import SearchUtil from "utils/SearchUtil";
import GeoServerUtil from "utils/GeoServerUtil";
import shouldUpdate from "recompose/shouldUpdate";

export function setMainMenuTabIndex(tabIndex) {
    return { type: types.SET_MAIN_MENU_TAB_INDEX, tabIndex };
}

export function setMainMenuOpen(isOpen) {
    return { type: types.SET_MAIN_MENU_OPEN, isOpen };
}

export function setSearchDateRange(startDate, endDate) {
    return { type: types.SET_SEARCH_DATE_RANGE, startDate, endDate };
}

export function setSearchSelectedArea(selectedArea, geometryType) {
    return { type: types.SET_SEARCH_SELECTED_AREA, selectedArea, geometryType };
}

export function setSearchLoading(isLoading) {
    return { type: types.SET_SEARCH_LOADING, isLoading };
}

export function setSearchResults(results) {
    return { type: types.SET_SEARCH_RESULTS, results };
}

export function setSearchFacets(facets) {
    return { type: types.SET_SEARCH_FACETS, facets };
}

export function setSearchFacetSelected(facet, isSelected, shouldUpdateFacets = false) {
    // return { type: types.SET_SEARCH_FACET_SELECTED, facet, isSelected };

    return (dispatch, getState) => {
        dispatch({ type: types.SET_SEARCH_FACET_SELECTED, facet, isSelected });

        if (shouldUpdateFacets === true) {
            updateFacets(dispatch, getState);
        }
    };
}

export function clearSearchFacet(facetGroup) {
    return { type: types.CLEAR_SEARCH_FACET, facetGroup };
}

export function setTrackSelected(trackId, isSelected) {
    return (dispatch, getState) => {
        dispatch({ type: types.SET_TRACK_SELECTED, trackId, isSelected });
        if (isSelected) {
            let state = getState();
            let track = state.view.getIn(["layerSearch", "searchResults", "results", trackId]);
            let titleField = state.map.get("insituLayerTitleField");
            dispatch(
                mapActions.addLayer({
                    id: track.get("id"),
                    title: track.getIn(["insituMeta", titleField]),
                    type: appStrings.LAYER_GROUP_TYPE_INSITU_DATA,
                    handleAs: appStrings.LAYER_VECTOR_POINT_TRACK,
                    url: GeoServerUtil.getUrlForTrack(track),
                    wmtsOptions: {
                        extents: MapUtil.constrainExtent([
                            track.getIn(["insituMeta", "lon_min"]),
                            track.getIn(["insituMeta", "lat_min"]),
                            track.getIn(["insituMeta", "lon_max"]),
                            track.getIn(["insituMeta", "lat_max"])
                        ])
                    },
                    insituMeta: track.get("insituMeta"),
                    timeFormat: "YYYY-MM-DDTHH:mm:ssZ"
                })
            );
        } else {
            dispatch(
                mapActions.removeLayer(
                    Immutable.Map({
                        id: trackId + "_error",
                        type: appStrings.LAYER_GROUP_TYPE_INSITU_DATA_ERROR
                    })
                )
            );
            dispatch(
                mapActions.removeLayer(
                    Immutable.Map({
                        id: trackId,
                        type: appStrings.LAYER_GROUP_TYPE_INSITU_DATA
                    })
                )
            );
            dispatch(chartActions.setTrackSelected(trackId, isSelected));
        }
    };
}

export function setTrackErrorActive(trackId, isActive) {
    return (dispatch, getState) => {
        if (isActive) {
            let state = getState();
            let track = state.map.getIn([
                "layers",
                appStrings.LAYER_GROUP_TYPE_INSITU_DATA,
                trackId
            ]);
            let errTrackId =
                "oiip:err_poly_" +
                track.getIn(["insituMeta", "project"]) +
                "_" +
                track.getIn(["insituMeta", "source_id"]);
            let errTrackPartial = state.map
                .getIn(["layers", appStringsCore.LAYER_GROUP_TYPE_PARTIAL])
                .find(layer => layer.get("id") === errTrackId);
            if (typeof errTrackPartial !== "undefined") {
                dispatch(
                    mapActions.addLayer({
                        id: track.get("id") + "_error",
                        title: track.get("title") + " - Error",
                        type: appStrings.LAYER_GROUP_TYPE_INSITU_DATA_ERROR,
                        handleAs: appStrings.LAYER_VECTOR_TILE_TRACK_ERROR,
                        url: GeoServerUtil.getUrlForTrackError(track, errTrackId),
                        insituMeta: track.get("insituMeta"),
                        updateParameters: { time: false },
                        wmtsOptions: {
                            extents: track.getIn(["wmtsOptions", "extents"]).toJS(),
                            tileGrid: errTrackPartial.getIn(["wmtsOptions", "tileGrid"]).toJS()
                        },
                        timeFormat: "YYYY-MM-DDTHH:mm:ssZ"
                    })
                );
            }
        } else {
            dispatch(
                mapActions.removeLayer(
                    Immutable.Map({
                        id: trackId + "_error",
                        type: appStrings.LAYER_GROUP_TYPE_INSITU_DATA_ERROR
                    })
                )
            );
        }
        dispatch({ type: types.SET_TRACK_ERROR_ACTIVE, layer: trackId, isActive });
    };
}

export function runLayerSearch() {
    return (dispatch, getState) => {
        let state = getState();
        let searchParams = state.view.getIn(["layerSearch", "formOptions"]);

        dispatch(setSearchLoading(true));

        let options = {
            area: searchParams.get("selectedArea").toJS(),
            dateRange: [searchParams.get("startDate"), searchParams.get("endDate")],
            facets: searchParams.get("selectedFacets").toJS()
        };

        SearchUtil.searchForTracks(options).then(
            results => {
                dispatch(setSearchResults(results));
                dispatch(setSearchLoading(false));
            },
            err => {
                console.warn("Track search fail: ", err);
                dispatch(setSearchLoading(false));
            }
        );

        updateFacets(dispatch, getState);
    };
}

export function setLayerInfo(layer = undefined) {
    return { type: types.SET_LAYER_INFO, layer };
}

export function setSearchSortParameter(param) {
    return { type: types.SET_SEARCH_SORT_PARAM, param };
}

export function updateFacets(dispatch, getState) {
    let state = getState();
    let searchParams = state.view.getIn(["layerSearch", "formOptions"]);

    let options = {
        area: searchParams.get("selectedArea").toJS(),
        dateRange: [searchParams.get("startDate"), searchParams.get("endDate")],
        facets: searchParams.get("selectedFacets").toJS()
    };

    SearchUtil.searchForFacets(options).then(
        results => {
            dispatch(setSearchFacets(results));
        },
        err => {
            console.warn("Facet search Fail: ", err);
        }
    );
}
