
$(document).ready(function () {

  $(document).on("swiperight", function () {
    var nextPage = $.mobile.activePage.attr('nextRight');
    $.mobile.changePage(nextPage, {
      'transition': 'slide',
      'changeHash': false,
      'reverse': true
    });
  });

  $(document).on("swipeleft", function () {
    var nextPage = $.mobile.activePage.attr('nextLeft');
    $.mobile.changePage(nextPage, {
      'transition': 'slide',
      'changeHash': false
    });
  });

});
  