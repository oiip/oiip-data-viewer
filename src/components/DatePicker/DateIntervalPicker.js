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
import StepIcon from "mdi-material-ui/DebugStepOver";
import Typography from "@material-ui/core/Typography";
import FormGroup from "@material-ui/core/FormGroup";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
// import { StepIcon } from "components/DatePicker";
import { IconPopover } from "components/Reusables";
import * as mapActions from "actions/mapActions";
import appConfig from "constants/appConfig";
import styles from "components/DatePicker/DateIntervalPicker.scss";

export class DateIntervalPicker extends Component {
    render() {
        return (
            <IconPopover
                icon={<StepIcon />}
                className={styles.root}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "center"
                }}
                transformOrigin={{
                    vertical: "bottom",
                    horizontal: "center"
                }}
                contentClass={styles.content}
                tooltip="Date Interval"
                tooltipPlacement="top"
            >
                <div className={styles.list}>
                    <Typography variant="subheading" className={styles.subheader}>
                        Date Interval
                    </Typography>

                    <div className={styles.form}>
                        <Grid container spacing={8}>
                            <Grid item xs={6}>
                                <TextField
                                    id="date_interval_size"
                                    defaultValue={this.props.dateIntervalSize.toString()}
                                    label="Interval Size"
                                    fullWidth={true}
                                    onChange={evt =>
                                        this.props.mapActions.setDateInterval(
                                            parseInt(evt.target.value),
                                            this.props.dateIntervalScale
                                        )
                                    }
                                    inputProps={{
                                        type: "number"
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <FormGroup>
                                    <FormControl>
                                        <InputLabel htmlFor="dateIntervalScale">
                                            Interval Scale
                                        </InputLabel>
                                        <Select
                                            native={true}
                                            value={this.props.dateIntervalScale}
                                            onChange={evt =>
                                                this.props.mapActions.setDateInterval(
                                                    this.props.dateIntervalSize,
                                                    evt.target.value
                                                )
                                            }
                                            inputProps={{
                                                name: "dateIntervalScale",
                                                id: "dateIntervalScale"
                                            }}
                                        >
                                            {appConfig.DATE_INTERVAL.SCALES.map((entry, i) => {
                                                return (
                                                    <option
                                                        key={"interval-scale-" + i}
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
                            </Grid>
                        </Grid>
                    </div>
                </div>
            </IconPopover>
        );
    }
}

DateIntervalPicker.propTypes = {
    dateIntervalSize: PropTypes.number.isRequired,
    dateIntervalScale: PropTypes.string.isRequired,
    mapActions: PropTypes.object.isRequired
};

function mapStateToProps(state) {
    return {
        dateIntervalSize: state.map.get("dateIntervalSize"),
        dateIntervalScale: state.map.get("dateIntervalScale")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        mapActions: bindActionCreators(mapActions, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(DateIntervalPicker);
