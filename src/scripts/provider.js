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

/**
 * @ngdoc object
 * @name adf.dashboardProvider
 * @description
 *
 * The dashboardProvider can be used to register structures and widgets.
 */
angular.module('adf.provider', [])
  .provider('adfDashboardService',function(){

    //Globals
    var addWidgetController = function(){};
    var addWidgetService = function(){
        return {
            getInitialConfig: function(widgets){
                console.log('This is the default add widget configuration');
                //Do UI or other stuff to figure out which widget to add and its configuration
                configPromise.resolve({});
                }
            }
    };

    return {
        //Customization API
        addController: function(controllerName){
            addWidgetController = controllerName;
        },
        setAddWidgetService: function(overrideService){
            addWidgetService = overrideService;
        },

        $get : function($q, $injector, adfDashboardBuilderService){
            var newWidgetServiceInstance = $injector.invoke(addWidgetService);

            return {

                createConfiguration: function(type){
                  var cfg = {};
                  var config = adfDashboardBuilderService.widgets[type].config;
                  if (config){
                    cfg = angular.copy(config);
                  }
                  return cfg;
                },

                //Service API
                buildWidgetConfig: function(widgetType){
                    var deferred = $q.defer();
                        deferred.resolve({
                            type: widgetType,
                            config: createConfiguration(widgetType)
                        });
                    return deferred.promise;
                },

                addNewWidget: function(){
                    var deferred = $q.defer();

                    newWidgetServiceInstance
                    .newWidgetFlow(adfDashboardBuilderService.widgets)
                        .then(
                            function(config){
                                deferred.resolve(config);
                            },
                            function(){
                                console.log("some sort of error")
                                  deferred.reject();
                            });
                        return deferred.promise;
                },

                getNewWidget: function(){
                    var deferred = $q.defer();

                    var initializedWidget = newWidgetServiceInstance
                        .getInitialConfig( adfDashboardBuilderService.widgets )
                        .then(
                            function adfGetNewWidgetSuccess(widgetType){
                                var w = {
                                  type: widgetType,
                                  config: createConfiguration(widgetType)
                                };

                                deferred.resolve(w);
                            },
                            function adfGetNewWidgetSuccess(){
                                  deferred.reject();
                            });

                return deferred.promise;
                }
            }
        }
    }
  })




  .provider('adfDashboardBuilderService', function(){

    var widgets = {};
    var structures = {};
    var messageTemplate = '<div class="alert alert-danger">{}</div>';
    var loadingTemplate = '\
      <div class="progress progress-striped active">\n\
        <div class="progress-bar" role="progressbar" style="width: 100%">\n\
          <span class="sr-only">loading ...</span>\n\
        </div>\n\
      </div>';

    return {

        /**
        * @ngdoc method
        * @name adf.dashboardProvider#widget
        * @methodOf adf.dashboardProvider
        * @description
        *
        * Registers a new widget.
        *
        * @param {string} name of the widget
        * @param {object} widget to be registered.
        *
        *   Object properties:
        *
        *   - `title` - `{string=}` - The title of the widget.
        *   - `description` - `{string=}` - Description of the widget.
        *   - `config` - `{object}` - Predefined widget configuration.
        *   - `controller` - `{string=|function()=}` - Controller fn that should be
        *      associated with newly created scope of the widget or the name of a
        *      {@link http://docs.angularjs.org/api/angular.Module#controller registered controller}
        *      if passed as a string.
        *   - `template` - `{string=|function()=}` - html template as a string.
        *   - `templateUrl` - `{string=}` - path to an html template.
        *   - `reload` - `{boolean=}` - true if the widget could be reloaded. The default is false.
        *   - `resolve` - `{Object.<string, function>=}` - An optional map of dependencies which should
        *      be injected into the controller. If any of these dependencies are promises, the widget
        *      will wait for them all to be resolved or one to be rejected before the controller is
        *      instantiated.
        *      If all the promises are resolved successfully, the values of the resolved promises are
        *      injected.
        *
        *      The map object is:
        *      - `key` – `{string}`: a name of a dependency to be injected into the controller.
        *      - `factory` - `{string|function}`: If `string` then it is an alias for a service.
        *        Otherwise if function, then it is {@link http://docs.angularjs.org/api/AUTO.$injector#invoke injected}
        *        and the return value is treated as the dependency. If the result is a promise, it is
        *        resolved before its value is injected into the controller.
        *   - `edit` - `{object}` - Edit modus of the widget.
        *      - `controller` - `{string=|function()=}` - Same as above, but for the edit mode of the widget.
        *      - `template` - `{string=|function()=}` - Same as above, but for the edit mode of the widget.
        *      - `templateUrl` - `{string=}` - Same as above, but for the edit mode of the widget.
        *      - `resolve` - `{Object.<string, function>=}` - Same as above, but for the edit mode of the widget.
        *      - `reload` - {boolean} - true if the widget should be reloaded, after the edit mode is closed.
        *        Default is true.
        *
        * @returns {Object} self
        */
        widget : function(name, widget){
          var w = angular.extend({reload: false}, widget)
          if ( w.edit ){
            var edit = {reload: true};
            angular.extend(edit, w.edit);
            w.edit = edit;
          }
          widgets[name] = w;
          return this;
        },

        /**
        * @ngdoc method
        * @name adf.dashboardProvider#structure
        * @methodOf adf.dashboardProvider
        * @description
        *
        * Registers a new structure.
        *
        * @param {string} name of the structure
        * @param {object} structure to be registered.
        *
        *   Object properties:
        *
        *   - `rows` - `{Array.<Object>}` - Rows of the dashboard structure.
        *     - `styleClass` - `{string}` - CSS Class of the row.
        *     - `columns` - `{Array.<Object>}` - Columns of the row.
        *       - `styleClass` - `{string}` - CSS Class of the column.
        *
        * @returns {Object} self
        */
        structure : function(name, structure){
          structures[name] = structure;
          return this;
        },

        /**
        * @ngdoc method
        * @name adf.dashboardProvider#messageTemplate
        * @methodOf adf.dashboardProvider
        * @description
        *
        * Changes the template for messages.
        *
        * @param {string} template for messages.
        *
        * @returns {Object} self
        */

        messageTemplate : function(template){
          messageTemplate = template;
          return this;
        },

           /**
        * @ngdoc method
        * @name adf.dashboardProvider#loadingTemplate
        * @methodOf adf.dashboardProvider
        * @description
        *
        * Changes the template which is displayed as
        * long as the widget resources are not resolved.
        *
        * @param {string} loading template
        *
        * @returns {Object} self
        */
        loadingTemplate : function(template){
          loadingTemplate = template;
          return this;
        },
        /**
        * @ngdoc object
        * @name adf.dashboard
        * @description
        *
        * The dashboard holds all structures and widgets.
        *
        * @returns {Object} self
        */
        $get : function($q, $injector){

          return {
            //Static Properties
            widgets: widgets,
            structures: structures,
            messageTemplate: messageTemplate,
            loadingTemplate: loadingTemplate,

          };
        }
    };

  })
.provider("adfWidgetService",function(){
    var defaultCtrl = function(){
        console.log('This is a default controller you should override this');
    },
    editController = defaultCtrl;

    var retrieveWidget = function(widgetsMap, widgetType){
        return widgetsMap[widgetType];
    }

    //Builds original config for a widget
    var widgetDefaultsConstructor = function( widgetsMap, widgetType ){
          var cfg = {};
          var config = widgetsMap[widgetType].config;
          if (config){
            cfg = angular.copy(config);
          }
          return cfg;
    };

    // Needed to build a model
    var widgetDefinitionConstructor = function(widgetsMap, widgetType ){
        return {
            type: widgetType,
            config: widgetDefaultsConstructor( widgetsMap, widgetType)
        };
    }

    //What we put into a scope
    var widgetModelConstructor = function( widgetsMap, widgetDefinition ){

      var definition = widgetDefinition;
      var widgetModel = {};
      if (definition) {
        var w = widgetsMap[definition.type];
        if (w) {

          // Move to Directive
              if (!definition.title){
                definition.title = w.title;
              }

              // pass edit mode
              //$scope.editMode = $attr.editMode;

              // pass copy of widget to scope
              //$scope.widget =
              widgetModel.widget = angular.copy(w);

          // create config object
          var config = definition.config;
          if (config) {
            if (angular.isString(config)) {
              config = angular.fromJson(config);
            }
          } else {
            config = {};
          }

          // pass config to scope
          //$scope.config = config;
          widgetModel.config = config;

          return widgetModel;
          // collapse
          //$scope.isCollapsed = false;
        } else {
          console.log('could not find widget ' + type);
          return undefined;
        }
      } else {
        $log.debug('definition not specified, widget was probably removed');
        return undefined;
      }
    }




    return {

        editController: function(controllerName){
            editController = controllerName;
        },

        $get : function($controller, adfDashboardBuilderService){

            return {
                buildWidgetDefinition: widgetDefinitionConstructor.bind(this, adfDashboardBuilderService.widgets ),
                buildWidgetModel: widgetModelConstructor.bind( this, adfDashboardBuilderService.widgets ),
                getWidget: retrieveWidget.bind(this, adfDashboardBuilderService.widgets),



                edit:function(scope){
                    $controller( editController , { $scope:scope } );
                },

                delete:function(scope){
                    console.log('delete got called');
                },

                save:function(scope){
                    var widget = scope.widget;
                    if (widget.edit && widget.edit.reload){
                      // reload content after edit dialog is closed
                      scope.$broadcast('widgetConfigChanged');
                    }
                },

                cancel:function(scope){
                    console.log('hey I got cancelled');
                }
            }
        }
    }

});

