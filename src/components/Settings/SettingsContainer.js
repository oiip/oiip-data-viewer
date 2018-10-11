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
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListSubheader from "@material-ui/core/ListSubheader";
import Checkbox from "@material-ui/core/Checkbox";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import SettingsBackupRestoreIcon from "@material-ui/icons/SettingsBackupRestore";
import * as appActionsCore from "_core/actions/appActions";
import * as mapActionsCore from "_core/actions/mapActions";
import appConfig from "constants/appConfig";
import MiscUtil from "_core/utils/MiscUtil";

export class SettingsContainer extends Component {
    render() {
        let containerClasses = MiscUtil.generateStringFromSet({
            [this.props.className]: typeof this.props.className !== "undefined"
        });
        return (
            <List className={containerClasses}>
                <ListSubheader disableSticky>Map Display</ListSubheader>
                <ListItem>
                    <FormControl fullWidth>
                        <InputLabel htmlFor="scale-units-select">Scale Units</InputLabel>
                        <Select
                            value={this.props.mapSettings.get("selectedScaleUnits")}
                            onChange={event =>
                                this.props.mapActionsCore.setScaleUnits(event.target.value)
                            }
                            input={<Input name="Scale Units" id="scale-units-select" />}
                        >
                            {appConfig.SCALE_OPTIONS.map(x => (
                                <MenuItem key={x.value} value={x.value}>
                                    {x.label}
                                    <small style={{ marginLeft: "7px" }}>{x.abbrev}</small>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </ListItem>
                <ListSubheader disableSticky>Application Configuration</ListSubheader>
                <ListItem
                    button
                    onClick={evt =>
                        this.props.appActionsCore.setAutoUpdateUrl(!this.props.autoUpdateUrlEnabled)
                    }
                >
                    <Checkbox
                        color="primary"
                        disableRipple
                        checked={this.props.autoUpdateUrlEnabled}
                    />
                    <ListItemText
                        primary="Auto-Update Url"
                        secondary="Automatically update the url in this window to be shareable"
                    />
                </ListItem>
                <ListItem button onClick={this.props.appActionsCore.resetApplicationState}>
                    <ListItemIcon style={{ margin: "0 12" }}>
                        <SettingsBackupRestoreIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="Reset Application"
                        secondary="Restore the application to its default state"
                    />
                </ListItem>
            </List>
        );
    }
}

SettingsContainer.propTypes = {
    autoUpdateUrlEnabled: PropTypes.bool.isRequired,
    mapSettings: PropTypes.object.isRequired,
    appActionsCore: PropTypes.object.isRequired,
    mapActionsCore: PropTypes.object.isRequired,
    className: PropTypes.string
};

function mapStateToProps(state) {
    return {
        mapSettings: state.map.get("displaySettings"),
        autoUpdateUrlEnabled: state.share.get("autoUpdateUrl")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        appActionsCore: bindActionCreators(appActionsCore, dispatch),
        mapActionsCore: bindActionCreators(mapActionsCore, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsContainer);
