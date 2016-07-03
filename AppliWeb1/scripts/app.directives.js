angular.module('constellation.directives', [])
    .directive('hrefVoid', function () {
        return function (scope, element, attrs) {
            element.attr("href", "javascript:void(0);")
        };
    })
    .directive('dynamicElapsedTime', function ($timeout, elapsedTimeFilter) {
        return function (scope, element, attrs) {
            var timeoutId, since;
            // used to update the UI
            function updateTime() {
                element.text(elapsedTimeFilter(since));
            }
            // watch the expression, and update the UI on change.
            scope.$watch(attrs.dynamicElapsedTime, function (value) {
                since = value;
                updateTime();
            });
            // schedule update in one second
            function updateLater() {
                // save the timeoutId for canceling
                timeoutId = $timeout(function () {
                    updateTime(); // update DOM
                    updateLater(); // schedule another update
                }, 1000);
            }
            // listen on DOM destroy (removal) event, and cancel the next UI update
            // to prevent updating time ofter the DOM element was removed.
            element.bind('$destroy', function () {
                $timeout.cancel(timeoutId);
            });
            updateLater(); // kick off the UI update process.
        }
    })
    .directive('uiSrefIf', function ($compile) {
        return {
            scope: {
                val: '@uiSrefVal',
                if: '=uiSrefIf'
            },
            link: function ($scope, $element, $attrs) {
                $element.removeAttr('ui-sref-if');
                $compile($element)($scope);

                $scope.$watch('if', function (bool) {
                    if (bool) {
                        $element.attr('ui-sref', $scope.val);
                    } else {
                        $element.removeAttr('ui-sref');
                        $element.removeAttr('href');
                    }
                    $compile($element)($scope);
                });
            }
        };
    });