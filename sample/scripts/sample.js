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

angular.module('sample', [
  'adf', 'sample.widgets.news', 'sample.widgets.randommsg',
  'sample.widgets.weather', 'sample.widgets.markdown',
  'sample.widgets.linklist', 'sample.widgets.github',
  'LocalStorageModule', 'structures', 'sample-01', 'sample-02', 'ngRoute'
])
.config(function($routeProvider, localStorageServiceProvider, adfDashboardServiceProvider, adfWidgetServiceProvider){

  localStorageServiceProvider.setPrefix('adf');

  //Configure the editing behavior
adfDashboardServiceProvider
    .setAddWidgetService( function($q, $modal, adfDashboardBuilderService, adfWidgetService){

      var resolveNewWidget = function(widgets){
          var configPromise = $q.defer();
          var opts = {
            templateUrl: '../src/templates/widget-add.html',

            resolve:{
              widgets: function(){ return widgets;}
            },

            controller: function($scope, widgets){
                $scope.widgets = widgets;
            }
          };

          var instance = $modal.open(opts);
          instance.result.then(
            function(result){
              //Create a default definition since this is new
              var widgetDefinition = adfWidgetService.buildWidgetDefinition(result);
              configPromise.resolve( widgetDefinition );
            },
            function(){
              configPromise.reject();
            }
            );
          return configPromise.promise;
      };

      var resolveWidgetInitialSettings = function( widgetDefinition ){

          var configPromise = $q.defer();
          var opts = {
            templateUrl: '../src/templates/widget-edit.html',
            resolve:{
              widgetDefinition: function(){ return widgetDefinition;}
            },
            controller: function( $scope, widgetDefinition, adfWidgetService ){
                var widgetModel = adfWidgetService.buildWidgetModel(widgetDefinition)
                widgetModel.definition = widgetDefinition;
                angular.extend($scope, widgetModel);
            }
          };

          var instance = $modal.open(opts);

          instance.result.then(
            function(result){
              debugger;
              configPromise.resolve(result);
            },
            function(cancel){
              configPromise.reject();
            }
            );
          return configPromise.promise;
      }

    return {

      newWidgetFlow: function(listOfWidgets){
          // A very simple add widget flow
          // 1) Resolve a widget configuration
          // 2) Launch the editor so the user can configure the widget
          return resolveNewWidget(listOfWidgets)
                .then(resolveWidgetInitialSettings);
      }
    };
  })

  adfWidgetServiceProvider
    .editController('editWidgetController');

  $routeProvider.when('/sample/01', {
    templateUrl: 'partials/sample.html',
    controller: 'sample01Ctrl'
  })
  .when('/sample/02', {
    templateUrl: 'partials/sample.html',
    controller: 'sample02Ctrl'
  })
  .otherwise({
    redirectTo: '/sample/01'
  });

})

.controller('editWidgetController',function( $scope, $modal, adfWidgetService){

          //Build scope
          var editScope = $scope.$new();



          //if this is an add
          //set the scope to the current list of widgets

          //Setup modal
          var opts = {
            scope: editScope,
            templateUrl: '../src/templates/widget-edit.html'
          };

          //Instantiate Modal
          var instance = $modal.open(opts);

          $scope.cancelEdits = function() {
            console.log('Cancel the edits');
          }

          $scope.saveEdits = function() {
            instance.close();
            editScope.$destroy();
            adfWidgetService.save($scope);
          };
})
.controller('navigationCtrl', function($scope, $location){

  $scope.navCollapsed = true;

  $scope.toggleNav = function(){
    $scope.navCollapsed = !$scope.navCollapsed;
  };

  $scope.$on('$routeChangeStart', function() {
    $scope.navCollapsed = true;
  });

  $scope.navClass = function(page) {
    var currentRoute = $location.path().substring(1) || 'Sample 01';
    return page === currentRoute || new RegExp(page).test(currentRoute) ? 'active' : '';
  };

});