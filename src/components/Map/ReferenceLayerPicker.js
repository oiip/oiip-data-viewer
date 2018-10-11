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
import Tooltip from "@material-ui/core/Tooltip";
import Grow from "@material-ui/core/Grow";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import MapMarkerIcon from "mdi-material-ui/MapMarker";
import { Manager, Target, Popper } from "react-popper";
import * as appStrings from "constants/appStrings";
import * as mapActionsCore from "_core/actions/mapActions";
import { BaseMapList } from "_core/components/Settings";
import { MapButton } from "_core/components/Reusables";
import MiscUtil from "_core/utils/MiscUtil";
import mapControlsStyles from "_core/components/Map/MapControlsContainer.scss";
import displayStyles from "_core/styles/display.scss";

export class ReferenceLayerPicker extends Component {
    constructor(props) {
        super(props);

        this.popoverOpen = false;
    }

    setPopoverOpen(isOpen) {
        this.popoverOpen = isOpen;
        this.forceUpdate();
    }

    setReferenceLayer(layerId) {
        this.props.referenceLayers.forEach(layer => {
            this.props.mapActionsCore.setLayerActive(layer.get("id"), false);
        });
        if (layerId && layerId !== "") {
            this.props.mapActionsCore.setLayerActive(layerId, true);
        }
    }

    render() {
        // sort and gather the referenceLayers into a set of dropdown options
        let activeReferenceLayerId = "";
        let referenceLayerList = this.props.referenceLayers.sort(
            MiscUtil.getImmutableObjectSort("title")
        );
        let referenceLayerOptions = referenceLayerList.reduce((acc, layer) => {
            if (layer.get("isActive")) {
                activeReferenceLayerId = layer.get("id");
            }

            acc.push({
                value: layer.get("id"),
                label: layer.get("title"),
                thumbnailImage: layer.get("thumbnailImage")
            });
            return acc;
        }, []);
        referenceLayerOptions.push({
            value: "",
            label: "None",
            thumbnailImage: ""
        });

        let containerClasses = MiscUtil.generateStringFromSet({
            [this.props.className]: typeof this.props.className !== "undefined"
        });
        let popperClasses = MiscUtil.generateStringFromSet({
            [displayStyles.noPointer]: !this.popoverOpen
        });
        return (
            <ClickAwayListener
                onClickAway={() => {
                    if (this.popoverOpen) {
                        this.setPopoverOpen(false);
                    }
                }}
            >
                <div className={containerClasses}>
                    <Manager>
                        <Target>
                            <Tooltip
                                disableFocusListener={true}
                                title={"Select Reference Layer"}
                                placement="left"
                            >
                                <MapButton
                                    color={
                                        this.popoverOpen || activeReferenceLayerId !== ""
                                            ? "primary"
                                            : "default"
                                    }
                                    onClick={() => this.setPopoverOpen(!this.popoverOpen)}
                                    aria-label="reference layer selection"
                                    className={mapControlsStyles.lineButton}
                                >
                                    <MapMarkerIcon />
                                </MapButton>
                            </Tooltip>
                        </Target>
                        <Popper
                            placement="right-end"
                            style={{ marginLeft: "5px", zIndex: "3001" }}
                            modifiers={{
                                computeStyle: {
                                    gpuAcceleration: false
                                }
                            }}
                            eventsEnabled={this.popoverOpen}
                            className={popperClasses}
                        >
                            <Grow style={{ transformOrigin: "left bottom" }} in={this.popoverOpen}>
                                <div>
                                    <BaseMapList
                                        value={activeReferenceLayerId}
                                        items={referenceLayerOptions}
                                        onClick={value => this.setReferenceLayer(value)}
                                    />
                                </div>
                            </Grow>
                        </Popper>
                    </Manager>
                </div>
            </ClickAwayListener>
        );
    }
}

ReferenceLayerPicker.propTypes = {
    referenceLayers: PropTypes.object.isRequired,
    mapActionsCore: PropTypes.object.isRequired,
    className: PropTypes.string
};

function mapStateToProps(state) {
    return {
        referenceLayers: state.map.getIn(["layers", appStrings.LAYER_GROUP_TYPE_DATA_REFERENCE])
    };
}

function mapDispatchToProps(dispatch) {
    return {
        mapActionsCore: bindActionCreators(mapActionsCore, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ReferenceLayerPicker);
