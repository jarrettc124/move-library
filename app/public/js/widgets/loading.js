/**
 * The screen widget that displays the loading ui elements.  Depending on
 * the call, it will either display a modal dialog that prevents interaction
 * with the screen, or display a loading cursor.
 */
angular.module(
        'com.johnwoconnor.widgets'
)
.factory('loading', ['$log', '$q','$document', 'loadingState', function($log, q, $document, loadingState) {
    var opts = {
      lines: 13, // The number of lines to draw
      length: 26, // The length of each line
      width: 23, // The line thickness
      radius: 43, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 54, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#000', // #rgb or #rrggbb or array of colors
      speed: 1, // Rounds per second
      trail: 78, // Afterglow percentage
      shadow: true, // Whether to render a shadow
      hwaccel: true, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: 'auto', // Top position relative to parent in px
      left: 'auto' // Left position relative to parent in px
    };
//    var target = document.body
    var spinner = new Spinner(opts);

    var body = $document.find('body');  
    var modal = $("<div id='loading-modal' class='loading-modal' style='position: absolute; display: block; top: 50%; left: 50%; background-color: rgba(0, 0, 0, 0.5)' ></div>");

    body.append(modal);
    var LoadingWidget = {};
    
    LoadingWidget.busy = function(element) {
       modal.addClass('loading');
       body.addClass('loading');
       spinner.spin(modal[0]);
    //   LoadingWidget.background();
    };
    
    LoadingWidget.idle = function() {
       body.removeClass('loading');
       modal.removeClass('loading');
       spinner.stop();
    };
    
    // Public API
    return LoadingWidget;
}]);