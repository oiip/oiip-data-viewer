/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import MiscUtil from "utils/MiscUtil";
import * as appStrings from "constants/appStrings";
import { TrackDataDisplay } from "components/MouseFollower";
import displayStyles from "_core/styles/display.scss";
import styles from "components/MouseFollower/DataDisplayContainer.scss";

export class DataDisplayContainer extends Component {
    getDataDisplay(entry, i) {
        if (entry.getIn(["layer", "type"]) === appStrings.LAYER_GROUP_TYPE_INSITU_DATA) {
            return <TrackDataDisplay key={"mouse-follow-data-" + i} data={entry} />;
        }
        return "";
    }
    render() {
        let classes = MiscUtil.generateStringFromSet({
            [styles.root]: true,
            [this.props.className]: typeof this.props.className !== "undefined"
        });
        return (
            <div className={classes}>
                {this.props.data.map((entry, i) => this.getDataDisplay(entry, i))}
            </div>
        );
    }
}

DataDisplayContainer.propTypes = {
    data: PropTypes.object.isRequired,
    className: PropTypes.string
};

export default connect()(DataDisplayContainer);
