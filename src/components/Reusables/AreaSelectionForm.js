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
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import * as appStrings from "constants/appStrings";
import * as mapActions from "actions/mapActions";
import styles from "components/Reusables/AreaSelectionForm.scss";

export class AreaSelectionForm extends Component {
    constructor(props) {
        super(props);

        this.inputBounds = {
            north: 90,
            south: -90,
            east: 180,
            west: -180,
            errors: {}
        };
    }

    updateBoundsFromProps() {
        if (typeof this.props.selectedArea !== "undefined" && this.props.selectedArea.size === 4) {
            this.inputBounds.north = this.props.selectedArea.get(3);
            this.inputBounds.south = this.props.selectedArea.get(1);
            this.inputBounds.east = this.props.selectedArea.get(2);
            this.inputBounds.west = this.props.selectedArea.get(0);
        } else {
            this.inputBounds.north = this.inputBounds.north || 90.0;
            this.inputBounds.south = this.inputBounds.south || -90.0;
            this.inputBounds.east = this.inputBounds.east || 180.0;
            this.inputBounds.west = this.inputBounds.west || -180.0;
        }
    }

    getErrorString() {
        let north = this.inputBounds.north;
        let south = this.inputBounds.south;
        let east = this.inputBounds.east;
        let west = this.inputBounds.west;

        this.inputBounds.errors.north = undefined;
        this.inputBounds.errors.south = undefined;
        this.inputBounds.errors.east = undefined;
        this.inputBounds.errors.west = undefined;

        this.inputBounds.errors.north = north < south ? true : this.inputBounds.errors.north;
        this.inputBounds.errors.south = north < south ? true : this.inputBounds.errors.south;
        // this.inputBounds.errors.east = east < west ? true : this.inputBounds.errors.east;
        // this.inputBounds.errors.west = east < west ? true : this.inputBounds.errors.west;

        this.inputBounds.errors.north = Math.abs(north) > 90 ? true : this.inputBounds.errors.north;
        this.inputBounds.errors.south = Math.abs(south) > 90 ? true : this.inputBounds.errors.south;
        this.inputBounds.errors.east = Math.abs(east) > 180 ? true : this.inputBounds.errors.east;
        this.inputBounds.errors.west = Math.abs(west) > 180 ? true : this.inputBounds.errors.west;
    }

    startDrawing() {
        this.props.enableAreaSelection(appStrings.GEOMETRY_BOX);
        if (typeof this.props.onDraw === "function") {
            this.props.onDraw();
        }
    }

    updateBound(key, val) {
        this.inputBounds[key] = parseFloat(val);
    }

    clearBounds() {
        this.submitArea([]);
    }

    submitArea(area) {
        area = area || [
            this.inputBounds.west,
            this.inputBounds.south,
            this.inputBounds.east,
            this.inputBounds.north
        ];

        if (typeof this.props.onSubmit === "function") {
            this.props.onSubmit(area);
        }
    }

    render() {
        this.updateBoundsFromProps();

        let north = parseFloat(this.inputBounds.north).toString();
        let south = parseFloat(this.inputBounds.south).toString();
        let east = parseFloat(this.inputBounds.east).toString();
        let west = parseFloat(this.inputBounds.west).toString();

        return (
            <div className={styles.root}>
                <Grid container justify="center">
                    <Grid item xs={5}>
                        <TextField
                            id="north_bound"
                            defaultValue={north}
                            label="North"
                            margin="dense"
                            fullWidth={true}
                            onChange={evt => this.updateBound("north", evt.target.value)}
                            inputProps={{
                                type: "number"
                            }}
                        />
                    </Grid>
                </Grid>
                <Grid container justify="space-between">
                    <Grid item xs={5}>
                        <TextField
                            id="west_bound"
                            defaultValue={west}
                            label="West"
                            margin="dense"
                            fullWidth={true}
                            onChange={evt => this.updateBound("west", evt.target.value)}
                            inputProps={{
                                type: "number"
                            }}
                        />
                    </Grid>
                    <Grid item xs={5}>
                        <TextField
                            id="east_bound"
                            defaultValue={east}
                            label="East"
                            margin="dense"
                            fullWidth={true}
                            onChange={evt => this.updateBound("east", evt.target.value)}
                            inputProps={{
                                type: "number"
                            }}
                        />
                    </Grid>
                </Grid>
                <Grid container justify="center">
                    <Grid item xs={5}>
                        <TextField
                            id="south_bound"
                            defaultValue={south}
                            label="South"
                            margin="dense"
                            fullWidth={true}
                            onChange={evt => this.updateBound("south", evt.target.value)}
                            inputProps={{
                                type: "number"
                            }}
                        />
                    </Grid>
                </Grid>
                <Grid container justify="flex-end" className={styles.btnRow}>
                    <Button
                        variant="flat"
                        size="small"
                        color="default"
                        onClick={() => this.clearBounds()}
                    >
                        Clear
                    </Button>
                    <Button
                        variant="flat"
                        size="small"
                        color="default"
                        onClick={() => this.startDrawing()}
                    >
                        Draw
                    </Button>
                    <Button
                        variant="flat"
                        size="small"
                        color="primary"
                        onClick={() => this.submitArea()}
                    >
                        Submit
                    </Button>
                </Grid>
            </div>
        );
    }
}

AreaSelectionForm.propTypes = {
    selectedArea: PropTypes.object,
    onSubmit: PropTypes.func,
    onClear: PropTypes.func,
    onDraw: PropTypes.func,
    className: PropTypes.string,
    enableAreaSelection: PropTypes.func.isRequired,
    disableAreaSelection: PropTypes.func.isRequired
};

function mapDisatchToProps(dispatch) {
    return {
        enableAreaSelection: bindActionCreators(mapActions.enableAreaSelection, dispatch),
        disableAreaSelection: bindActionCreators(mapActions.disableAreaSelection, dispatch)
    };
}

export default connect(null, mapDisatchToProps)(AreaSelectionForm);
