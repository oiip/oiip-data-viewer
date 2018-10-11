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
import Immutable from "immutable";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Divider from "@material-ui/core/Divider";
import Slide from "@material-ui/core/Slide";
import appConfig from "constants/appConfig";
import * as chartActions from "actions/chartActions";
import * as appStrings from "constants/appStrings";
import { Checkbox } from "components/Reusables";
import styles from "components/Chart/ChartSettings.scss";

export class ChartSettings extends Component {
    constructor(props) {
        super(props);

        this.displayOptions = Immutable.Map();
        this.defaultOptions = props.displayOptions.delete("isOpen").delete("bounds");
        this.updateTimeout = undefined;
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.displayOptions.get("isOpen") && this.props.displayOptions.get("isOpen")) {
            this.displayOptions = Immutable.Map();
        }
    }

    bufferDisplayOptionsUpdate(options) {
        this.displayOptions = this.displayOptions.mergeDeep(options);
        this.forceUpdate();
        // if (typeof this.updateTimeout !== "undefined") {
        //     clearTimeout(this.updateTimeout);
        //     this.updateTimeout = undefined;
        // }
        // this.updateTimeout = setTimeout(() => {
        //     this.props.chartActions.setChartDisplayOptions(
        //         this.props.chartId,
        //         this.displayOptions.toJS()
        //     );
        //     this.displayOptions = this.displayOptions.clear();
        //     clearTimeout(this.updateTimeout);
        //     this.updateTimeout = undefined;
        // }, 500);
    }

    closeSettings() {
        if (this.props.displayOptions.get("isOpen")) {
            this.props.chartActions.setChartDisplayOptions(this.props.chartId, {
                isOpen: false
            });
        }
    }

    applyChanges() {
        let options = this.displayOptions.toJS();
        this.displayOptions = this.displayOptions.clear();
        this.props.chartActions.setChartDisplayOptions(this.props.chartId, options);
        this.closeSettings();
    }

    resetChanges() {
        this.displayOptions = this.displayOptions.mergeDeep(this.defaultOptions);
        this.forceUpdate();
    }

    renderZMinMaxInput() {
        let displayObj = this.props.displayOptions.mergeDeep(this.displayOptions);
        if (typeof this.props.formOptions.get("zAxis") !== "undefined") {
            return (
                <FormGroup className={styles.formMargin}>
                    <Typography variant="caption">Set Z-Axis Bounds</Typography>
                    <Grid container spacing={16} alignItems="center">
                        <Grid item xs={2}>
                            <Checkbox
                                color="primary"
                                checked={displayObj.get("useCustomZAxisBounds")}
                                onChange={checked => {
                                    this.bufferDisplayOptionsUpdate({
                                        useCustomZAxisBounds: checked
                                    });
                                }}
                            />
                        </Grid>
                        <Grid item xs={5}>
                            <TextField
                                id="min_bound"
                                value={displayObj.get("customZMin").toString()}
                                disabled={!displayObj.get("useCustomZAxisBounds")}
                                label="Z-Axis Min"
                                margin="dense"
                                fullWidth={true}
                                onChange={evt =>
                                    this.bufferDisplayOptionsUpdate({
                                        customZMin: parseFloat(evt.target.value) || 0.0
                                    })
                                }
                                inputProps={{
                                    type: "number"
                                }}
                            />
                        </Grid>
                        <Grid item xs={5}>
                            <TextField
                                id="max_bound"
                                value={displayObj.get("customZMax").toString()}
                                disabled={!displayObj.get("useCustomZAxisBounds")}
                                label="Z-Axis Max"
                                margin="dense"
                                fullWidth={true}
                                onChange={evt =>
                                    this.bufferDisplayOptionsUpdate({
                                        customZMax: parseFloat(evt.target.value) || 0.0
                                    })
                                }
                                inputProps={{
                                    type: "number"
                                }}
                            />
                        </Grid>
                    </Grid>
                </FormGroup>
            );
        } else {
            return "";
        }
    }

    renderDateIntervalLink() {
        let displayObj = this.props.displayOptions.mergeDeep(this.displayOptions);
        if (this.props.formOptions.get("xAxis").indexOf("time") !== -1) {
            return (
                <Checkbox
                    color="primary"
                    label="Link X-Axis to Date Interval"
                    checked={displayObj.get("linkToDateInterval")}
                    onChange={checked => {
                        this.bufferDisplayOptionsUpdate({
                            linkToDateInterval: checked
                        });
                    }}
                />
            );
        } else {
            return "";
        }
    }

    render() {
        let displayObj = this.props.displayOptions.mergeDeep(this.displayOptions);
        return (
            <Slide direction="left" in={displayObj.get("isOpen")}>
                <Paper elevation={2} className={styles.root}>
                    <Paper elevation={0} className={styles.header}>
                        <Typography variant="body2" className={styles.label}>
                            Chart Settings
                        </Typography>
                        <Button
                            size="small"
                            color="inherit"
                            className={styles.btn}
                            onClick={() => {
                                this.resetChanges();
                            }}
                        >
                            Reset
                        </Button>
                        <Button
                            size="small"
                            color="primary"
                            className={styles.btn}
                            onClick={() => {
                                this.applyChanges();
                            }}
                        >
                            Apply
                        </Button>
                    </Paper>
                    <div className={styles.content}>
                        <FormGroup className={styles.formMargin}>
                            <Typography variant="caption">Set Y-Axis Bounds</Typography>
                            <Grid container spacing={16} alignItems="center">
                                <Grid item xs={2}>
                                    <Checkbox
                                        color="primary"
                                        checked={displayObj.get("useCustomYAxisBounds")}
                                        onChange={checked => {
                                            this.bufferDisplayOptionsUpdate({
                                                useCustomYAxisBounds: checked
                                            });
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={5}>
                                    <TextField
                                        id="min_bound"
                                        value={displayObj.get("customYMin").toString()}
                                        disabled={!displayObj.get("useCustomYAxisBounds")}
                                        label="Y-Axis Min"
                                        margin="dense"
                                        fullWidth={true}
                                        onChange={evt =>
                                            this.bufferDisplayOptionsUpdate({
                                                customYMin: parseFloat(evt.target.value) || 0.0
                                            })
                                        }
                                        inputProps={{
                                            type: "number"
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={5}>
                                    <TextField
                                        id="max_bound"
                                        value={displayObj.get("customYMax").toString()}
                                        disabled={!displayObj.get("useCustomYAxisBounds")}
                                        label="Y-Axis Max"
                                        margin="dense"
                                        fullWidth={true}
                                        onChange={evt =>
                                            this.bufferDisplayOptionsUpdate({
                                                customYMax: parseFloat(evt.target.value) || 0.0
                                            })
                                        }
                                        inputProps={{
                                            type: "number"
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </FormGroup>
                        {this.renderZMinMaxInput()}
                        <Divider />
                        <FormGroup>
                            <Checkbox
                                color="primary"
                                label="Invert Y-Axis"
                                checked={displayObj.get("yAxisReversed")}
                                onChange={checked => {
                                    this.bufferDisplayOptionsUpdate({
                                        yAxisReversed: checked
                                    });
                                }}
                            />
                        </FormGroup>
                        {this.renderDateIntervalLink()}
                        <Divider />
                        <FormGroup className={styles.formMargin}>
                            <TextField
                                id={this.props.chartId + "_dec_rate"}
                                value={displayObj.get("decimationRate").toString()}
                                label="Decimation Target"
                                margin="dense"
                                fullWidth={true}
                                onChange={evt =>
                                    this.bufferDisplayOptionsUpdate({
                                        decimationRate:
                                            parseFloat(evt.target.value) ||
                                            appConfig.DEFAULT_DECIMATION_RATE
                                    })
                                }
                                inputProps={{
                                    type: "number"
                                }}
                            />
                        </FormGroup>
                        <FormGroup className={styles.formMargin}>
                            <FormControl>
                                <InputLabel htmlFor="markerType">Display Style</InputLabel>
                                <Select
                                    native={true}
                                    value={displayObj.get("markerType")}
                                    onChange={evt => {
                                        this.bufferDisplayOptionsUpdate({
                                            markerType: evt.target.value
                                        });
                                    }}
                                    inputProps={{
                                        name: "markerType",
                                        id: "markerType"
                                    }}
                                >
                                    {appConfig.CHART_DISPLAY_TYPES.TIME_SERIES.map((entry, i) => {
                                        return (
                                            <option
                                                key={"chart-display-" + i}
                                                value={entry.value}
                                                tabIndex="-1"
                                            >
                                                {entry.label}
                                            </option>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </FormGroup>
                    </div>
                </Paper>
            </Slide>
        );
    }
}

ChartSettings.propTypes = {
    chartId: PropTypes.string.isRequired,
    displayOptions: PropTypes.object.isRequired,
    formOptions: PropTypes.object.isRequired,
    chartActions: PropTypes.object.isRequired
};

function mapDispatchToProps(dispatch) {
    return {
        chartActions: bindActionCreators(chartActions, dispatch)
    };
}

export default connect(null, mapDispatchToProps)(ChartSettings);
