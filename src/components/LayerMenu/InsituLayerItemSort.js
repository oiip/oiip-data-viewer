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
import List from "@material-ui/core/List";
import ListSubheader from "@material-ui/core/ListSubheader";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
// import SortIcon from "mdi-material-ui/Sort";
import SortIcon from "mdi-material-ui/SortAlphabetical";
import { IconPopover } from "components/Reusables";
import * as mapActions from "actions/mapActions";
import appConfig from "constants/appConfig";
import styles from "components/LayerMenu/InsituLayerItemSort.scss";

export class InsituLayerItemSort extends Component {
    render() {
        return (
            <IconPopover icon={<SortIcon />} contentClass={styles.content} tooltip="Label By">
                <List subheader={<li />}>
                    <ul className={styles.dummyList}>
                        <ListSubheader className={styles.subheader}>Label By</ListSubheader>
                        <FormGroup className={styles.form}>
                            <RadioGroup
                                aria-label="insitu_item_label"
                                name="insitu_item_label"
                                value={this.props.sortParam}
                                onChange={(evt, val) =>
                                    this.props.mapActions.setInsituLayerTitles(val)
                                }
                                onClick={evt =>
                                    this.props.mapActions.setInsituLayerTitles(evt.target.value)
                                }
                            >
                                {appConfig.INSITU_TITLE_FIELDS.map(entry => (
                                    <FormControlLabel
                                        key={"sort_" + entry.value}
                                        value={entry.value}
                                        control={<Radio color="primary" />}
                                        label={entry.label}
                                    />
                                ))}
                            </RadioGroup>
                        </FormGroup>
                    </ul>
                </List>
            </IconPopover>
        );
    }
}

InsituLayerItemSort.propTypes = {
    sortParam: PropTypes.string.isRequired,
    mapActions: PropTypes.object.isRequired
};

function mapStateToProps(state) {
    return {
        sortParam: state.map.get("insituLayerTitleField")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        mapActions: bindActionCreators(mapActions, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(InsituLayerItemSort);
