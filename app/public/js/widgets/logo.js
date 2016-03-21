/**
 * Contains a directive for displaying the CardBlanc logo in various forms.
 **/
angular.module('com.johnwoconnor.widgets')
.directive('cbLogo', ['$log', function($log) {
    return {
        restrict: 'EA',
        transclude: false,
        replace: true,
        template: '<div class="cblogo"><span><img src="/img/cb_icon.png" /></span><span class="cblogo_card">CARD</span><span class="cblogo_blanc">BLANC</span><span class="cb_tagline">The ultimate virtual debit card</span></div>',
        link: function($scope, $element, $attrs) {
            $log.log($attrs);
            if (typeof($attrs.stacked) !== 'undefined') {
                $element.addClass('stacked');
            } else if (typeof($attrs.fulltext) !== 'undefined') {
                $element.addClass('fullText');
            } else if (typeof($attrs.words) !== 'undefined') {
                $element.addClass('text')
            }
        }
    }
}])