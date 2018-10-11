/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Typography } from "@material-ui/core";
import MiscUtil from "utils/MiscUtil";

export class LayerSearchResultsLabel extends Component {
    render() {
        let trackList = this.props.searchResults.get("results");

        let containerClasses = MiscUtil.generateStringFromSet({
            [this.props.className]: typeof this.props.className !== "undefined"
        });
        return (
            <Typography className={containerClasses} variant="body2">
                Dataset Results ({trackList.size})
            </Typography>
        );
    }
}

LayerSearchResultsLabel.propTypes = {
    className: PropTypes.string,
    searchResults: PropTypes.object.isRequired
};

function mapStateToProps(state) {
    return {
        searchResults: state.view.getIn(["layerSearch", "searchResults"])
    };
}

export default connect(mapStateToProps, null)(LayerSearchResultsLabel);
