/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Typography from "@material-ui/core/Typography";
import AlertIcon from "@material-ui/icons/ErrorOutline";
import MiscUtil from "utils/MiscUtil";
import styles from "components/Reusables/AreaDefaultMessage.scss";
import displayStyles from "_core/styles/display.scss";

export class AreaDefaultMessage extends Component {
    render() {
        let containerClasses = MiscUtil.generateStringFromSet({
            [styles.root]: true,
            [displayStyles.hidden]: !this.props.active,
            [this.props.className]: typeof this.props.className !== "undefined"
        });
        let sublabelClasses = MiscUtil.generateStringFromSet({
            [styles.sublabel]: true,
            [displayStyles.hidden]: typeof this.props.sublabel === "undefined"
        });
        let icon = typeof this.props.icon !== "undefined" ? this.props.icon : <AlertIcon />;
        return (
            <div className={containerClasses}>
                <div className={styles.icon}>{icon}</div>
                <Typography variant="title" color="inherit" className={styles.label}>
                    {this.props.label}
                </Typography>
                <Typography variant="caption" color="inherit" className={sublabelClasses}>
                    {this.props.sublabel}
                </Typography>
            </div>
        );
    }
}

AreaDefaultMessage.propTypes = {
    label: PropTypes.string.isRequired,
    sublabel: PropTypes.string,
    icon: PropTypes.node,
    active: PropTypes.bool,
    className: PropTypes.string
};

export default connect()(AreaDefaultMessage);
