/*
 * The MIT License
 *
 * Copyright (c) 2013, Sebastian Sdorra
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

angular.module('adf')
  .directive('adfWidget', function($log, $modal, adfDashboardBuilderService, adfDashboardService, adfWidgetService) {

    function preLink($scope, $element, $attr){
      var definition = $scope.definition;
      console.info('prelink - initial definition', definition);

      var widgetModel  = adfWidgetService.buildWidgetModel(definition);

      if(widgetModel){
        //Make sure the scope has all the properties of the generated model
        angular.extend($scope,widgetModel);
        console.dir('scopy',$scope);

        //Make sure we have a title for our widget
          if (!definition.title){
            $scope.definition = widgetModel.widget.title;
          }

        //Init some UI state
        $scope.editMode = $attr.editMode;
        $scope.isCollapsed = false;

      } else {
        $log('Could not load Widget: '+ definition.type);
      }
    }

    function postLink($scope, $element, $attr) {
      var definition = $scope.definition;
      console.info('postlink - initial definition', definition);
      console.info('scope',$scope)
      if (definition) {

        // bind close function
        $scope.close = function() {
          var column = $scope.col;
          if (column) {
            var index = column.widgets.indexOf(definition);
            if (index >= 0) {
              column.widgets.splice(index, 1);
            }
          }
          $element.remove();
        };

        // bind reload function
        $scope.reload = function(){
          $scope.$broadcast('widgetReload');
        };

        // bind edit function
        $scope.edit = function() {
          adfWidgetService.edit($scope);
        };

      } else {
        $log.debug('widget not found');
      }
    }

    return {
      replace: true,
      restrict: 'EA',
      transclude: false,
      templateUrl: '../src/templates/widget.html',
      scope: {
        definition: '=',
        col: '=column',
        editMode: '@',
        collapsible: '='
      },
      compile: function compile($element, $attr, transclude) {

        /**
         * use pre link, because link of widget-content
         * is executed before post link widget
         */
        return {
          pre: preLink,
          post: postLink
        };
      }
    };

  });