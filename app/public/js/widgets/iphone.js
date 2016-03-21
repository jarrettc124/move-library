/**
 * Contains a directive for displaying the CardBlanc logo in various forms.
 **/
angular.module('com.johnwoconnor.widgets')
.directive('iphone', ['$log', function($log) {
    var template = '<div class="iphone-container"><div class="iphone"><div class="iphone-light-gradient"></div><div class="iphone-power-button"></div>'
        + '<div class="iphone-voice-toogle"></div><div class="iphone-voice-plus"></div><div class="iphone-voice-minus"></div><div class="iphone-camera"></div>'
        + '<div class="iphone-dynamic"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>'
        + '<div class="iphone-black-bg"></div><div class="iphone-display"><div class="iphone-display-content" ng-transclude></div><div class="iphone-headline">'
        + '<div class="iphone-net"></div><div class="iphone-net-title">AT&amp;T</div><div class="iphone-wi-fi"><div class="hack"></div></div><div class="iphone-headline-time">00:00</div><div class="iphone-battery"></div></div>'
        + '<div class="iphone-dock" id="iphone_dock"><div class="iphone-icon"><div class="i_phone"><div class="bg_angled"></div><div class="truba"><b></b></div></div><span class="icon-title">Phone</span></div>'
        + '<div class="iphone-icon"><div class="i_contacts"><div class="left_side"><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/></div><div class="right_side">a<br/>b<br/>c<br/>d<br/>e<br/>f</div>'
        + '<div class="profile"><div class="head"></div><div class="neck"></div></div></div><span class="icon-title">Contacts</span></div>'
        + '<div class="iphone-icon"><div class="i_camera"><div class="eye"><div class="blick"><b></b></div></div></div><span class="icon-title">Camera</span></div>'
        + '<div class="iphone-icon"><div class="i_music"><div class="nota"></div><div class="nota2"></div><div class="glow"></div></div><span class="icon-title">Music</span></div></div></div><div class="iphone-home" id="iphone_home_button"></div></div></div>';
    return {
        restrict: 'EA',
        transclude: true,
        template: template,
        link: function($scope, $element, $attrs) {
            $log.log($attrs);
        }
    }
}])