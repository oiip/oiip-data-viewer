/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

export const WORKER_TASK_RETRIEVE_DATA = "WORKER_TASK_RETRIEVE_DATA";
export const WORKER_TASK_DECIMATE_POINTS_LTTB = "WORKER_TASK_DECIMATE_POINTS_LTTB";
export const WORKER_TASK_CLEAR_CACHE_ENTRY = "WORKER_TASK_CLEAR_CACHE_ENTRY";

export const PLOT_STYLES = {
    TIME_SERIES: {
        LINES_AND_DOTS: "line",
        DOTS: "scatter",
        BARS: "column"
    }
};

export const CHART_TYPES = {
    SINGLE_SERIES: "SINGLE_SERIES",
    SINGLE_SERIES_WITH_COLOR: "SINGLE_SERIES_WITH_COLOR",
    MULTI_SERIES: "MULTI_SERIES",
    MULTI_SERIES_WITH_COLOR: "MULTI_SERIES_WITH_COLOR"
};

export const LAYER_GROUP_TYPE_INSITU_DATA = "insitu_data";
export const LAYER_GROUP_TYPE_INSITU_DATA_ERROR = "insitu_data_error";
export const LAYER_GROUP_TYPE_DATA_REFERENCE = "data_reference";

export const LAYER_VECTOR_POINT_TRACK = "vector_point_track";
export const LAYER_VECTOR_TILE_TRACK = "vector_tile_track";
export const LAYER_VECTOR_TILE_TRACK_ERROR = "vector_tile_track_error";
export const LAYER_VECTOR_TILE_POINTS = "vector_tile_points";
export const LAYER_MULTI_FILE_VECTOR_KML = "multi_file_vector_kml";
export const LAYER_VECTOR_TILE_OUTLINE = "vector_tile_outline";
export const VECTOR_FEATURE_LOAD = "vector_feature_load";

export const CURRENTS_VECTOR_COLOR = "oscar_l4_oc_third_deg___oceancurrent_dir_color";
export const CURRENTS_VECTOR_BLACK = "oscar_l4_oc_third_deg___oceancurrent_dir_black";

export const NO_DATA = "No Data";

export const INTERACTION_AREA_SELECTION = "SelectArea";
export const INTERACTION_AREA_DISPLAY = "DisplayArea";
export const GEOMETRY_BOX = "Box";

export const ALERTS = {
    FILL_BUFFER_FAILED: {
        title: "Buffering Animation Failed",
        formatString: "The {MAP} map failed to buffer one or more animation frames.",
        severity: 2
    },
    CLEAR_BUFFER_FAILED: {
        title: "Clearing Animation Buffer Failed",
        formatString: "The {MAP} map failed to clear the animation buffer.",
        severity: 2
    },
    NO_ANIMATION_LAYERS: {
        title: "Could Not Load Animation",
        formatString: "There are no layers active on the map that can be animated.",
        severity: 1
    },
    NON_ANIMATION_LAYER: {
        title: "Could Not Animate Layer",
        formatString:
            "{LAYER} cannot be animated. It has been hidden until the animation is stopped.",
        severity: 1
    },
    ANIMATION_NO_LAYER_TOGGLE: {
        title: "Animation Stopped",
        formatString:
            "The animation has been stopped due to a layer activation toggle. Press the play button to reload the animation with the new layer selections.",
        severity: 1
    },
    ANIMATION_BAD_DATE: {
        title: "Animation Date Range Error",
        formatString: "Could not set the animation {STARTEND} date.",
        severity: 2
    },
    EXCESSIVE_LAYERS: {
        title: "High Active Layer Count",
        formatString:
            "Activating more than {NUM_LAYERS} layers can cause application performance to degrade in display responsiveness, animation, and resource usage.",
        severity: 1
    },
    NO_STEP_FRAMES: {
        title: "Step Size Too Large",
        formatString:
            "The step size is too large for the selected date range. Please select either a smaller step size or a wider date range.",
        severity: 2
    },
    ANIMATION_NO_CHANGE_STEP: {
        title: "Animation Stopped",
        formatString:
            "The animation has been stopped due to a change in selected step size. Press the play button to reload the animation with the new step size.",
        severity: 2
    },
    UNSUPPORTED_BROWSER: {
        title: "Unsupported Browser",
        formatString:
            "This browser is not supported. Please use a recent version of Google Chrome, Mozilla Firefox, or Apple Safari.",
        severity: 4
    }
};
