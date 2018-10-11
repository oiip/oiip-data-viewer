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
import Tooltip from "@material-ui/core/Tooltip";
import CloseIcon from "@material-ui/icons/Close";
import SettingsIcon from "@material-ui/icons/Settings";
import { IconButtonSmall } from "_core/components/Reusables";
import * as chartActions from "actions/chartActions";
import styles from "components/Chart/ChartButtons.scss";

export class ChartButtons extends Component {
    render() {
        return (
            <div className={styles.root}>
                <Tooltip
                    disableFocusListener={true}
                    title="Options"
                    placement="bottom"
                    className={styles.btnWrapper}
                >
                    <IconButtonSmall
                        color="inherit"
                        className={styles.btn}
                        disabled={this.props.error}
                        onClick={() => {
                            this.props.chartActions.setChartDisplayOptions(this.props.chartId, {
                                isOpen: true
                            });
                        }}
                    >
                        <SettingsIcon />
                    </IconButtonSmall>
                </Tooltip>
                <Tooltip
                    disableFocusListener={true}
                    title="Close"
                    placement="bottom"
                    className={styles.btnWrapper}
                >
                    <IconButtonSmall
                        color="inherit"
                        className={styles.btn}
                        onClick={() => this.props.chartActions.closeChart(this.props.chartId)}
                    >
                        <CloseIcon />
                    </IconButtonSmall>
                </Tooltip>
            </div>
        );
    }
}

ChartButtons.propTypes = {
    chartId: PropTypes.string.isRequired,
    nodeId: PropTypes.string.isRequired,
    error: PropTypes.bool,
    chartActions: PropTypes.object.isRequired
};

function mapDispatchToProps(dispatch) {
    return {
        chartActions: bindActionCreators(chartActions, dispatch)
    };
}

export default connect(null, mapDispatchToProps)(ChartButtons);
