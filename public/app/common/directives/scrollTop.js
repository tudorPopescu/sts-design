(function () {
  'use strict';
  angular.module('sts-design-app').directive('scrollTop', () => {
    return {
      restrict: 'EA',
      template:'<a title="Înapoi la început"><div id="scrolltag" class="scroll"><i class="fas fa-chevron-up"></i></div></a>',
      link: function(scope, $elm) {
        var scrollObject = {};
        var scrollElement = document.getElementById('scrolltag');
        window.onscroll = getScrollPosition;

        scrollElement.addEventListener("click", scrollToTop, false);

        function getScrollPosition () {
          scrollObject = {
             x: window.pageXOffset,
             y: window.pageYOffset
          }
          if(scrollObject.y > 300) {
            scrollElement.classList.add("visible");
          } else {
            scrollElement.classList.remove("visible");
          }
        }

        function scrollToTop() {
          var scrollDuration = 500;
          var scrollStep = -window.scrollY / (scrollDuration / 15);
          var scrollInterval = setInterval(() => {
            if (window.scrollY != 0) {
              window.scrollBy(0, scrollStep);
            } else {
              clearInterval(scrollInterval);
            }
          }, 15);
        }
      }
    }
  });
})();