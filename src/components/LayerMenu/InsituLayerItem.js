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
import RemoveIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";
import { IconButtonSmall, EnhancedTooltip, LoadingSpinner } from "_core/components/Reusables";
import { SingleColorSelector } from "components/Reusables";
import { InsituLayerItemTools } from "components/LayerMenu";
import * as appActions from "actions/appActions";
import * as mapActions from "actions/mapActions";
import styles from "components/LayerMenu/InsituLayerItem.scss";

export class InsituLayerItem extends Component {
    renderLeftAction() {
        if (this.props.layer.get("isLoading")) {
            return <LoadingSpinner className={styles.loader} />;
        } else {
            return (
                <SingleColorSelector
                    color={this.props.layer.get("vectorColor")}
                    className={styles.color}
                    onSelect={colorStr =>
                        this.props.mapActions.setInsituLayerColor(
                            this.props.layer.get("id"),
                            colorStr
                        )
                    }
                />
            );
        }
    }
    render() {
        let subtitle =
            this.props.layer.get("title") === this.props.layer.getIn(["insituMeta", "instrument"])
                ? this.props.layer.getIn(["insituMeta", "platform"])
                : this.props.layer.getIn(["insituMeta", "instrument"]);

        return (
            <div key={this.props.layer.get("id") + "-insitu-menu-item"} className={styles.root}>
                <div className={styles.leftItem}>{this.renderLeftAction()}</div>
                <div className={styles.centerItem}>
                    <EnhancedTooltip
                        disableFocusListener={true}
                        title={subtitle}
                        placement="bottom"
                        PopperProps={{
                            modifiers: {
                                preventOverflow: {
                                    enabled: false
                                },
                                hide: {
                                    enabled: false
                                }
                            }
                        }}
                    >
                        <Typography
                            variant="body1"
                            color="inherit"
                            component="span"
                            className={styles.label}
                        >
                            {this.props.layer.get("title")}
                        </Typography>
                    </EnhancedTooltip>
                </div>
                <div className={styles.rightItem}>
                    <InsituLayerItemTools layer={this.props.layer} />
                    <IconButtonSmall
                        color="inherit"
                        className={styles.actionBtn}
                        disabled={this.props.layer.get("isLoading")}
                        onClick={() =>
                            this.props.appActions.setTrackSelected(
                                this.props.layer.get("id"),
                                false
                            )
                        }
                    >
                        <RemoveIcon />
                    </IconButtonSmall>
                </div>
            </div>
        );
    }
}

InsituLayerItem.propTypes = {
    layer: PropTypes.object.isRequired,
    appActions: PropTypes.object.isRequired,
    mapActions: PropTypes.object.isRequired
};

function mapDispatchToProps(dispatch) {
    return {
        appActions: bindActionCreators(appActions, dispatch),
        mapActions: bindActionCreators(mapActions, dispatch)
    };
}

export default connect(null, mapDispatchToProps)(InsituLayerItem);
