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
import moment from "moment";
import TargetIcon from "mdi-material-ui/Target";
import BuildIcon from "@material-ui/icons/Build";
import InfoIcon from "@material-ui/icons/InfoOutline";
import DeleteIcon from "@material-ui/icons/Delete";
import CalendarRangeIcon from "mdi-material-ui/CalendarRange";
import PointErrorIcon from "mdi-material-ui/ImageFilterTiltShift";
import Divider from "@material-ui/core/Divider";
import MenuList from "@material-ui/core/MenuList";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import { IconPopover } from "components/Reusables";
import * as appActions from "actions/appActions";
import * as mapActions from "actions/mapActions";
import * as mapActionsCore from "_core/actions/mapActions";
import styles from "components/LayerMenu/InsituLayerItemTools.scss";

export class InsituLayerItemTools extends Component {
    handleSetAnimationRange() {
        let startDate = moment
            .unix(this.props.layer.getIn(["insituMeta", "start_date"]))
            .utc()
            .toDate();
        let endDate = moment
            .unix(this.props.layer.getIn(["insituMeta", "end_date"]))
            .utc()
            .toDate();
        this.props.mapActions.setAnimationOpen(true);
        this.props.mapActions.setAnimationDateRange(startDate, endDate);
    }

    render() {
        return (
            <IconPopover
                icon={<BuildIcon />}
                className={styles.root}
                contentClass={styles.content}
                disabled={this.props.layer.get("isLoading")}
                anchorOrigin={{
                    vertical: "center",
                    horizontal: "right"
                }}
                transformOrigin={{
                    vertical: "center",
                    horizontal: "left"
                }}
            >
                <MenuList dense>
                    <MenuItem
                        className={styles.toolItem}
                        onClick={() => this.props.appActions.setLayerInfo(this.props.layer)}
                        aria-label="Track info"
                    >
                        <ListItemIcon classes={{ root: styles.listItemIcon }}>
                            <InfoIcon />
                        </ListItemIcon>
                        <ListItemText inset primary="Track Info" />
                    </MenuItem>
                    <MenuItem
                        className={styles.toolItem}
                        onClick={() =>
                            this.props.mapActions.zoomToLayer(this.props.layer.get("id"))
                        }
                        aria-label="Zoom-to Track"
                    >
                        <ListItemIcon classes={{ root: styles.listItemIcon }}>
                            <TargetIcon />
                        </ListItemIcon>
                        <ListItemText inset primary="Zoom-To Track" />
                    </MenuItem>
                    <MenuItem
                        className={styles.toolItem}
                        onClick={() =>
                            this.props.appActions.setTrackErrorActive(
                                this.props.layer.get("id"),
                                !this.props.layer.get("isErrorActive")
                            )
                        }
                        aria-label="Track Error Ellipses"
                    >
                        <ListItemIcon classes={{ root: styles.listItemIcon }}>
                            <PointErrorIcon />
                        </ListItemIcon>
                        <ListItemText
                            inset
                            primary={
                                (this.props.layer.get("isErrorActive") ? "Disable" : "Enable") +
                                " Error Ellipses"
                            }
                        />
                    </MenuItem>
                    <MenuItem
                        className={styles.toolItem}
                        onClick={() => this.handleSetAnimationRange()}
                        aria-label="Set Animation Bounds"
                    >
                        <ListItemIcon classes={{ root: styles.listItemIcon }}>
                            <CalendarRangeIcon />
                        </ListItemIcon>
                        <ListItemText inset primary="Set Animation Range" />
                    </MenuItem>
                    <Divider />
                    <MenuItem
                        className={styles.toolItem}
                        onClick={() =>
                            this.props.appActions.setTrackSelected(
                                this.props.layer.get("id"),
                                false
                            )
                        }
                        aria-label="Remove Track"
                    >
                        <ListItemIcon classes={{ root: styles.listItemIcon }}>
                            <DeleteIcon />
                        </ListItemIcon>
                        <ListItemText inset primary="Remove Track" />
                    </MenuItem>
                </MenuList>
            </IconPopover>
        );
    }
}

InsituLayerItemTools.propTypes = {
    layer: PropTypes.object.isRequired,
    appActions: PropTypes.object.isRequired,
    mapActions: PropTypes.object.isRequired,
    mapActionsCore: PropTypes.object.isRequired
};

function mapDispatchToProps(dispatch) {
    return {
        appActions: bindActionCreators(appActions, dispatch),
        mapActions: bindActionCreators(mapActions, dispatch),
        mapActionsCore: bindActionCreators(mapActionsCore, dispatch)
    };
}

export default connect(null, mapDispatchToProps)(InsituLayerItemTools);
