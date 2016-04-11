var emailApp = angular.module('emailApp');
emailApp.directive('elementEditable',['$sce','$compile','$timeout', function($sce,$compile,$timeout){
    return {
        restrict: "A",
        require: 'ngModel',
        scope: true,
        link: link,
        controller: function($scope){
            $scope.trustAsHtml = function(string) {
                return $sce.trustAsHtml(string);
            };
            //$scope.elementData = {};
        }
    };
    function link($scope, element, attrs, ngModel){
        element.bind('click', function (event) {
            if(element.is('.editing')){
                event.stopImmediatePropagation();
                return;
            }
            element.addClass('editing');
            element.hide();
            createEditor($scope, element, attrs, ngModel);
        });
    }
    function createEditor($scope, element, attrs, ngModel){
        var options = {};
        if(attrs.elementEditable){
            options = $scope.$eval(attrs.elementEditable);
        }
        options['wrapper-tag'] = options['wrapper-tag'] || 'div';
        var randID = 'editable-'+(Math.random()*987654321|0);
        var editable = element.after(
            '<'+options['wrapper-tag']+' id="'+randID+'">'+ngModel.$viewValue+'</'+options['wrapper-tag']+'>'
        ).next();
        editable.attr('highlight',"{name:'element', type:'exactly', toggleCurrent: 'false'}");
        editable.attr('ng-style',"element.style");
        editable.addClass('editing text-wrapper');
        editable.on('click', function (event) {
           event.stopImmediatePropagation();
        });

        $compile(editable)($scope);

        //todo: fix element editable, side effect of removing preventDefault from highlight system
        tinymce.init({
            selector:'#'+randID,
            setup: function(editor) {
                editor.on("init", function() {
                    $scope.$apply(function () {
                        $scope.editor = editor;
                    });
                    //editor.setContent($scope.element.content);
                    editor.focus();
                });
                editor.on('change keyup blur click', function (e) {
                    ngModel.$setViewValue(editor.getContent());
                });
                editor.addButton('deleteElement', {
                    icon: 'delete-element',
                    onclick: function () {
                        var filteredElements = $scope.column.elements.filter(function (item) {
                            return item !== $scope.element;
                        });
                        $scope.$apply(function () {
                            $scope.column.elements = filteredElements;
                            closeEditor();
                        });
                    }
                });
            },
            inline: true,
            plugins : 'textcolor colorpicker',
            toolbar: [
                'bold italic underline strikethrough removeformat' +
                ' | alignleft aligncenter alignright alignjustify' +
                ' | bullist numlist outdent indent' +
                ' | deleteElement',

                'forecolor backcolor | formatselect | fontselect fontsizeselect'
            ],
            skin: 'lightgray',
            theme : 'modern',
            menubar: false
        });

        $timeout(function () {
            $('[highlight]').bind('click', handleClickElsewhere);
        });

        function handleClickElsewhere(event){
            var isEditorUI = $(event.target).closest('.mce-tinymce').length;
            if(isEditorUI){
                return;
            }

            $('[highlight]').off('click', handleClickElsewhere);

            $scope.$apply(function () {
                closeEditor();
            });
        }
        function closeEditor() {
            element.show().removeClass('editing');
            editable.remove();
            $scope.editor.remove();
            delete $scope.editor;
        }
    }

}]);