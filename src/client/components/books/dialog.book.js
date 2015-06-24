angular.module('app.books')
       .controller('DialogBookController', DialogBookController);

DialogBookController.$inject = ['$scope', '$modalInstance', 'book'];
function DialogBookController($scope, $modalInstance, book) {
    $scope.book = book;

    $scope.ok = function() {
        $modalInstance.close();
    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
}
