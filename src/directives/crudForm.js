﻿(function () {
    'use strict';

    angular
        .module('mdCrudModule')
        .directive('mdCrudForm', crudFormDirective);

    crudFormDirective.$inject = ['mdCrudService', 'mdCrudToolsService', '$injector'];

    function crudFormDirective(crudService, toolsService, $injector) {
        
        //Optional services
        var mdpTimePicker;
        try {
            mdpTimePicker = $injector.get('$mdpTimePicker');
        } catch(e) {
        }

        var directive = {
            link: link,
            restrict: 'EA',
            scope: {
                options: "=",
                ngModel: "=",
                onOpen: "=",
                onEdit: "=",
                onCancel: "=",
                onSussces: "=",
                templateUrl: "<?",
                editable: "<?"
            },
            template: '<div ng-include="getContentUrl()"></div>'            
        };
        return directive;

        function link($scope, element, attrs) {
            var text = crudService.text;
            $scope.text = text;

            var translate = crudService.options.translate;
            $scope.translate = translate;
            
            var options = $scope.options;
            $scope.fields = options.fields;
            $scope.readonly = $scope.editable == false;
            
            $scope.ef = toolsService.evalFunction;

            $scope.isLoading = false;

            var idValue = $scope.ngModel[options.id];
            $scope.formTitle = idValue ? (($scope.editable) ? text.editTitle : text.detailTitle) : text.createTitle;
            $scope.formType = idValue ? (($scope.editable) ? "edit" : "detail") : "create";
            $scope.fields = options.fields;
            $scope.item = {};
            $scope.getContentUrl = function(elem,attrs) {
                return $scope.templateUrl || '/views/crudForm.html'
            }
            $scope.showTimePicker = function(ev, item, fieldName) {
                if(mdpTimePicker) {
                    mdpTimePicker(item[fieldName], {
                        targetEvent: ev
                    }).then(function(selectedDate) {
                        item[fieldName] = selectedDate;
                    });
                }
            } 

            if ($scope.onOpen)
                $scope.onOpen($scope.item);

            if (idValue) {                
                $scope.isLoading = true;
                var optionsHttp = {};
                angular.extend(optionsHttp, options.http);
                optionsHttp.entity = options.entity;
                optionsHttp.id = idValue;
                crudService.getById(optionsHttp).then(function (response) {
                    $scope.item = response.data;                    
                    if ($scope.onEdit)
                        $scope.onEdit($scope.item);
                    $scope.isLoading = false;
                }, function(data) {
                    if ($scope.onError)
                        $scope.onError(data);
                    $scope.cancel(data);
                });
            }

            $scope.save = function () {
                var promise;
                var optionsHttp = {};
                angular.extend(optionsHttp, options.http);
                optionsHttp.entity = options.entity;
                optionsHttp.data = $scope.item;
                if (idValue) {                    
                    optionsHttp.id = $scope.item[options.id];
                    promise = crudService.patch(optionsHttp);
                }
                else {
                    promise = crudService.post(optionsHttp);
                }
                $scope.isLoading = true;
                promise.then(function (response) {
                    angular.copy(response.data, $scope.ngModel);
                    if ($scope.onSussces)
                        $scope.onSussces(response.data, $scope.formType);
                    $scope.isLoading = false;
                }, function (data) {
                    if (data.details) {
                        $scope.errors = data.details;
                    }
                    else {
                        $scope.errors = [data.error];
                    }
                    if ($scope.onError)
                        $scope.onError(data);    
                    $scope.isLoading = false;                
                });

            }
            $scope.cancel = function (data) {
                if ($scope.onCancel)
                    $scope.onCancel(data);
            }
            $scope.onMarkerDrag = function (event) {
                $scope.item[this.data.lat] = event.latLng.lat();
                $scope.item[this.data.lng] = event.latLng.lng();
            }           
        }
    }
})();