/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import EarthIcon from "@material-ui/icons/Public";
import CloseIcon from "@material-ui/icons/Close";
import { SearchInput, AreaSelectionForm } from "components/Reusables";
import * as appStrings from "constants/appStrings";
import * as appStringsCore from "_core/constants/appStrings";
import * as mapActions from "actions/mapActions";
import * as mapActionsCore from "_core/actions/mapActions";
import appConfig from "constants/appConfig";
import MiscUtil from "utils/MiscUtil";

export class AreaSelectionInput extends Component {
    constructor(props) {
        super(props);

        this.popoverOpen = false;
    }

    handleOpen(update = true) {
        this.popoverOpen = true;
        if (update) {
            this.forceUpdate();
        }
    }

    handleClose(update = true) {
        this.popoverOpen = false;
        if (update) {
            this.forceUpdate();
        }
    }

    submitArea(area) {
        this.handleClose(false);

        this.props.setSelectedArea(area, appStrings.GEOMETRY_BOX);

        this.props.addGeometryToMap(
            {
                type: appStrings.GEOMETRY_BOX,
                id: "area-selection_" + Math.random(),
                proj: appConfig.DEFAULT_PROJECTION,
                coordinates: area,
                coordinateType: appStringsCore.COORDINATE_TYPE_CARTOGRAPHIC
            },
            appStrings.INTERACTION_AREA_SELECTION,
            false
        );
    }

    render() {
        let containerClasses = MiscUtil.generateStringFromSet({
            [this.props.className]: typeof this.props.className !== "undefined"
        });

        let label =
            typeof this.props.selectedArea !== "undefined" && this.props.selectedArea.size > 0
                ? this.props.selectedArea.join(", ")
                : "Select Area";
        return (
            <SearchInput
                label={label}
                placeholder="placeholder"
                className={containerClasses}
                open={this.popoverOpen}
                onOpen={() => this.handleOpen()}
                onClose={() => this.handleClose()}
                leftAction={{
                    icon: <EarthIcon />
                }}
                rightAction={[
                    {
                        icon: <CloseIcon />,
                        onClick: () => this.submitArea([])
                    }
                ]}
            >
                <AreaSelectionForm
                    selectedArea={this.props.selectedArea}
                    onSubmit={area => this.submitArea(area)}
                    onDraw={() => this.handleClose()}
                />
            </SearchInput>
        );
    }
}

AreaSelectionInput.propTypes = {
    selectedArea: PropTypes.object,
    onSelect: PropTypes.func,
    onClear: PropTypes.func,
    className: PropTypes.string,
    addGeometryToMap: PropTypes.func.isRequired,
    setSelectedArea: PropTypes.func.isRequired
};

function mapDisatchToProps(dispatch) {
    return {
        addGeometryToMap: bindActionCreators(mapActionsCore.addGeometryToMap, dispatch),
        setSelectedArea: bindActionCreators(mapActions.setSelectedArea, dispatch)
    };
}

export default connect(null, mapDisatchToProps)(AreaSelectionInput);
