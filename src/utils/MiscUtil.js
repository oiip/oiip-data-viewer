/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import MiscUtilCore from "_core/utils/MiscUtil";

export default class MiscUtil extends MiscUtilCore {
    // Find closest ancestor to dom element el matching selector
    // From: http://stackoverflow.com/questions/18663941/finding-closest-element-without-jquery
    // A replacement for JQuery.closest
    static closest(el, selector) {
        let matchesFn;

        // find vendor prefix
        [
            "matches",
            "webkitMatchesSelector",
            "mozMatchesSelector",
            "msMatchesSelector",
            "oMatchesSelector"
        ].some(function(fn) {
            if (typeof document.body[fn] == "function") {
                matchesFn = fn;
                return true;
            }
            return false;
        });

        let parent;

        // traverse parents
        while (el) {
            if (el[matchesFn](selector)) {
                return el;
            }

            el = el.parentElement;
        }

        return null;
    }

    static getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    }
}
