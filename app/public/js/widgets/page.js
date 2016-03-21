angular.module('com.johnwoconnor.widgets'
)
.factory('pages', function($location, $log) {
    var pages = [];
    
    var PageService = {};
    PageService.pages = [];
    
    PageService.addPage = function(page) {
        PageService.pages[page.id] = page;
    }
    
    PageService.changePage = function(pageUrl) {
        $log.log("Should now change the location to " + pageUrl);
        $location.path( pageUrl );
    }
    
    return PageService;
    
})
.directive('page', ['$log', '$window', 'pages', function($log, $window, PageService) {
    return {
        restrict: 'EA',
        template: "<div class='page' ng-transclude></div>",
        transclude: true,
        replace: true,
        link: function(scope, element, attrs) {
            var thisPage = {};
            thisPage.id = attrs.pageId;
            thisPage.element = element;
            PageService.addPage(thisPage);
            element.addClass('page');
            element.css('min-height', $window.innerHeight);
            element.css('width', $window.innerWidth);
            $($window).bind('resize',function(){
                element.css('min-height', $window.innerHeight);
                element.css('width', $window.innerWidth);
                $log.log(element.height + 'x' + element.width);
            });
            
        }
    }
}])
.directive('pageContent', ['$log', '$window', 'pages', function($log, $window, PageService) {
    return {
        restrict: 'EA',
        template: '<div class="content" ng-transclude></div>',
        transclude: true,
        replace: true,
        link: function(scope, element, attrs) {
            var thisPage = {};
            thisPage.id = attrs.pageId;
            thisPage.element = element;
            PageService.addPage(thisPage);
            element.addClass('content');
            // element.css('height', $window.innerHeight);
            // element.css('width', $window.innerWidth);
            // $($window).bind('resize',function(){
            //     element.css('height', $window.innerHeight);
            //     element.css('width', $window.innerWidth);
            //     $log.log(element.height + 'x' + element.width);
            // });
            
        }
    }
}])