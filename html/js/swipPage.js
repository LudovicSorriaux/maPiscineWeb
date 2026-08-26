
$(document).ready(function () {

  // Pages où le swipe de navigation gênerait une interaction tactile propre à la page
  // (ex: pan/zoom du graphique) : on désactive juste le changement de page ici, pas ailleurs.
  var SWIPE_NAV_DISABLED_PAGES = ['pagePiscineGraphs'];

  function swipeNavAllowed() {
    return SWIPE_NAV_DISABLED_PAGES.indexOf($.mobile.activePage.attr('id')) === -1;
  }

  $(document).on("swiperight", function () {
    if (!swipeNavAllowed()) return;
    var nextPage = $.mobile.activePage.attr('nextRight');
    $.mobile.changePage(nextPage, {
      'transition': 'slide',
      'changeHash': false,
      'reverse': true
    });
  });

  $(document).on("swipeleft", function () {
    if (!swipeNavAllowed()) return;
    var nextPage = $.mobile.activePage.attr('nextLeft');
    $.mobile.changePage(nextPage, {
      'transition': 'slide',
      'changeHash': false
    });
  });

});
  