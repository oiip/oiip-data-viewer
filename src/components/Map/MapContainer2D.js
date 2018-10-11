/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import PropTypes from "prop-types";
import Immutable from "immutable";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { MapContainer2D as MapContainer2DCore } from "_core/components/Map/MapContainer2D.js";
import * as mapActions from "actions/mapActions";
import * as mapActionsCore from "_core/actions/mapActions";
import * as chartActions from "actions/chartActions";
import * as appStrings from "constants/appStrings";
import * as appStringsCore from "_core/constants/appStrings";

export class MapContainer2D extends MapContainer2DCore {
    constructor(props) {
        super(props);

        // this.drawTimeout = undefined;
    }

    initializeMapListeners() {
        MapContainer2DCore.prototype.initializeMapListeners.call(this);

        let map = this.props.maps.get(appStringsCore.MAP_LIB_2D);
        if (typeof map !== "undefined") {
            // area selection listeners
            map.addDrawHandler(
                appStrings.GEOMETRY_BOX,
                geometry => this.handleAreaSelectionEnd(geometry, appStrings.GEOMETRY_BOX),
                appStrings.INTERACTION_AREA_SELECTION
            );

            // add layer load callback
            map.setLayerLoadCallback(layer => {
                this.props.setLayerLoading(layer.get("id"), false);
            });
        } else {
            console.error("Cannot initialize event listeners: 2D MAP NOT AVAILABLE");
        }
    }

    handleAreaSelectionEnd(geometry, shapeType) {
        // Disable area selection
        this.props.disableAreaSelection();
        // Add geometry to other maps
        this.props.mapActions.addGeometryToMap(
            geometry,
            appStrings.INTERACTION_AREA_SELECTION,
            false
        );
        // Update the selected area in state
        this.props.setSelectedArea(geometry.coordinates, shapeType);

        // if (typeof this.drawTimeout !== "undefined") {
        //     clearTimeout(this.drawTimeout);
        //     this.drawTimeout = undefined;
        // }

        // this.drawTimeout = setTimeout(() => {
        //     // Disable area selection
        //     this.props.disableAreaSelection();
        //     // Add geometry to other maps
        //     this.props.mapActions.addGeometryToMap(
        //         geometry,
        //         appStrings.INTERACTION_AREA_SELECTION,
        //         false
        //     );
        //     // Update the selected area in state
        //     this.props.setSelectedArea(geometry.coordinates, shapeType);

        //     clearTimeout(this.drawTimeout);
        //     this.drawTimeout = undefined;
        // }, 250);
    }

    handlePixelClick(map, clickEvt) {
        MapContainer2DCore.prototype.handlePixelClick.call(this, map, clickEvt);

        this.props.updateDateLinkedCharts();
    }
}

MapContainer2D.propTypes = Immutable.Map(MapContainer2DCore.propTypes)
    .merge({
        disableAreaSelection: PropTypes.func.isRequired,
        setSelectedArea: PropTypes.func.isRequired,
        setLayerLoading: PropTypes.func.isRequired,
        updateDateLinkedCharts: PropTypes.func.isRequired
    })
    .toJS();

function mapStateToProps(state) {
    return {
        maps: state.map.get("maps"),
        units: state.map.getIn(["displaySettings", "selectedScaleUnits"]),
        in3DMode: state.map.getIn(["view", "in3DMode"]),
        initialLoadComplete: state.view.get("initialLoadComplete")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        mapActions: bindActionCreators(mapActionsCore, dispatch),
        disableAreaSelection: bindActionCreators(mapActions.disableAreaSelection, dispatch),
        setSelectedArea: bindActionCreators(mapActions.setSelectedArea, dispatch),
        setLayerLoading: bindActionCreators(mapActions.setLayerLoading, dispatch),
        updateDateLinkedCharts: bindActionCreators(chartActions.updateDateLinkedCharts, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MapContainer2D);
