/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from "react";
import PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import styles from "components/Reusables/EnhancedFormControlLabel.scss";

const EnhancedFormControlLabel = props => {
    let { rightLabel, ...other } = props;
    return (
        <div className={styles.root}>
            <FormControlLabel className={styles.label} {...other} />
            <Typography variant="caption" className={styles.rightLabel}>
                {rightLabel}
            </Typography>
        </div>
    );
};

EnhancedFormControlLabel.propTypes = {
    rightLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default EnhancedFormControlLabel;
