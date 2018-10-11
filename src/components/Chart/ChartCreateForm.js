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
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import { LabelPopover, Checkbox } from "components/Reusables";
import styles from "components/Chart/ChartCreateForm.scss";
import * as chartActions from "actions/chartActions";
import * as appStrings from "constants/appStrings";
import MiscUtil from "utils/MiscUtil";

export class ChartCreateForm extends Component {
    selectAxisVariable(axis, variable) {
        variable = variable !== appStrings.NO_DATA ? variable : undefined;
        this.props.chartActions.setAxisVariable(axis, variable);
    }

    renderTrackList(trackList) {
        if (trackList.size > 0) {
            return trackList.map(track => (
                <Checkbox
                    key={track.get("id") + "_chart_checkbox"}
                    label={track.get("title")}
                    checked={this.props.formOptions.get("selectedTracks").includes(track.get("id"))}
                    onChange={isSelected =>
                        this.props.chartActions.setTrackSelected(track.get("id"), isSelected)
                    }
                />
            ));
        }
        return "No datasets selected";
    }

    renderVariableSelect(sharedVariableSet, nonSharedVariableSet, axis) {
        if (axis !== "xAxis") {
            sharedVariableSet = sharedVariableSet.filter(
                key => key.get("label").indexOf("time") === -1
            );
        }

        if (sharedVariableSet.size > 0) {
            return (
                <RadioGroup
                    aria-label={axis}
                    name={axis}
                    value={this.props.formOptions.get(axis) || appStrings.NO_DATA}
                    onClick={evt => {
                        this.selectAxisVariable(axis, evt.target.value);
                    }}
                    onChange={evt => this.selectAxisVariable(axis, evt.target.value)}
                >
                    {sharedVariableSet.map(variable => (
                        <FormControlLabel
                            key={"shared_var_" + variable.get("label")}
                            value={variable.get("label")}
                            control={<Radio color="primary" />}
                            label={variable.get("label")}
                        />
                    ))}
                    <FormControlLabel
                        value={appStrings.NO_DATA}
                        control={<Radio color="primary" />}
                        label={"None"}
                    />
                </RadioGroup>
            );
        }
        return "No variables available";
    }

    renderVariableSelections(sharedVariableSet, nonSharedVariableSet) {
        let selectorList = [
            { label: "X-Axis", val: "xAxis" },
            { label: "Y-Axis", val: "yAxis" },
            { label: "Z-Axis", val: "zAxis" }
        ];
        return selectorList.map(selector => {
            return (
                <LabelPopover
                    key={"variable_selector_" + selector.val}
                    label={selector.label}
                    subtitle={this.props.formOptions.get(selector.val) || "None"}
                    className={styles.chartOption}
                >
                    {this.renderVariableSelect(
                        sharedVariableSet,
                        nonSharedVariableSet,
                        selector.val
                    )}
                </LabelPopover>
            );
        });
    }

    render() {
        let trackList = this.props.availableTracks
            .filter(track => !track.get("isDisabled") && track.get("isActive"))
            .toList()
            .sort(MiscUtil.getImmutableObjectSort("title"));

        let sharedVariableSet = this.props.formOptions
            .getIn(["variables", "shared"])
            .toList()
            .sortBy(x => x.get("label"));

        let nonSharedVariableSet = this.props.formOptions
            .getIn(["variables", "nonshared"])
            .toList()
            .sortBy(x => x.get("label"));

        let couldCreateChart =
            this.props.formOptions.get("selectedTracks").size > 0 &&
            typeof this.props.formOptions.get("xAxis") !== "undefined" &&
            typeof this.props.formOptions.get("yAxis") !== "undefined";

        let datasetsSubtitle = this.props.formOptions.get("selectedTracks").size + " Selected";
        if (this.props.formOptions.get("selectedTracks").size === 1) {
            datasetsSubtitle = trackList
                .find(track => {
                    return (
                        track.get("id") ===
                        this.props.formOptions
                            .get("selectedTracks")
                            .toList()
                            .get(0)
                    );
                })
                .get("title");
        }

        return (
            <Paper elevation={3} className={styles.root}>
                <div className={styles.options}>
                    <LabelPopover
                        label="Datasets"
                        subtitle={datasetsSubtitle}
                        className={styles.chartOption}
                    >
                        <FormGroup>{this.renderTrackList(trackList)}</FormGroup>
                    </LabelPopover>
                    {this.renderVariableSelections(sharedVariableSet, nonSharedVariableSet)}
                </div>
                <Button
                    variant="raised"
                    size="small"
                    color="primary"
                    disabled={!couldCreateChart}
                    onClick={this.props.chartActions.createChart}
                >
                    Create Chart
                </Button>
            </Paper>
        );
    }
}

ChartCreateForm.propTypes = {
    chartActions: PropTypes.object.isRequired,
    formOptions: PropTypes.object.isRequired,
    availableTracks: PropTypes.object.isRequired
};

function mapStateToProps(state) {
    return {
        formOptions: state.chart.get("formOptions"),
        availableTracks: state.map.getIn(["layers", appStrings.LAYER_GROUP_TYPE_INSITU_DATA])
    };
}

function mapDispatchToProps(dispatch) {
    return {
        chartActions: bindActionCreators(chartActions, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChartCreateForm);
