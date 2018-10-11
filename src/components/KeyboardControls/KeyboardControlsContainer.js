/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as mapActions from "actions/mapActions";
import * as mapActionsCore from "_core/actions/mapActions";
import * as dateSliderActions from "_core/actions/dateSliderActions";
import { KeyboardControlsContainer as KeyboardControlsContainerCore } from "_core/components/KeyboardControls/KeyboardControlsContainer.js";

export class KeyboardControlsContainer extends KeyboardControlsContainerCore {
    handleKeyUp_Escape() {
        KeyboardControlsContainerCore.prototype.handleKeyUp_Escape.call(this);

        if (this.props.isAreaSelectionEnabled) {
            this.props.disableAreaSelection();
        }
    }

    handleKeyDown_ArrowUp() {
        return undefined;
    }

    handleKeyDown_ArrowDown() {
        return undefined;
    }

    incrementDate(resolution, increment = true) {
        this.props.stepDate(increment);
    }
}

KeyboardControlsContainer.propTypes = {
    maps: PropTypes.object.isRequired,
    mapActions: PropTypes.object.isRequired,
    dateSliderActions: PropTypes.object.isRequired,
    isDrawingEnabled: PropTypes.bool.isRequired,
    isMeasuringEnabled: PropTypes.bool.isRequired,
    isAreaSelectionEnabled: PropTypes.bool.isRequired,
    dateSliderTimeResolution: PropTypes.object.isRequired,
    disableAreaSelection: PropTypes.func.isRequired,
    stepDate: PropTypes.func.isRequired,
    date: PropTypes.object.isRequired
};

function mapStateToProps(state) {
    return {
        maps: state.map.get("maps"),
        date: state.map.get("date"),
        dateSliderTimeResolution: state.dateSlider.get("resolution"),
        isDrawingEnabled: state.map.getIn(["drawing", "isDrawingEnabled"]),
        isMeasuringEnabled: state.map.getIn(["measuring", "isMeasuringEnabled"]),
        isAreaSelectionEnabled: state.map.getIn(["areaSelection", "isAreaSelectionEnabled"])
    };
}

function mapDispatchToProps(dispatch) {
    return {
        mapActions: bindActionCreators(mapActionsCore, dispatch),
        dateSliderActions: bindActionCreators(dateSliderActions, dispatch),
        disableAreaSelection: bindActionCreators(mapActions.disableAreaSelection, dispatch),
        stepDate: bindActionCreators(mapActions.stepDate, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(KeyboardControlsContainer);
