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
import VideoIcon from "@material-ui/icons/Videocam";
import Typography from "@material-ui/core/Typography";
import RightIcon from "mdi-material-ui/MenuRight";
import LeftIcon from "mdi-material-ui/MenuLeft";
import Tooltip from "@material-ui/core/Tooltip";
import { IconButtonSmall } from "_core/components/Reusables";
import { DatePicker, DateIntervalPicker } from "components/DatePicker";
import * as mapActions from "actions/mapActions";
import MiscUtil from "_core/utils/MiscUtil";
import styles from "components/DatePicker/CurrentDatePickerContainer.scss";

export class CurrentDatePickerContainer extends Component {
    render() {
        let containerClasses = MiscUtil.generateStringFromSet({
            [styles.root]: true,
            [this.props.className]: typeof this.props.className !== "undefined"
        });
        return (
            <div className={containerClasses}>
                <div className={styles.hintRow}>
                    <Typography variant="caption" className={styles.intervalDate}>
                        {moment.utc(this.props.intervalDate).format("YYYY MMM DD, HH:mm UTC")}
                    </Typography>
                </div>
                <div className={styles.inlineRow}>
                    <DatePicker
                        date={this.props.date}
                        setDate={this.props.mapActions.setDate}
                        className={styles.picker}
                    />
                    <div className={styles.btns}>
                        <Tooltip disableFocusListener={true} title="Step Back" placement="top">
                            <IconButtonSmall
                                className={styles.thinBtn}
                                onClick={() => this.props.mapActions.stepDate(false)}
                            >
                                <LeftIcon />
                            </IconButtonSmall>
                        </Tooltip>
                        <Tooltip disableFocusListener={true} title="Step Forward" placement="top">
                            <IconButtonSmall
                                className={styles.thinBtn}
                                onClick={() => this.props.mapActions.stepDate(true)}
                            >
                                <RightIcon />
                            </IconButtonSmall>
                        </Tooltip>
                        <DateIntervalPicker />
                        <Tooltip disableFocusListener={true} title="Animation" placement="top">
                            <IconButtonSmall
                                onClick={() => this.props.mapActions.setAnimationOpen(true)}
                            >
                                <VideoIcon />
                            </IconButtonSmall>
                        </Tooltip>
                    </div>
                </div>
            </div>
        );
    }
}

CurrentDatePickerContainer.propTypes = {
    date: PropTypes.object.isRequired,
    intervalDate: PropTypes.object.isRequired,
    mapActions: PropTypes.object.isRequired,
    className: PropTypes.string
};

function mapStateToProps(state) {
    return {
        date: state.map.get("date"),
        intervalDate: state.map.get("intervalDate")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        mapActions: bindActionCreators(mapActions, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(CurrentDatePickerContainer);
