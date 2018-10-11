/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import { Colorbar } from "_core/components/Colorbar";
import { LabelPopover } from "components/Reusables";
import * as mapActionsCore from "_core/actions/mapActions";
import * as appStringsCore from "_core/constants/appStrings";
import * as appStrings from "constants/appStrings";
import MiscUtil from "_core/utils/MiscUtil";
import styles from "components/LayerMenu/SatelliteLayerSelector.scss";
import displayStyles from "_core/styles/display.scss";

export class SatelliteLayerSelector extends Component {
    handleLayerSelect(val) {
        if (val) {
            if (val === appStrings.NO_DATA) {
                let activeLayer = this.props.layers
                    .filter(layer => !layer.get("isDisabled"))
                    .find(layer => {
                        return layer.get("isActive");
                    });
                if (activeLayer) {
                    this.props.mapActionsCore.setLayerActive(activeLayer.get("id"), false);
                }
            } else {
                this.props.mapActionsCore.setLayerActive(val, true);
            }
        }
    }
    renderLayerList(layerList) {
        let activeLayer = false;
        let list = layerList.map(layer => {
            activeLayer = layer.get("isActive") ? layer : activeLayer;
            return (
                <FormControlLabel
                    key={layer.get("id") + "-satellite-select-option"}
                    value={layer.get("id")}
                    control={<Radio color="primary" />}
                    label={layer.get("title")}
                />
            );
        });

        list = list.push(
            <FormControlLabel
                key={"none-satellite-select-option"}
                value={appStrings.NO_DATA}
                control={<Radio color="primary" />}
                label={"None"}
            />
        );

        return (
            <div className={styles.list}>
                <Typography variant="subheading" className={styles.subheader}>
                    Satellite Overlay
                </Typography>
                <FormGroup className={styles.form}>
                    <RadioGroup
                        aria-label="satellite_layer"
                        name="satellite_layer"
                        className={styles.radioGrp}
                        value={activeLayer ? activeLayer.get("id") : appStrings.NO_DATA}
                        onChange={(evt, val) => this.handleLayerSelect(val)}
                        onClick={evt => this.handleLayerSelect(evt.target.value)}
                    >
                        {list}
                    </RadioGroup>
                </FormGroup>
            </div>
        );
    }

    renderColorbar(palette, layer) {
        if (layer) {
            return (
                <Colorbar
                    palette={palette}
                    min={layer.get("min")}
                    max={layer.get("max")}
                    units={layer.get("units")}
                    handleAs={layer.getIn(["palette", "handleAs"])}
                    url={layer.getIn(["palette", "url"])}
                />
            );
        } else {
            return <Colorbar />;
        }
    }

    renderLabel(activeLayer) {
        return (
            <span className={styles.labelContent}>
                {activeLayer ? activeLayer.get("title") : "No overlay selected"}
            </span>
        );
    }

    render() {
        let layerList = this.props.layers
            .filter(layer => !layer.get("isDisabled"))
            .toList()
            .sort(MiscUtil.getImmutableObjectSort("title"));

        let activeLayer = layerList.find(layer => {
            return layer.get("isActive");
        });

        let activePalette = undefined;
        if (typeof activeLayer !== "undefined") {
            activePalette = this.props.palettes.get(activeLayer.getIn(["palette", "name"]));
        }

        let colorbarClasses = MiscUtil.generateStringFromSet({
            [styles.colorbarWrapper]: true,
            [displayStyles.hidden]:
                typeof activeLayer === "undefined" ||
                activeLayer.getIn(["palette", "handleAs"]) === ""
        });

        return (
            <Paper elevation={2} className={styles.root}>
                <LabelPopover
                    label={this.renderLabel(activeLayer)}
                    className={styles.label}
                    contentClass={styles.content}
                >
                    {this.renderLayerList(layerList)}
                </LabelPopover>
                <div className={colorbarClasses}>
                    {this.renderColorbar(activePalette, activeLayer)}
                </div>
            </Paper>
        );
    }
}

SatelliteLayerSelector.propTypes = {
    layers: PropTypes.object.isRequired,
    palettes: PropTypes.object.isRequired,
    mapActionsCore: PropTypes.object.isRequired
};

function mapStateToProps(state) {
    return {
        layers: state.map.getIn(["layers", appStringsCore.LAYER_GROUP_TYPE_DATA]),
        palettes: state.map.get("palettes")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        mapActionsCore: bindActionCreators(mapActionsCore, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SatelliteLayerSelector);
