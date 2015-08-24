angular.module('app.books', [])
       .controller('BooksController', BooksController);

BooksController.$inject = ['$modal', '$window', 'BooksService'];
function BooksController($modal, $window, Book) {
    var my = this;
    my.title = 'Books';
    getList();

    my.edit = function(id) {
        Book.get({id:id}, function(res) {
            openDialog(res, 'edit');
        }, function(errorResponse) {
            console.log(errorResponse);
        });
    };

    my.create = function() {
        openDialog(new Book({}), 'create');
    };

    my.delete = function(id) {
        Book.remove({id:id}, function() {
            getList();
        });
    };

    function getList() {
        Book.query(function(res) {
            my.list = res;
        }, function(errorResponse) {
            console.log(errorResponse);
        });
    }

    function openDialog(obj, mode) {
        var modalInstance = $modal.open({
            templateUrl: 'components/books/dialog.book.html',
            controller: 'DialogBookController',
            animation: false,
            size: 'med',
            resolve: {
                book: function () {
                    return obj;
                }
            }
        });

        modalInstance.result.then(function(modalResults) {
            switch (mode) {
                case 'edit':
                    obj.$update(function(res) {
                        getList();
                    }, function(errorResponse) {
                        console.log(errorResponse);
                    });
                    break;

                case 'create':
                    obj.$save(function(res) {
                        getList();
                    }, function(errorResponse) {
                        console.log(errorResponse);
                    });
                    break;
            }
        });
    }
}
