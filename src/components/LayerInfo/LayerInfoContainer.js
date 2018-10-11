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
import moment from "moment";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import * as appActions from "actions/appActions";
import styles from "components/LayerInfo/LayerInfoContainer.scss";

export class LayerInfoContainer extends Component {
    constructor(props) {
        super(props);

        this.prevLayer = props.layer;
    }

    componentDidUpdate(prevProps) {
        this.prevLayer = this.props.layer;
    }

    renderInfoContent(layer) {
        if (typeof layer !== "undefined") {
            let meta = layer.get("insituMeta");

            return (
                <DialogContent className={styles.content}>
                    <Typography variant="title" className={styles.label}>
                        Project
                    </Typography>
                    <Divider className={styles.divider} />
                    <Typography variant="body1">{meta.get("project") || "N/A"}</Typography>
                    <Typography variant="title" className={styles.label}>
                        Mission
                    </Typography>
                    <Divider className={styles.divider} />
                    <Typography variant="body1">{meta.get("mission") || "N/A"}</Typography>
                    <Typography variant="title" className={styles.label}>
                        Platform
                    </Typography>
                    <Divider className={styles.divider} />
                    <Typography variant="body1">{meta.get("platform") || "N/A"}</Typography>
                    <Typography variant="title" className={styles.label}>
                        Instrument
                    </Typography>
                    <Divider className={styles.divider} />
                    <Typography variant="body1">{meta.get("instrument") || "N/A"}</Typography>
                    <Typography variant="title" className={styles.label}>
                        Variables
                    </Typography>
                    <Divider className={styles.divider} />
                    <Typography variant="body1">
                        {meta
                            .get("variables")
                            .map(x => x.get("label"))
                            .sort()
                            .join(", ") || "N/A"}
                    </Typography>
                    <Typography variant="title" className={styles.label}>
                        Time Range
                    </Typography>
                    <Divider className={styles.divider} />
                    <Typography variant="body1">
                        {moment
                            .unix(meta.get("start_date"))
                            .utc()
                            .format("YYYY MMM DD, HH:mm UTC")}
                        &nbsp;–&nbsp;
                        {moment
                            .unix(meta.get("end_date"))
                            .utc()
                            .format("YYYY MMM DD, HH:mm UTC")}
                    </Typography>
                    <Typography variant="title" className={styles.label}>
                        Spatial Range
                    </Typography>
                    <Divider className={styles.divider} />
                    <Typography variant="body1">
                        {[
                            meta.get("lon_min"),
                            meta.get("lat_min"),
                            meta.get("lon_max"),
                            meta.get("lat_max")
                        ].join(", ")}
                    </Typography>
                    <Typography variant="title" className={styles.label}>
                        Description
                    </Typography>
                    <Divider className={styles.divider} />
                    <Typography variant="body1">{meta.get("description") || "N/A"}</Typography>
                </DialogContent>
            );
        }
        return <DialogContent className={styles.content}>No track available</DialogContent>;
    }

    render() {
        return (
            <Dialog
                classes={{ paper: styles.root }}
                open={typeof this.props.layer !== "undefined"}
                onClose={() => this.props.appActions.setLayerInfo()}
            >
                {this.renderInfoContent(this.props.layer || this.prevLayer)}
            </Dialog>
        );
    }
}

LayerInfoContainer.propTypes = {
    appActions: PropTypes.object.isRequired,
    layer: PropTypes.object,
    className: PropTypes.string
};

function mapStateToProps(state) {
    return {
        layer: state.view.get("layerInfo")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        appActions: bindActionCreators(appActions, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(LayerInfoContainer);
