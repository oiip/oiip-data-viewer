/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import moment from "moment";
import Typography from "@material-ui/core/Typography";
import MiscUtil from "utils/MiscUtil";
import styles from "components/DatePicker/CurrentDateDisplay.scss";

export class CurrentDateDisplay extends Component {
    render() {
        let containerClasses = MiscUtil.generateStringFromSet({
            [styles.root]: true,
            [this.props.className]: typeof this.props.className !== "undefined"
        });
        return (
            <Typography variant="body1" className={containerClasses}>
                {moment.utc(this.props.date).format("YYYY MMM DD, HH:mm UTC")}
            </Typography>
        );
    }
}

CurrentDateDisplay.propTypes = {
    date: PropTypes.object.isRequired,
    className: PropTypes.string
};

function mapStateToProps(state) {
    return {
        date: state.map.get("date")
    };
}

export default connect(mapStateToProps, null)(CurrentDateDisplay);
