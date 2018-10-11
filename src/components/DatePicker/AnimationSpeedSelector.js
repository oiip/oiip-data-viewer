import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import List from "@material-ui/core/List";
import ListSubheader from "@material-ui/core/ListSubheader";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import SpeedIcon from "mdi-material-ui/ClockFast";
import { IconPopover } from "components/Reusables";
import * as mapActions from "actions/mapActions";
import appConfig from "constants/appConfig";
import styles from "components/DatePicker/AnimationSpeedSelector.scss";

export class SpeedSelector extends Component {
    render() {
        return (
            <IconPopover
                icon={<SpeedIcon />}
                className={styles.root}
                contentClass={styles.content}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "center"
                }}
                transformOrigin={{
                    vertical: "bottom",
                    horizontal: "center"
                }}
                tooltip="Speed"
            >
                <List subheader={<li />}>
                    <ul className={styles.dummyList}>
                        <ListSubheader className={styles.subheader}>Animation Speed</ListSubheader>
                        <FormGroup className={styles.form}>
                            <RadioGroup
                                aria-label="search_list_sort"
                                name="search_list_sort"
                                value={this.props.speed.toString()}
                                onChange={(evt, val) =>
                                    this.props.mapActions.setAnimationSpeed(parseInt(val))
                                }
                                onClick={evt =>
                                    this.props.mapActions.setAnimationSpeed(
                                        parseInt(evt.target.value)
                                    )
                                }
                            >
                                {appConfig.ANIMATION_SPEEDS.map(entry => (
                                    <FormControlLabel
                                        key={"sort_" + entry.value}
                                        value={entry.value.toString()}
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

SpeedSelector.propTypes = {
    speed: PropTypes.number.isRequired,
    mapActions: PropTypes.object.isRequired
};

function mapStateToProps(state) {
    return {
        speed: state.map.getIn(["animation", "speed"])
    };
}

function mapDispatchToProps(dispatch) {
    return {
        mapActions: bindActionCreators(mapActions, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SpeedSelector);
